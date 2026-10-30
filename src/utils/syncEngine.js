import { useEffect, useState } from 'react';
import { openDB } from './localDBHelpers';
import { syncOps, syncOpsKeepalive } from './apiGatewayClient';

const DB_NAME = 'listpal-local';
const DB_VERSION = 2;
const STORE = 'outbox';
const MAX_BATCH = 50;
const TYPING_DELAY = 2000;
const ACTION_DELAY = 500;
const MAX_WAIT = 10000;
const BASE_BACKOFF = 2000;
const MAX_BACKOFF = 60000;
// Long enough for a normal sync to finish before a load reads from the server, short enough not to stall when offline
export const LOAD_FLUSH_TIMEOUT = 3000;

export const TASK_FIELDS = ['Description', 'Category', 'Emoji', 'Important', 'Link', 'CompletedDate', 'ExpiryDate', 'GSI1-SK', 'ExpiryDateTTL', 'CreatedDate'];
const SETTLED_STATUSES = ['applied', 'gone', 'rejected'];
const RETRY_STATUSES = ['retry', 'conflict'];

let dbPromise = null;
let flushTimer = null;
let firstQueuedAt = null;
let retryAt = 0;
let failures = 0;
let inFlight = null;
let started = false;
let pendingRecords = [];
let onBoardScores = () => { };
let status = { pending: 0, syncing: false, lastError: null };
const listeners = new Set();

// Pure merge of a new change into the outbox record for the same task or board. Returns null to drop the record.
export function mergeRecord(existing, { SK, boardID, kind, fields = {} }) {
  if (!existing) {
    return { SK, boardID, kind, fields: { ...fields }, rev: 1 };
  }
  const rev = existing.rev + 1;
  // Nothing can follow a delete, and a late edit must not bring the task back
  if (existing.kind === 'delete') return existing;
  if (kind === 'delete') {
    // A create the server has never been sent can simply be forgotten
    if (existing.kind === 'create' && !existing.maybeOnServer) return null;
    return { SK, boardID: existing.boardID, kind: 'delete', fields: {}, rev };
  }
  return { ...existing, fields: { ...existing.fields, ...fields }, rev };
}

// Board settings records share the outbox, keyed on the board ID
const isTaskRecord = r => r.SK.startsWith('t#');
const isBoardRecord = r => r.SK.startsWith('b#');

// Pure overlay of queued changes onto tasks fetched from the server, so a reload shows unsynced edits.
export function applyPending(tasks, records, boardID) {
  const bySK = new Map(tasks.map(t => [t.SK, t]));
  records.filter(r => isTaskRecord(r) && r.boardID === boardID).forEach(r => {
    if (r.kind === 'delete') {
      bySK.delete(r.SK);
    } else if (bySK.has(r.SK)) {
      bySK.set(r.SK, { ...bySK.get(r.SK), ...r.fields });
    } else if (r.kind === 'create') {
      bySK.set(r.SK, { SK: r.SK, 'GSI1-PK': boardID, EntityType: 'Task', ...r.fields });
    }
  });
  return [...bySK.values()];
}

// Pure overlay of queued settings onto boards already parsed from the server. A board the server no longer
// has stays gone, as its queued edit will come back gone too.
export function applyPendingBoards(boards, records) {
  const pending = new Map(records.filter(isBoardRecord).map(r => [r.SK, r.fields]));
  return boards.map(board => {
    const fields = pending.get(board.SK);
    if (!fields) return board;
    const { CategoryOrder, ...rest } = fields;
    return { ...board, ...rest, ...(CategoryOrder !== undefined && { CategoryOrder: JSON.parse(CategoryOrder) }) };
  });
}

// Boards whose scores the server can't know yet, because a tick on them is still queued
export const boardsWithQueuedTasks = records => new Set(records.filter(isTaskRecord).map(r => r.boardID));

