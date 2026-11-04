import { useEffect, useRef } from 'react';
import { useOnClickOutside } from 'usehooks-ts';

// Modals can stack, such as an API error alert over an open Confirm, and Enter belongs to the top one
const openModals = [];

export const acceptOnEnter = (getModal, accept) => {
  const modal = {};
  openModals.push(modal);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.isComposing || openModals.at(-1) !== modal) return;

    // Someone who tabbed to a button, such as Cancel, means that button
    const focused = document.activeElement;
    if (focused?.matches('button, input[type="submit"]') && getModal()?.contains(focused)) return;

    // Stopped in the capture phase because focus can still be in a task behind the modal, which would split on this key.
    // That also means a key that opens a modal from a React handler can't reach this listener and close it again.
    e.preventDefault();
    e.stopPropagation();

    // A held key must not dismiss the alert its own first press raised
    if (!e.repeat) accept();
  };

  document.addEventListener('keydown', handleKeyDown, true);

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
    openModals.splice(openModals.indexOf(modal), 1);
  };
};

export const useEnterToAccept = (modalRef, accept, active = true) => {
  const acceptRef = useRef(accept);
  acceptRef.current = accept;

  useEffect(() => {
    if (active) return acceptOnEnter(() => modalRef.current, () => acceptRef.current());
  }, [active]);
};

// Every modal's keys and clicks: Enter accepts, and Escape or a click outside closes. Both callbacks are read when
// they fire, so they may change on every render
export const useModalControls = (modalRef, { accept, close, active = true }) => {
  useEnterToAccept(modalRef, accept, active);

  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  useOnClickOutside(modalRef, () => closeRef.current());
};
