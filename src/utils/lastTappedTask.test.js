import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markLastTappedTask, TAPPED_ATTRIBUTE } from './lastTappedTask';

const fakeTask = () => {
  const attributes = new Set();
  const task = {
    setAttribute: (name) => attributes.add(name),
    removeAttribute: (name) => attributes.delete(name),
    isTapped: () => attributes.has(TAPPED_ATTRIBUTE),
  };
  task.closest = () => task;
  return task;
};

const outside = { closest: () => null };

const clickOn = (target) => {
  const event = new Event('click');
  Object.defineProperty(event, 'target', { value: target });
  document.dispatchEvent(event);
};

describe('markLastTappedTask', () => {
  let cleanup;

  beforeEach(() => {
    vi.stubGlobal('document', new EventTarget());
    cleanup = markLastTappedTask();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('marks the tapped task and moves the mark to the next one', () => {
    const first = fakeTask();
    const second = fakeTask();

    clickOn(first);
    expect(first.isTapped()).toBe(true);

    clickOn(second);
    expect(first.isTapped()).toBe(false);
    expect(second.isTapped()).toBe(true);
  });

  it('clears the mark on a tap outside any task', () => {
    const task = fakeTask();

    clickOn(task);
    clickOn(outside);

    expect(task.isTapped()).toBe(false);
  });

  it('keeps the mark on a second tap of the same task', () => {
    const task = fakeTask();

    clickOn(task);
    clickOn(task);

    expect(task.isTapped()).toBe(true);
  });

  it('stops listening once cleaned up', () => {
    const task = fakeTask();
    cleanup();

    clickOn(task);

    expect(task.isTapped()).toBe(false);
    cleanup = () => {};
  });
});
