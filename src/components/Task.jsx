import { useState, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { queueUpdate } from '../utils/syncEngine';
import { findAdjacentTaskTextarea, focusAt, moveCaretBetweenFields } from '../utils/caretNavigation';
import { TASK_MAX_LENGTH } from '../utils/apiGatewayClient';
import { nextRewordChoice, rewordToApply } from '../utils/utils';
import { CheckIcon, LinkIcon, MoreIcon, UndoIcon } from './Icons';
import TaskMenu from './TaskMenu';
import './Task.css';

// The reword shimmer moves at one speed whatever the task's length, in px per second. A short task's band carries on
// out of sight before the next sweep, so the loop doesn't flicker
const SHIMMER_SPEED = 250;
const SHIMMER_MIN_TRAVEL = 320;

// The widest wrapped line: the band crosses every line at once, as each line fragment paints its own background
const textLength = span => Math.max(0, ...[...span.getClientRects()].map(rect => rect.width));

// Under reduced motion there's no loop or crossfade to wait for, so text goes straight in
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Moves the caret out of a task about to be deleted or ticked: to the end of the task above or the start of the one
// below, trying the preferred side first. Found before the change, while the task is still in the DOM. Returns
// whether there was one
const focusNeighbour = (textarea, preferAbove) => {
  const above = findAdjacentTaskTextarea(textarea, true);
  const below = findAdjacentTaskTextarea(textarea, false);
  const neighbour = preferAbove ? above ?? below : below ?? above;
  if (neighbour) focusAt(neighbour, neighbour === above ? neighbour.value.length : 0);
  return !!neighbour;
};

// Memoised: every prop is stable or this task's own object, so editing one task re-renders only that task
const Task = memo(({ title, task, setTaskFields, toggleTaskChecked, addTask, joinTask, rewordTask, focusRequestRef, tickedCheckboxRef, handleDeleteTask, setPromptConf, setAlertConf }) => {
  const [description, setDescription] = useState(task.Description);
  // Derived, not copied into state: a fresh copy of the board can replace a cached one in place, ticks included
  const checked = task.CompletedDate !== "nil";
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);
  // A reword runs "waiting" (the shimmer loops), then "revealing" (the band's next pass ends and the new text crossfades in), then
  // "settling" if the new text is shorter by a line or more and the row has to close up. It goes to "fading" instead
  // when there's nothing to swap in. A revert runs "reverting" (the same crossfade, unmarked), then "settling" if need
  // be. Animation events end each phase. The task is locked from waiting to settling: no typing, splitting, joining,
  // ticking or menu. "fading" only lets the shimmer fade, so it doesn't lock
  const [rewordPhase, setRewordPhase] = useState(null);
  const isRewording = rewordPhase === "waiting" || rewordPhase === "revealing" || rewordPhase === "reverting" || rewordPhase === "settling";
  // Once a reword lands, the user's own text waits here until they keep or revert the new one. Anything else that
  // changes the text, or a tick, ends the choice and the reword stands. Memory only, so a reload or board switch ends it
  const [rewordChoice, setRewordChoice] = useState(null);
  // A reply waits here for the shimmer's loop to end, and the old text stays on screen until the crossfade starts
  const pendingRewordRef = useRef(null);
  const [fadeFrom, setFadeFrom] = useState(null);

  // The shimmer's distance and duration come from the text's length, so the band keeps one speed. The band's width is
  // set in Task.css
  const wrapperRef = useRef(null);
  const shimmerRef = useRef(null);
  const sizerRef = useRef(null);
  useLayoutEffect(() => {
    const span = shimmerRef.current;
    if (span) {
      const band = parseFloat(getComputedStyle(wrapperRef.current).getPropertyValue('--shimmer-band'));
      const travel = Math.max(textLength(span), SHIMMER_MIN_TRAVEL - band);
      span.style.setProperty('--shimmer-end', `${travel}px`);
      span.style.setProperty('--shimmer-duration', `${(travel + band) / SHIMMER_SPEED}s`);
    }
    if (fadeFrom !== null) {
      // The row grows to the new text's height, if that's taller, from the height handleShimmerIteration noted
      const from = parseFloat(wrapperRef.current.style.getPropertyValue('--reword-height-from'));
      const to = Math.max(from, sizerRef.current.getBoundingClientRect().height);
      wrapperRef.current.style.setProperty('--reword-height-to', `${to}px`);
    }
  }, [rewordPhase, description, fadeFrom]);

  useEffect(() => {
    if (task.Description !== description) {
      setDescription(task.Description);
    }
  }, [task.Description]);

  // Catches every way the text can change (typing, a split or join, a fresh copy from another device) without each
  // one having to know about the choice. The reword and the revert set the text and the choice together
  useEffect(() => {
    if (rewordChoice && (checked || description !== rewordChoice.reworded)) setRewordChoice(null);
  }, [description, checked]);

  // A reword's reply arrives after an await, so it checks the latest text and whether this Task is still on screen.
  // After a board switch, setTaskFields would write into the next board's tasks
  const descriptionRef = useRef(description);
  descriptionRef.current = description;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // A target this tick meets bursts its confetti from here, wherever the task ends up
  const checkboxRef = useRef(null);
  const handleCheckBox = () => {
    if (isRewording) return;
    tickedCheckboxRef.current = checked ? null : checkboxRef.current;
    toggleTaskChecked(task.SK, !checked);
  };

  // A task the user just created, split or joined asks for the caret here once it shows the text that produced. Run on
  // mount and on each new text, after React has written it to the textarea and so moved the caret to the end. Tasks that
  // merely load never ask, as focusing one scrolls the page to it
  const textareaRef = useRef(null);
  useLayoutEffect(() => {
    const request = focusRequestRef.current;
    if (request?.SK !== task.SK || request.description !== description) return;
    focusRequestRef.current = null;
    focusAt(textareaRef.current, request.caret);
  }, [description]);

  const saveDescription = (newDescription, options) => {
    if (newDescription === description) return;
    setDescription(newDescription);
    setTaskFields(task.SK, { Description: newDescription });
    queueUpdate(task.SK, task["GSI1-PK"], { Description: newDescription }, options);
  };

  const handleTextUpdate = e => saveDescription(e.target.value, { typing: true });

  const handleDeleteAndHideTask = () => {
    handleDeleteTask(task.SK, title);
    setTaskMenuVisible(false);
  };

  // Reads task from props, which is current: memo re-renders this Task whenever its own task object is replaced
  const handleMarkAsImportant = () => {
    const Important = task.Important === "true" ? "false" : "true";
    queueUpdate(task.SK, task["GSI1-PK"], { Important });
    setTaskFields(task.SK, { Important });
    setTaskMenuVisible(false);
  };

  const handleDuplicate = () => {
    addTask(task.SK, { description, caret: description.length, link: task.Link, important: task.Important });
    setTaskMenuVisible(false);
  };

  // The new text is saved like a typed edit, through the outbox. Focus stays where it is
  const applyReword = (requested, reworded) => {
    setRewordChoice(choice => nextRewordChoice(choice, requested, reworded));
    saveDescription(reworded);
  };

  const handleReword = async () => {
    setTaskMenuVisible(false);
    const requested = description;
    setRewordPhase("waiting");
    try {
      const reply = await rewordTask(requested);
      const reworded = mountedRef.current && rewordToApply(requested, descriptionRef.current, reply);
      if (reworded) {
        if (prefersReducedMotion()) {
          applyReword(requested, reworded);
          setRewordPhase(null);
          return;
        }
        // The crossfade waits for the shimmer's pass to finish, so the band isn't cut off midway
        pendingRewordRef.current = { requested, reworded };
        return;
      }
    } catch {
      // apiPost has already shown an alert explaining the failure, and the task is unchanged
    }
    // Nothing to swap in, so the shimmer just fades away
    if (mountedRef.current) setRewordPhase("fading");
  };

  // Driven by animation events rather than timers, so the CSS alone sets the timing. The reduced-motion rule shortens
  // the fade to 1 ms rather than removing it, so it still fires. Only if still fading: a reword started during the
  // fade has moved the phase on
  const handleShimmerAnimationEnd = e => {
    if (e.animationName === "fadeOutPure") setRewordPhase(phase => phase === "fading" ? null : phase);
  };

  // A loop ends with the band just past the text, so nothing is cut off by the crossfade starting
  const handleShimmerIteration = e => {
    const pending = pendingRewordRef.current;
    if (e.animationName !== "rewordShimmer" || !pending) return;
    pendingRewordRef.current = null;
    // An edit from another device could have landed while the loop finished
    if (descriptionRef.current !== pending.requested) {
      setRewordPhase("fading");
      return;
    }
    wrapperRef.current.style.setProperty('--reword-height-from', `${wrapperRef.current.getBoundingClientRect().height}px`);
    setFadeFrom(pending.requested);
    applyReword(pending.requested, pending.reworded);
    setRewordPhase("revealing");
  };

  // A key press reaches a button as a click with no detail. The buttons go once pressed, so a keyboard user's focus
  // moves into the task rather than falling back to the page
  const endRewordChoice = e => {
    setRewordChoice(null);
    if (e.detail === 0) textareaRef.current.focus();
  };

  // The revert is saved through the outbox like any edit. It crossfades back without the flash, which marks new
  // wording, not the user's own
  const handleRevertReword = e => {
    const { original } = rewordChoice;
    endRewordChoice(e);
    if (prefersReducedMotion()) {
      saveDescription(original);
      return;
    }
    wrapperRef.current.style.setProperty('--reword-height-from', `${wrapperRef.current.getBoundingClientRect().height}px`);
    setFadeFrom(description);
    saveDescription(original);
    setRewordPhase("reverting");
  };

  // The flash follows the crossfade, which holds its end until the flash is over and React has swapped the copies for the
  // real text, which looks the same, so the handover doesn't show. A revert has no flash, so the crossfade's own end
  // comes here. A row that was taller for the old text then closes up rather than snapping, and the rows below slide
  // with it
  const handleCrossfadeEnd = () => {
    const wrapper = wrapperRef.current;
    const from = wrapper.getBoundingClientRect().height;
    const to = sizerRef.current.getBoundingClientRect().height;
    setFadeFrom(null);
    if (to < from) {
      wrapper.style.setProperty('--reword-height-from', `${from}px`);
      wrapper.style.setProperty('--reword-height-to', `${to}px`);
      setRewordPhase("settling");
    } else {
      setRewordPhase(null);
    }
  };

  // Events from inside the wrapper, such as the shimmer's, are ignored
  const handleWrapperAnimationEnd = e => {
    if (e.target !== e.currentTarget || e.animationName !== "rewordSettle") return;
    setRewordPhase(phase => phase === "settling" ? null : phase);
  };
  const trimmedLength = description.trim().length;
  const canReword = !checked && !isRewording && trimmedLength > 0 && trimmedLength <= TASK_MAX_LENGTH;

  // Keyboard shortcuts for creating, splitting, joining, ticking, deleting and moving between tasks, as with lines in
  // an editor
  const onKeyDown = (e) => {
    const { key, target } = e;
    if (moveCaretBetweenFields(e)) return;
    // An input method uses Enter and Backspace to build its text, so they aren't meant for the list
    if (e.nativeEvent.isComposing) return;
    // readOnly stops typing but not these, and a split, join or tick would change the text a reword is replacing
    if (isRewording && (key === "Enter" || key === "Backspace" || key === "Delete")) {
      e.preventDefault();
      return;
    }
    const { selectionStart: start, selectionEnd: end, value } = target;

    if ((key === "Backspace" || key === "Delete") && value === "") {
      // Backspace prefers the task above and Delete the one below. Neither means this is the last unticked task,
      // which isn't simply deleted, so focus stays put. The key's default action follows focus, so it would
      // otherwise delete a character from the neighbour
      if (focusNeighbour(target, key === "Backspace")) e.preventDefault();
      handleDeleteAndHideTask();
      return;
    }
    if (start === end && ((key === "Backspace" && start === 0) || (key === "Delete" && start === value.length))) {
      if (joinTask(task.SK, key === "Backspace")) e.preventDefault();
      return;
    }
    if (key === "Escape") {
      target.blur();
      return;
    }
    // Ticking moves this task up among the ticked ones and disables it, so the caret goes on to the task below, or
    // the one above when this was the last. Ticking the card's last unticked task adds an empty one, which takes focus
    if (key === "Enter" && e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      e.preventDefault();
      focusNeighbour(target, false);
      handleCheckBox();
      return;
    }
    // Shift+Enter is left to the textarea, as a line break within the task
    if (key === "Enter" && e.shiftKey) return;
    if (key === "Enter") {
      e.preventDefault();
      // At the very start the whole task moves down a line, so it keeps its own link and importance
      if (end === 0 && value !== "") {
        addTask(task.SK, { above: true });
        return;
      }
      // Otherwise the text after the caret, less any selection, moves into a new task below
      saveDescription(value.slice(0, start));
      addTask(task.SK, { description: value.slice(end) });
    }
  };

  const taskExpiryOpacity = () => {
    const now = Date.now();
    const expiryDate = parseInt(task.ExpiryDate);
    const diffDays = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays >= 4) return "0.6";
    if (diffDays >= 3) return "0.5";
    if (diffDays >= 2) return "0.4";
    if (diffDays === 1) return "0.3";
    if (diffDays < 1) return "0.2";
    return "1";
  };

  // Wraps the menu icon and the menu, which closes itself on a click outside it
  const taskMenuRef = useRef(null);

  const isImportant = task.Important === "true";
  const taskExpiryOpacityStyle = checked ? { opacity: taskExpiryOpacity() } : null;
  const taskTextDecorationStyle = checked ? { textDecoration: "line-through var(--accent) 1.5px", opacity: taskExpiryOpacity() } : null;
  const showRewordChoice = rewordChoice !== null && !isRewording;

  return (
    <div className={`task-container ${rewordPhase ? `task-reword-${rewordPhase}` : ""}`} aria-busy={isRewording}>

      <input ref={checkboxRef} style={taskExpiryOpacityStyle} type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />

      <div className="task-textarea-wrapper" ref={wrapperRef} onAnimationEnd={handleWrapperAnimationEnd}>
        {/* A textarea can't style its own text runs, so the highlight is drawn on a hidden copy of the text behind it */}
        {isImportant && description && (
          <div className="task-textarea-box task-mirror task-highlight-mirror" aria-hidden="true" style={taskExpiryOpacityStyle}>
            <span>{description}</span>
          </div>
        )}
        {/* The reword shimmer: a copy of the text laid over the textarea's letters, coloured only where the band
            passes, so the band runs through the letters from one wrapped line to the next */}
        {(rewordPhase === "waiting" || rewordPhase === "fading") && (
          <div className="task-textarea-box task-mirror task-shimmer-mirror" aria-hidden="true">
            <span ref={shimmerRef} onAnimationEnd={handleShimmerAnimationEnd} onAnimationIteration={handleShimmerIteration}>
              {description}
            </span>
          </div>
        )}
        {/* The crossfade: the old and new texts laid over the textarea's, whose own text is hidden meanwhile. The extra
            sizer keeps the row as tall as the old text until the fade ends */}
        {fadeFrom !== null && (
          <>
            <div className="task-textarea-box task-mirror task-fade-mirror task-fade-old" aria-hidden="true">
              <span>{fadeFrom}</span>
            </div>
            <div className="task-textarea-box task-mirror task-fade-mirror task-fade-new" aria-hidden="true"
              onAnimationEnd={rewordPhase === "reverting" ? handleCrossfadeEnd : undefined}>
              <span>{description}</span>
            </div>
            {rewordPhase === "revealing" && (
              <div className="task-textarea-box task-mirror task-flash-mirror" aria-hidden="true">
                <span onAnimationEnd={handleCrossfadeEnd}>{description}</span>
              </div>
            )}
            <div className="task-textarea-box task-textarea-sizer" aria-hidden="true">{fadeFrom}{' '}</div>
          </>
        )}
        {/* Shares the textarea's grid cell, so the browser sizes the textarea to the wrapped text even when the card's
            width changes without a resize event. The trailing space keeps a final line break from collapsing. */}
        <div ref={sizerRef} className="task-textarea-box task-textarea-sizer" aria-hidden="true">{description}{' '}</div>
        <textarea
          ref={textareaRef}
          className="task-textarea-box"
          rows={1}
          maxLength={TASK_MAX_LENGTH}
          value={description}
          disabled={checked}
          readOnly={isRewording}
          placeholder="new task..."
          onChange={handleTextUpdate}
          onKeyDown={onKeyDown}
          style={taskTextDecorationStyle}
        />
        {/* Always present, as a live region only announces changes to one that's already on the page */}
        <span className="task-reword-status" role="status">
          {showRewordChoice ? `Reworded to: ${description}. Keep or revert buttons follow.` : ""}
        </span>
      </div>

      {/* In the link's place, so the text keeps its width and doesn't rewrap. The link comes back once the user decides */}
      {showRewordChoice ? (
        <div className="task-reword-choice">
          <button type="button" aria-label="Keep the reworded text" title="Keep" onClick={endRewordChoice}>
            <CheckIcon className="task-reword-choice-icon" />
          </button>
          <button type="button" aria-label="Revert to your own wording" title="Revert" onClick={handleRevertReword}>
            <UndoIcon className="task-reword-choice-icon" />
          </button>
        </div>
      ) : task.Link ? (
        <a href={task.Link} target="_blank" rel="noreferrer">
          <LinkIcon className="task-link-icon task-three-dots-vertical" />
        </a>
      ) : (
        <LinkIcon className="task-link-icon task-three-dots-vertical task-link-empty" />
      )}

      <div className={`taskMenu ${taskMenuVisible ? "menu-background-display" : ""}`} ref={taskMenuRef}>
        <MoreIcon className="task-three-dots-vertical" onClick={() => !isRewording && setTaskMenuVisible(prev => !prev)} />
        {taskMenuVisible && (
          <TaskMenu
            containerRef={taskMenuRef}
            onClose={() => setTaskMenuVisible(false)}
            markAsImportant={handleMarkAsImportant}
            duplicateTask={handleDuplicate}
            rewordTask={canReword ? handleReword : null}
            deleteAndHideTask={handleDeleteAndHideTask}
            isImportant={isImportant}
            task={task}
            setTaskFields={setTaskFields}
            setPromptConf={setPromptConf}
            setAlertConf={setAlertConf}
          />
        )}
      </div>
    </div>
  );
});

export default Task;
