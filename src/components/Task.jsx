import { useState, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { queueUpdate } from '../utils/syncEngine';
import { findAdjacentTaskTextarea, moveCaretBetweenFields } from '../utils/caretNavigation';
import { REWORD_MAX_LENGTH } from '../utils/apiGatewayClient';
import { rewordToApply } from '../utils/utils';
import { LinkIcon, MoreIcon } from './Icons';
import TaskMenu from './TaskMenu';
import './Task.css'

// Memoised: every prop is stable or this task's own object, so editing one task re-renders only that task
const Task = memo(({ title, task, setTaskFields, toggleTaskChecked, addTask, joinTask, rewordTask, focusRequestRef, tickedCheckboxRef, handleDeleteTask, setPromptConf, setAlertConf }) => {
  const [description, setDescription] = useState(task.Description);
  // Derived, not copied into state: a fresh copy of the board can replace a cached one in place, ticks included
  const checked = task.CompletedDate !== "nil";
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);
  // While a reword is in flight the task is locked: no typing, splitting, joining, ticking or menu
  const [isRewording, setIsRewording] = useState(false);

  useEffect(() => {
    if (task.Description !== description) {
      setDescription(task.Description);
    }
  }, [task.Description]);

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
  }

  // A task the user just created, split or joined asks for the caret here once it shows the text that produced. Run on
  // mount and on each new text, after React has written it to the textarea and so moved the caret to the end. Tasks that
  // merely load never ask, as focusing one scrolls the page to it
  const textareaRef = useRef(null);
  useLayoutEffect(() => {
    const request = focusRequestRef.current;
    if (request?.SK !== task.SK || request.description !== description) return;
    focusRequestRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(request.caret, request.caret);
  }, [description]);

  const saveDescription = (newDescription, options) => {
    if (newDescription === description) return;
    setDescription(newDescription);
    setTaskFields(task.SK, { Description: newDescription });
    queueUpdate(task.SK, task["GSI1-PK"], { Description: newDescription }, options);
  };

  const handleTextUpdate = e => saveDescription(e.target.value, { typing: true });

  // Delete the task and remove from the view
  const handleDeleteAndHideTask = (taskID, title) => {
    handleDeleteTask(taskID, title)
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
  const handleReword = async () => {
    setTaskMenuVisible(false);
    const requested = description;
    setIsRewording(true);
    try {
      const reply = await rewordTask(requested);
      const reworded = mountedRef.current && rewordToApply(requested, descriptionRef.current, reply);
      if (reworded) saveDescription(reworded);
    } catch {
      // apiPost has already shown an alert explaining the failure, and the task is unchanged
    } finally {
      if (mountedRef.current) setIsRewording(false);
    }
  };
  const trimmedLength = description.trim().length;
  const canReword = !checked && !isRewording && trimmedLength > 0 && trimmedLength <= REWORD_MAX_LENGTH;

  // Keyboard shortcuts for creating, splitting, joining, ticking, deleting and moving between tasks, as with lines in
  // an editor
  const onKeyDown = (e, taskID, title) => {
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
      // Found before the delete, while this task is still in the DOM. Backspace prefers the task above and Delete the
      // one below, falling back to the other. Neither means this is the last unticked task, which isn't simply
      // deleted, so focus stays put
      const above = findAdjacentTaskTextarea(target, true);
      const below = findAdjacentTaskTextarea(target, false);
      const neighbour = key === "Backspace" ? above ?? below : below ?? above;
      if (neighbour) {
        // The key's default action follows focus, so it would otherwise delete a character from the neighbour
        e.preventDefault();
        const caret = neighbour === above ? neighbour.value.length : 0;
        neighbour.focus();
        neighbour.setSelectionRange(caret, caret);
      }
      handleDeleteAndHideTask(taskID, title);
      return;
    }
    if (start === end && ((key === "Backspace" && start === 0) || (key === "Delete" && start === value.length))) {
      if (joinTask(taskID, key === "Backspace")) e.preventDefault();
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
      const above = findAdjacentTaskTextarea(target, true);
      const below = findAdjacentTaskTextarea(target, false);
      const next = below ?? above;
      if (next) {
        const caret = next === above ? next.value.length : 0;
        next.focus();
        next.setSelectionRange(caret, caret);
      }
      handleCheckBox();
      return;
    }
    // Shift+Enter is left to the textarea, as a line break within the task
    if (key === "Enter" && e.shiftKey) return;
    if (key === "Enter") {
      e.preventDefault();
      // At the very start the whole task moves down a line, so it keeps its own link and importance
      if (end === 0 && value !== "") {
        addTask(taskID, { above: true });
        return;
      }
      // Otherwise the text after the caret, less any selection, moves into a new task below
      saveDescription(value.slice(0, start));
      addTask(taskID, { description: value.slice(end) });
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
  const isLinkAvailable = task.Link && task.Link !== "";

  return (
    <div className={`task-container ${isRewording ? "task-rewording" : ""}`} aria-busy={isRewording}>

      <input ref={checkboxRef} style={taskExpiryOpacityStyle} type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />

      <div className="task-textarea-wrapper">
        {/* A textarea can't style its own text runs, so the highlight is drawn on a hidden copy of the text behind it */}
        {isImportant && description && (
          <div className="task-textarea-box task-highlight-mirror" aria-hidden="true" style={taskExpiryOpacityStyle}>
            <span>{description}</span>
          </div>
        )}
        {/* Shares the textarea's grid cell, so the browser sizes the textarea to the wrapped text even when the card's
            width changes without a resize event. The trailing space keeps a final line break from collapsing. */}
        <div className="task-textarea-box task-textarea-sizer" aria-hidden="true">{description}{' '}</div>
        <textarea
          ref={textareaRef}
          className={`task-textarea-box ${taskMenuVisible ? "highlight-2" : ""}`}
          rows={1}
          value={description}
          disabled={checked}
          readOnly={isRewording}
          placeholder="new task..."
          onChange={handleTextUpdate}
          onKeyDown={(e) => onKeyDown(e, task.SK, title)}
          style={taskTextDecorationStyle}
        />
      </div>

      {isLinkAvailable ? (
        <a href={task.Link} target="_blank" rel="noreferrer">
          <LinkIcon className="task-dropdown-icons task-three-dots-vertical" />
        </a>
      ) : (
        <LinkIcon className="task-dropdown-icons task-three-dots-vertical no-background task-link-empty" />
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
            deleteAndHideTask={() => handleDeleteAndHideTask(task.SK, title)}
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