// Pure union of two outbox reads taken either side of a flush. A record settled in between is still in
// the first read, so it covers a fetch that ran before the server applied it; the later read wins per task.
export function mergePending(before, after) {
  const bySK = new Map(before.map(r => [r.SK, r]));
  after.forEach(r => bySK.set(r.SK, r));
  return [...bySK.values()];
}

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, (db) => {
      // Version 1 held whole task records that were wiped on every load, so there is nothing to migrate
      if (db.objectStoreNames.contains('tasks')) db.deleteObjectStore('tasks');
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'SK' });
    }).then(db => {
      db.onversionchange = () => db.close();
      return db;
    });
  }
  return dbPromise;
}

// Every read-modify-write happens inside one transaction so concurrent edits cannot interleave
function withStore(mode, work) {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let result;
    work(tx.objectStore(STORE), value => { result = value; });
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

function readAll() {
  return withStore('readonly', (store, setResult) => {
    const request = store.getAll();
    request.onsuccess = () => setResult(request.result);
  });
}

async function refreshPending() {
  pendingRecords = await readAll();
  setStatus({ pending: pendingRecords.length });
  return pendingRecords;
}

function setStatus(patch) {
  // Every keystroke refreshes the count, and each notification re-renders the status indicator
  if (Object.keys(patch).every(key => status[key] === patch[key])) return;
  status = { ...status, ...patch };
  listeners.forEach(fn => fn(status));
}

function pickFields(task) {
  return Object.fromEntries(TASK_FIELDS.filter(f => task[f] !== undefined).map(f => [f, task[f]]));
}

// Category actions queue a change per task; doing them in one transaction keeps the outbox consistent
// if the page closes part way through
async function queue(changes, delay) {
  if (!changes.length) return;
  await withStore('readwrite', store => {
    changes.forEach(change => {
      const request = store.get(change.SK);
      request.onsuccess = () => {
        const next = mergeRecord(request.result, change);
        if (next) store.put(next);
        else store.delete(change.SK);
      };
    });
  });
  await refreshPending();
  schedule(delay);
}

export function queueCreate(task) {
  return queue([{ SK: task.SK, boardID: task['GSI1-PK'], kind: 'create', fields: pickFields(task) }], ACTION_DELAY);
}

export function queueUpdate(SK, boardID, fields, { typing = false } = {}) {
  return queue([{ SK, boardID, kind: 'update', fields }], typing ? TYPING_DELAY : ACTION_DELAY);
}

export function queueDelete(SK, boardID) {
  return queue([{ SK, boardID, kind: 'delete' }], ACTION_DELAY);
}

// Same fields on every task, e.g. a category rename or card emoji
export function queueUpdateAll(tasks, fields) {
  return queue(tasks.map(t => ({ SK: t.SK, boardID: t['GSI1-PK'], kind: 'update', fields })), ACTION_DELAY);
}

export function queueDeleteAll(tasks) {
  return queue(tasks.map(t => ({ SK: t.SK, boardID: t['GSI1-PK'], kind: 'delete' })), ACTION_DELAY);
}

// Board name, emoji, category order or targets. CategoryOrder goes as the JSON string the server stores.
export function queueBoardUpdate(boardID, fields) {
  return queue([{ SK: boardID, boardID, kind: 'update', fields }], ACTION_DELAY);
}

function schedule(delay) {
  const now = Date.now();
  if (firstQueuedAt === null) firstQueuedAt = now;
  // Continuous typing would otherwise keep pushing the sync back forever
  let wait = Math.min(delay, firstQueuedAt + MAX_WAIT - now);
  // Do not let new edits hammer a server that is already failing
  wait = Math.max(wait, retryAt - now, 0);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushNow(), wait);
}

function scheduleRetry() {
  const base = Math.min(MAX_BACKOFF, BASE_BACKOFF * 2 ** Math.max(0, failures - 1));
  const delay = base / 2 + Math.random() * base / 2;
  retryAt = Date.now() + delay;
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushNow(), delay);
}

function withLock(work) {
  // One tab at a time, otherwise two tabs could send the same records and settle each other's acks
  if (globalThis.navigator?.locks?.request) return navigator.locks.request('listpal-sync', work);
  return work();
}

const toOp = r => ({ opId: `${r.SK}:${r.rev}`, SK: r.SK, boardID: r.boardID, kind: r.kind, fields: r.fields });

