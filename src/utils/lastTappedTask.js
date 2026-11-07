// TaskMenu.css shows a task's dots on a touch screen only for the task carrying this attribute, as :hover sticks to
// the last thing tapped there. Task.css lets taps on a ticked task's disabled text through to the row, so they count.
export const TASK_SELECTOR = '.task-container';
export const TAPPED_ATTRIBUTE = 'data-touched';

// On click, not pointerup: iOS Safari takes a tap that reveals something before its click as a hover and drops the
// click, so the first tap on a task didn't open the keyboard. Returns the cleanup, for an effect.
export const markLastTappedTask = () => {
  let tappedTask = null;

  const handleClick = (e) => {
    const task = e.target.closest?.(TASK_SELECTOR) ?? null;
    if (task === tappedTask) return;
    tappedTask?.removeAttribute(TAPPED_ATTRIBUTE);
    task?.setAttribute(TAPPED_ATTRIBUTE, '');
    tappedTask = task;
  };

  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
};
