// At most one refresh per STALE_AFTER, so flicking between tabs doesn't refetch every time
export const STALE_AFTER = 30 * 1000;
// A page left open and untouched this long, then used again, may have been edited on another device meanwhile
export const IDLE_AFTER = 5 * 60 * 1000;
export const WAKE_CHECK = 15 * 1000;

// Calls onReturn when the user comes back to a page that may be out of date: the tab is shown again, the window
// regains focus, the network comes back, the computer wakes from sleep, or the first input after a long idle.
// Nothing polls, so a page nobody is looking at makes no requests. Returns a cleanup function.
export function watchForReturn(onReturn) {
  let lastRefresh = Date.now();
  let lastInput = Date.now();
  let lastTick = Date.now();

  const refreshIfStale = () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastRefresh < STALE_AFTER) return;
    lastRefresh = Date.now();
    onReturn();
  };

  // A laptop left open on the board may never hide the tab or lose focus, so coming back shows up only as input
  const handleInput = () => {
    const wasIdle = Date.now() - lastInput >= IDLE_AFTER;
    lastInput = Date.now();
    if (wasIdle) refreshIfStale();
  };

  // Timers stop while the computer sleeps, and the tab can wake up visible and focused without firing any event
  const wakeCheck = setInterval(() => {
    const slept = Date.now() - lastTick > WAKE_CHECK * 2;
    lastTick = Date.now();
    if (slept) refreshIfStale();
  }, WAKE_CHECK);

  const listeners = [
    [document, 'visibilitychange', refreshIfStale],
    [window, 'focus', refreshIfStale],
    [window, 'online', refreshIfStale],
    ...['pointermove', 'pointerdown', 'keydown'].map(type => [window, type, handleInput, { passive: true }])
  ];
  listeners.forEach(([target, type, listener, options]) => target.addEventListener(type, listener, options));

  return () => {
    clearInterval(wakeCheck);
    listeners.forEach(([target, type, listener]) => target.removeEventListener(type, listener));
  };
}