async function markMaybeOnServer(records) {
  const creates = records.filter(r => r.kind === 'create' && !r.maybeOnServer);
  if (!creates.length) return;
  await withStore('readwrite', store => {
    creates.forEach(sent => {
      const request = store.get(sent.SK);
      request.onsuccess = () => {
        if (request.result) store.put({ ...request.result, maybeOnServer: true });
      };
    });
  });
}

function settle(results, sentRecords) {
  const sentBySK = new Map(sentRecords.map(r => [r.SK, r]));
  return withStore('readwrite', store => {
    results.forEach(result => {
      const sent = sentBySK.get(result.SK);
      if (!sent || !SETTLED_STATUSES.includes(result.status)) return;
      const request = store.get(result.SK);
      request.onsuccess = () => {
        const current = request.result;
        if (!current) return;
        // Applied but edited again while the request was in flight: keep the newer edits for the next flush
        if (result.status === 'applied' && current.rev !== sent.rev) {
          if (current.kind === 'create') store.put({ ...current, kind: 'update' });
          return;
        }
        store.delete(result.SK);
      };
    });
  });
}

async function sendBatch() {
  const records = (await readAll()).slice(0, MAX_BATCH);
  if (!records.length) {
    failures = 0;
    retryAt = 0;
    setStatus({ pending: 0, syncing: false, lastError: null });
    return;
  }

  setStatus({ syncing: true });
  try {
    await markMaybeOnServer(records);
    const response = await syncOps(records.map(toOp));
    if (!Array.isArray(response?.results)) throw new Error('Unexpected sync response');

    await settle(response.results, records);
    const remaining = await refreshPending();

    // Scores for a board with more task changes queued would be out of date by the time they render
    const boardsWithPending = boardsWithQueuedTasks(remaining);
    const settledScores = (response.boards ?? []).filter(b => !boardsWithPending.has(b.SK));
    if (settledScores.length) onBoardScores(settledScores);

    const needsRetry = response.results.some(r => RETRY_STATUSES.includes(r.status));
    setStatus({ syncing: false, lastError: needsRetry ? 'Some changes will be retried' : null });
    if (needsRetry) {
      failures++;
      scheduleRetry();
    } else {
      failures = 0;
      retryAt = 0;
      if (remaining.length) schedule(ACTION_DELAY);
    }
  } catch (error) {
    console.error('Sync failed, will retry:', error);
    failures++;
    setStatus({ syncing: false, lastError: globalThis.navigator?.onLine === false ? 'Offline' : (error.message || 'Sync failed') });
    scheduleRetry();
  }
}

// Resolves once everything queued before the call has been attempted. Never rejects.
export async function flushNow({ timeout } = {}) {
  clearTimeout(flushTimer);
  firstQueuedAt = null;
  const run = (async () => {
    while (inFlight) await inFlight;
    inFlight = withLock(sendBatch)
      .catch(error => console.error('Sync lock failed:', error))
      .finally(() => { inFlight = null; });
    return inFlight;
  })();
  if (!timeout) return run;
  return Promise.race([run, new Promise(resolve => setTimeout(resolve, timeout))]);
}

// IndexedDB is async, so on exit we can only send what is already in memory. The records stay
// queued either way and are resent on the next load, which the server treats as a no-op.
function flushOnExit() {
  if (!pendingRecords.length) return;
  syncOpsKeepalive(pendingRecords.slice(0, MAX_BATCH).map(toOp));
}

export const readPending = () => readAll();

export function startSync(options = {}) {
  if (options.onBoardScores) onBoardScores = options.onBoardScores;
  if (started) return;
  started = true;
  window.addEventListener('online', () => flushNow());
  window.addEventListener('pagehide', flushOnExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushNow();
  });
  refreshPending().then(records => {
    if (records.length) flushNow();
  }).catch(error => console.error('Could not open the local outbox:', error));
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

// For one-off reads outside React, such as the beforeunload check, which must not re-render on every change
export const getSyncStatus = () => status;

export function useSyncStatus() {
  const [current, setCurrent] = useState(status);
  useEffect(() => subscribe(setCurrent), []);
  return current;
}
