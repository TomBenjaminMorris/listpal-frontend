import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptOnEnter } from './useEnterToAccept';

const pressKey = (key, props = {}) => {
  const event = new Event('keydown', { cancelable: true });
  Object.assign(event, { key, ...props });
  document.dispatchEvent(event);
  return event;
};

const button = { matches: () => true };
const textarea = { matches: () => false };
const modalHolding = (element) => ({ contains: (el) => el === element });

describe('acceptOnEnter', () => {
  let cleanups;

  const open = (accept, modal = modalHolding(null)) => {
    cleanups.push(acceptOnEnter(() => modal, accept));
  };

  beforeEach(() => {
    cleanups = [];
    vi.stubGlobal('document', Object.assign(new EventTarget(), { activeElement: null }));
  });

  afterEach(() => {
    cleanups.forEach(cleanup => cleanup());
    vi.unstubAllGlobals();
  });

  it('accepts on Enter and keeps the key from anything else', () => {
    const accept = vi.fn();
    open(accept);

    const event = pressKey('Enter');

    expect(accept).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores other keys', () => {
    const accept = vi.fn();
    open(accept);

    const event = pressKey('a');

    expect(accept).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves Enter to an input method that is composing', () => {
    const accept = vi.fn();
    open(accept);

    const event = pressKey('Enter', { isComposing: true });

    expect(accept).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('swallows a held key without accepting', () => {
    const accept = vi.fn();
    open(accept);

    const event = pressKey('Enter', { repeat: true });

    expect(accept).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('gives Enter only to the top modal, then to the one below once it closes', () => {
    const below = vi.fn();
    const above = vi.fn();
    open(below);
    const closeAbove = acceptOnEnter(() => null, above);

    pressKey('Enter');
    expect(above).toHaveBeenCalledTimes(1);
    expect(below).not.toHaveBeenCalled();

    closeAbove();
    pressKey('Enter');
    expect(above).toHaveBeenCalledTimes(1);
    expect(below).toHaveBeenCalledTimes(1);
  });

  it('leaves Enter to a button focused inside the modal', () => {
    const accept = vi.fn();
    open(accept, modalHolding(button));
    document.activeElement = button;

    const event = pressKey('Enter');

    expect(accept).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('accepts when the focused button is outside the modal, such as the one that opened it', () => {
    const accept = vi.fn();
    open(accept);
    document.activeElement = button;

    const event = pressKey('Enter');

    expect(accept).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('accepts when focus is in a field inside the modal', () => {
    const accept = vi.fn();
    open(accept, modalHolding(textarea));
    document.activeElement = textarea;

    pressKey('Enter');

    expect(accept).toHaveBeenCalledTimes(1);
  });

  it('stops listening once closed', () => {
    const accept = vi.fn();
    const close = acceptOnEnter(() => null, accept);

    close();
    pressKey('Enter');

    expect(accept).not.toHaveBeenCalled();
  });
});
