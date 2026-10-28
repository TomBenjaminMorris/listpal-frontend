import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { watchForReturn, STALE_AFTER, IDLE_AFTER, WAKE_CHECK } from './refreshOnReturn';

let onReturn;
let stop;

const show = () => {
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
};
const hide = () => {
  document.visibilityState = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.useFakeTimers();
  onReturn = vi.fn();
  stop = watchForReturn(onReturn);
});

afterEach(() => {
  stop();
  vi.useRealTimers();
});

describe('watchForReturn', () => {
  it('refreshes when the tab is shown again after being away a while', () => {
    hide();
    vi.advanceTimersByTime(STALE_AFTER);
    show();
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for a quick look at another tab', () => {
    hide();
    vi.advanceTimersByTime(STALE_AFTER - 1000);
    show();
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('refreshes at most once per STALE_AFTER, whatever fires', () => {
    vi.advanceTimersByTime(STALE_AFTER);
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    show();
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('ignores focus while the tab is hidden', () => {
    hide();
    vi.advanceTimersByTime(STALE_AFTER);
    window.dispatchEvent(new Event('focus'));
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('refreshes after the computer wakes from sleep', () => {
    // Sleep moves the clock on without running timers
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    vi.advanceTimersByTime(WAKE_CHECK);
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on ordinary timer ticks', () => {
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('refreshes on the first input after a long idle, and not on the next', () => {
    vi.advanceTimersByTime(IDLE_AFTER);
    window.dispatchEvent(new Event('pointermove'));
    window.dispatchEvent(new Event('keydown'));
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on input while the page is in use', () => {
    for (let i = 0; i < 20; i++) {
      vi.advanceTimersByTime(60 * 1000);
      window.dispatchEvent(new Event('keydown'));
    }
    expect(onReturn).not.toHaveBeenCalled();
  });

  it('stops listening once cleaned up', () => {
    stop();
    vi.advanceTimersByTime(STALE_AFTER);
    show();
    expect(onReturn).not.toHaveBeenCalled();
  });
});
