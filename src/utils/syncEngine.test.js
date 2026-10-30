import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

vi.mock('./apiGatewayClient', () => ({
  syncOps: vi.fn(),
  syncOpsKeepalive: vi.fn()
}));

const BOARD = 'b#board';
const task = (SK, fields = {}) => ({ SK, 'GSI1-PK': BOARD, Description: '', Category: 'Inbox', CompletedDate: 'nil', CreatedDate: '1', ...fields });
const applied = ops => ({ results: ops.map(op => ({ opId: op.opId, SK: op.SK, status: 'applied' })), boards: [] });

let engine;
let api;

beforeEach(async () => {
  // Fresh database and fresh module state for every test
  globalThis.indexedDB = new IDBFactory();
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.resetModules();
  engine = await import('./syncEngine');
  api = await import('./apiGatewayClient');
  api.syncOps.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const pendingCount = () => {
  let current;
  engine.subscribe(s => { current = s; })();
  return current.pending;
};
const sentOps = call => api.syncOps.mock.calls[call][0];

describe('mergeRecord', () => {
  const change = (kind, fields) => ({ SK: 't#1', boardID: BOARD, kind, fields });

  it('folds updates into a create', () => {
    const created = engine.mergeRecord(undefined, change('create', { Description: 'a' }));
    const merged = engine.mergeRecord(created, change('update', { Important: 'true' }));
    expect(merged).toMatchObject({ kind: 'create', fields: { Description: 'a', Important: 'true' }, rev: 2 });
  });

  it('later updates win field by field', () => {
    const first = engine.mergeRecord(undefined, change('update', { Description: 'a', Link: 'x' }));
    const merged = engine.mergeRecord(first, change('update', { Description: 'b' }));
    expect(merged.fields).toEqual({ Description: 'b', Link: 'x' });
  });

  it('drops a create that is deleted before it was ever sent', () => {
    const created = engine.mergeRecord(undefined, change('create', {}));
    expect(engine.mergeRecord(created, change('delete'))).toBeNull();
  });

  it('turns a create that may be on the server into a delete', () => {
    const created = { ...engine.mergeRecord(undefined, change('create', {})), maybeOnServer: true };
    expect(engine.mergeRecord(created, change('delete'))).toMatchObject({ kind: 'delete', fields: {} });
  });

  it('ignores edits after a delete so the task cannot come back', () => {
    const deleted = engine.mergeRecord(undefined, change('delete'));
    expect(engine.mergeRecord(deleted, change('update', { Description: 'late' }))).toBe(deleted);
  });
});

describe('applyPending', () => {
  it('overlays queued edits, creates and deletes onto fetched tasks', () => {
    const fetched = [task('t#1', { Description: 'server' }), task('t#2')];
    const records = [
      { SK: 't#1', boardID: BOARD, kind: 'update', fields: { Description: 'local' } },
      { SK: 't#2', boardID: BOARD, kind: 'delete', fields: {} },
      { SK: 't#3', boardID: BOARD, kind: 'create', fields: { Description: 'new', Category: 'Inbox' } },
      { SK: 't#4', boardID: 'b#other', kind: 'create', fields: { Description: 'elsewhere' } }
    ];
    const result = engine.applyPending(fetched, records, BOARD);
    expect(result.map(t => [t.SK, t.Description])).toEqual([['t#1', 'local'], ['t#3', 'new']]);
  });

  it('ignores the board settings record for the same board', () => {
    const records = [{ SK: BOARD, boardID: BOARD, kind: 'update', fields: { Emoji: '🏡' } }];
    expect(engine.applyPending([task('t#1')], records, BOARD)).toEqual([task('t#1')]);
  });
});

describe('applyPendingBoards', () => {
  const board = (SK, fields = {}) => ({ SK, Board: 'Server', Emoji: '🚀', CategoryOrder: ['A', 'B'], WTarget: 7, WScore: 2, ...fields });

  it('overlays queued settings, parsing the category order, and leaves other boards alone', () => {
    const records = [
      { SK: BOARD, boardID: BOARD, kind: 'update', fields: { Board: 'Local', CategoryOrder: '["B","A"]', WTarget: 3 } },
      { SK: 't#1', boardID: 'b#other', kind: 'update', fields: { Emoji: '🐛' } }
    ];
    const result = engine.applyPendingBoards([board(BOARD), board('b#other')], records);
    expect(result).toEqual([
      board(BOARD, { Board: 'Local', CategoryOrder: ['B', 'A'], WTarget: 3 }),
      board('b#other')
    ]);
  });

  it('does not bring back a board the server no longer has', () => {
    const records = [{ SK: 'b#deleted', boardID: 'b#deleted', kind: 'update', fields: { Emoji: '🏡' } }];
    expect(engine.applyPendingBoards([board(BOARD)], records)).toEqual([board(BOARD)]);
  });

  it('keeps a setting the flush applied between the fetch and the second read', async () => {
    await engine.queueBoardUpdate(BOARD, { Emoji: '🏡' });
    const before = await engine.readPending();
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();
    const after = await engine.readPending();
    expect(after).toEqual([]);
    const shown = engine.applyPendingBoards([board(BOARD)], engine.mergePending(before, after));
    expect(shown[0].Emoji).toBe('🏡');
  });
});

describe('mergePending', () => {
  const record = (SK, rev, Description) => ({ SK, boardID: BOARD, kind: 'update', fields: { Description }, rev });

  it('keeps records settled between the two reads, and the later read wins for a task in both', () => {
    const before = [record('t#1', 1, 'settled'), record('t#2', 1, 'old')];
    const after = [record('t#2', 2, 'new'), record('t#3', 1, 'queued since')];
    const merged = engine.mergePending(before, after);
    expect(merged.map(r => [r.SK, r.fields.Description])).toEqual([['t#1', 'settled'], ['t#2', 'new'], ['t#3', 'queued since']]);
  });

  it('shows a create the fetch missed because the flush applied it after the fetch read', async () => {
    await engine.queueCreate(task('t#1', { Description: 'new' }));
    const before = await engine.readPending();
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();
    const after = await engine.readPending();
    expect(after).toEqual([]);
    const shown = engine.applyPending([], engine.mergePending(before, after), BOARD);
    expect(shown.map(t => [t.SK, t.Description])).toEqual([['t#1', 'new']]);
  });
});

describe('outbox', () => {
  it('keeps queued edits until the server confirms them', async () => {
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.queueCreate(task('t#1', { Description: 'hello' }));

    expect(pendingCount()).toBe(1);
    await engine.flushNow();

    expect(sentOps(0)).toEqual([expect.objectContaining({ SK: 't#1', kind: 'create', fields: expect.objectContaining({ Description: 'hello' }) })]);
    expect(pendingCount()).toBe(0);
  });

  it('getSyncStatus reads the current pending count without subscribing', async () => {
    await engine.queueUpdate('t#1', BOARD, { Description: 'typed' });

    expect(engine.getSyncStatus()).toMatchObject({ pending: 1 });
  });

  it('keeps an edit made while a sync is in flight', async () => {
    await engine.queueCreate(task('t#1', { Description: 'first' }));
    api.syncOps.mockImplementationOnce(async ops => {
      await engine.queueUpdate('t#1', BOARD, { Description: 'second' });
      return applied(ops);
    });

    await engine.flushNow();

    expect(pendingCount()).toBe(1);

    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();
    expect(sentOps(1)).toEqual([expect.objectContaining({ kind: 'update', fields: expect.objectContaining({ Description: 'second' }) })]);
    expect(pendingCount()).toBe(0);
  });

  it('sends nothing for a task created and deleted before a sync', async () => {
    await engine.queueCreate(task('t#1'));
    await engine.queueDelete('t#1', BOARD);
    await engine.flushNow();

    expect(api.syncOps).not.toHaveBeenCalled();
  });

  it('sends a delete for a task deleted while its create was in flight', async () => {
    await engine.queueCreate(task('t#1'));
    api.syncOps.mockImplementationOnce(async ops => {
      await engine.queueDelete('t#1', BOARD);
      return applied(ops);
    });
    await engine.flushNow();

    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();
    expect(sentOps(1)).toEqual([expect.objectContaining({ SK: 't#1', kind: 'delete' })]);
  });

  it('keeps everything after a failed sync and retries with backoff', async () => {
    api.syncOps.mockRejectedValueOnce(new Error('Network Error'));
    await engine.queueUpdate('t#1', BOARD, { Description: 'offline edit' });
    await engine.flushNow();

    const statuses = [];
    engine.subscribe(s => statuses.push(s));
    expect(statuses.at(-1)).toMatchObject({ pending: 1, lastError: 'Network Error' });

    api.syncOps.mockImplementation(async ops => applied(ops));
    await vi.waitFor(() => expect(api.syncOps).toHaveBeenCalledTimes(2), { timeout: 5000, interval: 500 });
    await vi.waitFor(() => expect(statuses.at(-1)).toMatchObject({ pending: 0, lastError: null }));
  });

  it('drops ops the server can never apply', async () => {
    await engine.queueUpdate('t#1', BOARD, { Description: 'edit to a deleted task' });
    await engine.queueUpdate('t#2', BOARD, { Description: 'edit on a board that is gone' });
    api.syncOps.mockResolvedValueOnce({
      results: [{ SK: 't#1', status: 'gone' }, { SK: 't#2', status: 'rejected' }],
      boards: []
    });
    await engine.flushNow();

    expect(pendingCount()).toBe(0);
  });

  it('keeps ops the server asks to retry', async () => {
    await engine.queueUpdate('t#1', BOARD, { CompletedDate: '123' });
    api.syncOps.mockResolvedValueOnce({ results: [{ SK: 't#1', status: 'retry' }], boards: [] });
    await engine.flushNow();

    expect(pendingCount()).toBe(1);
  });

  it('reports confirmed scores only once nothing else is queued for the board', async () => {
    const onBoardScores = vi.fn();
    engine.startSync({ onBoardScores });
    const scores = [{ SK: BOARD, WScore: 1, MScore: 1, YScore: 1 }];

    await engine.queueUpdate('t#1', BOARD, { CompletedDate: '123' });
    api.syncOps.mockImplementationOnce(async ops => {
      await engine.queueUpdate('t#2', BOARD, { CompletedDate: '124' });
      return { ...applied(ops), boards: scores };
    });
    await engine.flushNow();
    expect(onBoardScores).not.toHaveBeenCalled();

    api.syncOps.mockImplementation(async ops => ({ ...applied(ops), boards: scores }));
    await engine.flushNow();
    expect(onBoardScores).toHaveBeenCalledWith(scores);
  });

  it('a category rename reaches synced tasks and ones still waiting to be created', async () => {
    await engine.queueCreate(task('t#1', { Category: 'Old' }));
    await engine.queueUpdateAll([task('t#1'), task('t#2')], { Category: 'New' });

    expect(pendingCount()).toBe(2);
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();

    expect(sentOps(0)).toEqual(expect.arrayContaining([
      expect.objectContaining({ SK: 't#1', kind: 'create', fields: expect.objectContaining({ Category: 'New' }) }),
      expect.objectContaining({ SK: 't#2', kind: 'update', fields: { Category: 'New' } })
    ]));
  });

  it('a later rename is not undone by an earlier queued edit to the same task', async () => {
    await engine.queueUpdate('t#1', BOARD, { Description: 'typed before the rename' });
    await engine.queueUpdateAll([task('t#1')], { Category: 'New' });
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();

    expect(sentOps(0)).toEqual([expect.objectContaining({ fields: { Description: 'typed before the rename', Category: 'New' } })]);
  });

  it('folds board settings into one op per board, the latest value of each field winning', async () => {
    await engine.queueBoardUpdate(BOARD, { CategoryOrder: '["A","B"]' });
    await engine.queueBoardUpdate(BOARD, { Emoji: '🏡' });
    await engine.queueBoardUpdate(BOARD, { CategoryOrder: '["B","A"]' });
    expect(pendingCount()).toBe(1);

    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();

    expect(sentOps(0)).toEqual([{
      opId: `${BOARD}:3`, SK: BOARD, boardID: BOARD, kind: 'update', fields: { CategoryOrder: '["B","A"]', Emoji: '🏡' }
    }]);
    expect(pendingCount()).toBe(0);
  });

  it('keeps a board setting changed again while its sync was in flight', async () => {
    await engine.queueBoardUpdate(BOARD, { Board: 'First' });
    api.syncOps.mockImplementationOnce(async ops => {
      await engine.queueBoardUpdate(BOARD, { Board: 'Second' });
      return applied(ops);
    });
    await engine.flushNow();
    expect(pendingCount()).toBe(1);

    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();
    expect(sentOps(1)).toEqual([expect.objectContaining({ SK: BOARD, kind: 'update', fields: { Board: 'Second' } })]);
  });

  it('a queued board setting does not hold back confirmed scores', async () => {
    const onBoardScores = vi.fn();
    engine.startSync({ onBoardScores });
    const scores = [{ SK: BOARD, WScore: 1, MScore: 1, YScore: 1 }];

    await engine.queueUpdate('t#1', BOARD, { CompletedDate: '123' });
    api.syncOps.mockImplementationOnce(async ops => {
      await engine.queueBoardUpdate(BOARD, { Emoji: '🏡' });
      return { ...applied(ops), boards: scores };
    });
    await engine.flushNow();

    expect(onBoardScores).toHaveBeenCalledWith(scores);
    expect(engine.boardsWithQueuedTasks(await engine.readPending())).toEqual(new Set());
  });

  it('deleting a category forgets unsent creates and deletes the rest', async () => {
    await engine.queueCreate(task('t#1'));
    await engine.queueDeleteAll([task('t#1'), task('t#2')]);
    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();

    expect(sentOps(0)).toEqual([expect.objectContaining({ SK: 't#2', kind: 'delete' })]);
  });
});

describe('new boards', () => {
  const NEW = 'b#new';
  const newTask = (SK, fields = {}) => task(SK, { 'GSI1-PK': NEW, ...fields });

  it('shows a board whose create is still queued, with the server defaults and its queued settings', () => {
    const records = [
      { SK: NEW, boardID: NEW, kind: 'create', fields: { Board: 'Garden', CategoryOrder: '["Beds"]' } },
      { SK: BOARD, boardID: BOARD, kind: 'create', fields: { Board: 'Landed' } }
    ];
    const result = engine.applyPendingBoards([{ SK: BOARD, Board: 'Server', ...engine.NEW_BOARD_DEFAULTS, YScore: 5 }], records);

    expect(result).toEqual([
      { SK: BOARD, Board: 'Landed', ...engine.NEW_BOARD_DEFAULTS, YScore: 5 },
      { SK: NEW, ...engine.NEW_BOARD_DEFAULTS, Board: 'Garden', CategoryOrder: ['Beds'] }
    ]);
  });

  it('folds settings into the queued create and sends the board ahead of its tasks', async () => {
    await engine.queueCreate(newTask('t#1', { Description: 'First' }));
    await engine.queueBoardCreate({ SK: NEW, Board: 'Garden' });
    await engine.queueBoardUpdate(NEW, { Emoji: '🌱' });
    expect(engine.boardCreateQueued(await engine.readPending(), NEW)).toBe(true);

    api.syncOps.mockImplementation(async ops => applied(ops));
    await engine.flushNow();

    expect(sentOps(0).map(op => [op.SK, op.kind])).toEqual([[NEW, 'create'], ['t#1', 'create']]);
    expect(sentOps(0)[0].fields).toEqual({ Board: 'Garden', Emoji: '🌱' });
    expect(engine.boardCreateQueued(await engine.readPending(), NEW)).toBe(false);
  });

  it('forgets everything queued for a deleted board, so a resent create cannot bring it back', async () => {
    await engine.queueBoardCreate({ SK: NEW, Board: 'Garden' });
    await engine.queueCreate(newTask('t#1'));
    await engine.queueUpdate('t#2', BOARD, { Description: 'elsewhere' });
    api.syncOps.mockRejectedValueOnce(new Error('Network Error'));
    await engine.flushNow();

    await engine.forgetBoard(NEW);

    expect((await engine.readPending()).map(r => r.SK)).toEqual(['t#2']);
    expect(pendingCount()).toBe(1);
  });

  it('waits for a sync in flight before forgetting a board', async () => {
    await engine.queueBoardCreate({ SK: NEW, Board: 'Garden' });
    let respond;
    api.syncOps.mockImplementationOnce(ops => new Promise(resolve => { respond = () => resolve(applied(ops)); }));
    const flushing = engine.flushNow();
    await vi.waitFor(() => expect(api.syncOps).toHaveBeenCalled());

    let settled = false;
    const forgetting = engine.forgetBoard(NEW).finally(() => { settled = true; });
    await new Promise(resolve => setImmediate(resolve));
    expect(settled).toBe(false);
    respond();
    await flushing;
    await forgetting;

    expect(pendingCount()).toBe(0);
  });
});
