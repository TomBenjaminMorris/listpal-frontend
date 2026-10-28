import { useState, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { queueUpdate } from '../utils/syncEngine';
import { findAdjacentTaskTextarea, moveCaretBetweenFields } from '../utils/caretNavigation';
import linkIcon from '../assets/icons8-link-64.png';
import menuIcon from "../assets/icons8-dots-50.png"
import arrowIcon from "../assets/icons8-line-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import TaskMenu from './TaskMenu';
import './Task.css'

// Memoised: every prop is stable or this task's own object, so editing one task re-renders only that task
const Task = memo(({ title, task, setTaskFields, toggleTaskChecked, addTask, joinTask, focusRequestRef, handleDeleteTask, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [description, setDescription] = useState(task.Description);
  // Derived, not copied into state: a fresh copy of the board can replace a cached one in place, ticks included
  const checked = task.CompletedDate !== "nil";
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);

  // Update description when task.Description changes
  useEffect(() => {
    if (task.Description !== description) {  // Prevent unnecessary re-renders
      setDescription(task.Description);
    }
  }, [task.Description]);

  // Toggle checkbox state
  const handleCheckBox = () => {
    toggleTaskChecked(task.SK, !checked);
  }

  // A split or join asks for the caret here once this task shows the text it produced. Run on mount and on each new
  // text, after React has written it to the textarea and so moved the caret to the end
  const textareaRef = useRef(null);
  useLayoutEffect(() => {
    const request = focusRequestRef.current;
    if (request?.SK !== task.SK || request.description !== description) return;
    focusRequestRef.current = null;
    if (request.caret === null) return;
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

  // Keyboard shortcuts for creating, splitting, joining, ticking, deleting and moving between tasks, as with lines in
  // an editor
  const onKeyDown = (e, taskID, title) => {
    const { key, target } = e;
    if (moveCaretBetweenFields(e)) return;
    // An input method uses Enter and Backspace to build its text, so they aren't meant for the list
    if (e.nativeEvent.isComposing) return;
    const { selectionStart: start, selectionEnd: end, value } = target;

    if ((key === "Backspace" || key === "Delete") && value === "") {
      // Found before the delete, while this task is still in the DOM. Backspace prefers the task above and Delete the
      // one below, falling back to the other. Neither means this is the last unticked task, which can't be deleted,
      // so focus stays put
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

  // Calculate completed task opacity based on time since completed
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

  // Extract repeated logic
  const isImportant = task.Important === "true";
  const taskExpiryOpacityStyle = checked ? { opacity: taskExpiryOpacity() } : null;
  const taskTextDecorationStyle = checked ? { textDecoration: "line-through var(--accent) 2px", opacity: taskExpiryOpacity() } : null;
  // Unless Card asked otherwise, as for an empty task pushed in above the caret
  const taskAutoFocus = description === "" && focusRequestRef.current?.SK !== task.SK;
  const isLinkAvailable = task.Link && task.Link !== "";

  return (
    <div className="task-container">

      <img className="task-hover-indicator" src={arrowIcon} alt="follow link icon" />

      {/* Checkbox */}
      <input style={taskExpiryOpacityStyle} type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />

      {/* Description Input */}
      <div className="task-textarea-wrapper">
        {/* A textarea can't style its own text runs, so the highlight is drawn on a hidden copy of the text behind it */}
        {isImportant && description && (
          <div className="task-textarea-box task-highlight-mirror" aria-hidden="true" style={taskExpiryOpacityStyle}>
            <span>{description}</span>
          </div>
        )}
        <TextareaAutosize
          ref={textareaRef}
          className={`task-textarea-box ${taskMenuVisible ? "highlight-2" : ""}`}
          value={description}
          disabled={checked}
          placeholder="new task..."
          onChange={handleTextUpdate}
          autoFocus={taskAutoFocus}
          onKeyDown={(e) => onKeyDown(e, task.SK, title)}
          style={taskTextDecorationStyle}
        />
      </div>

      {/* Link Icon */}
      {isLinkAvailable ? (
        <a href={task.Link} target="_blank" rel="noreferrer">
          <img className="task-dropdown-icons task-three-dots-vertical" src={linkIcon} alt="follow link icon" />
        </a>
      ) : (
        <img className="task-dropdown-icons task-three-dots-vertical no-background" src={linkIcon} alt="follow link icon" style={{ opacity: '0.08' }} />
      )}

      {/* Menu Icon */}
      <div className={`taskMenu ${taskMenuVisible ? "menu-background-display" : ""}`} ref={taskMenuRef}>
        <img className="task-three-dots-vertical" src={menuIcon} alt="menu icon" onClick={() => setTaskMenuVisible(prev => !prev)} />
        {taskMenuVisible && (
          <TaskMenu
            containerRef={taskMenuRef}
            onClose={() => setTaskMenuVisible(false)}
            markAsImportant={handleMarkAsImportant}
            deleteAndHideTask={() => handleDeleteAndHideTask(task.SK, title)}
            isImportant={isImportant}
            task={task}
            setTaskFields={setTaskFields}
            setPromptConf={setPromptConf}
            setConfirmConf={setConfirmConf}
            setAlertConf={setAlertConf}
          />
        )}
      </div>
    </div>
  );
});

export default Task;
