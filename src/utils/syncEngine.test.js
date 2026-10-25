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

// overlayPending only surfaces creates without a fetched task, so count records through the status instead
const pending = () => engine.overlayPending([], BOARD);
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

  it('patchPending only touches tasks that already have queued changes', async () => {
    await engine.queueCreate(task('t#1', { Category: 'Old' }));
    await engine.patchPending(['t#1', 't#2'], { Category: 'New' });

    const records = await pending();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ SK: 't#1', Category: 'New' });
  });
});
