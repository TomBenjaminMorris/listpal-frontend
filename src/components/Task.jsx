import { useState, useEffect, useRef, memo } from 'react';
import { queueUpdate } from '../utils/syncEngine';
import linkIcon from '../assets/icons8-link-64.png';
import menuIcon from "../assets/icons8-dots-50.png"
import arrowIcon from "../assets/icons8-line-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import TaskMenu from './TaskMenu';
import './Task.css'

// Split by grapheme, not code unit, so emoji and accented letters keep their real width in the measuring copy
const graphemeSegmenter = new Intl.Segmenter();

// A textarea can't say which wrapped line its caret is on, so the text is laid out in a hidden copy that wraps the
// same way and each caret position is read from there. Keyed by UTF-16 index to match selectionStart.
const measureCaretPositions = (textarea) => {
  const mirror = document.createElement('div');
  mirror.className = 'task-textarea-box task-highlight-mirror task-caret-mirror';
  const markers = [];
  for (const { segment, index } of graphemeSegmenter.segment(textarea.value)) {
    const span = document.createElement('span');
    span.textContent = segment;
    mirror.appendChild(span);
    markers.push([index, span]);
  }
  // Zero width, so marking the end of the text can't push the last line over and wrap it
  const end = document.createElement('span');
  end.textContent = '​';
  mirror.appendChild(end);
  markers.push([textarea.value.length, end]);

  textarea.parentElement.appendChild(mirror);
  const positions = new Map(markers.map(([index, span]) => [index, { top: span.offsetTop, left: span.offsetLeft }]));
  mirror.remove();
  return positions;
};

// Ticked tasks have disabled textareas, which can't take focus, so they are skipped
const findAdjacentTaskTextarea = (textarea, up) => {
  const step = el => up ? el.previousElementSibling : el.nextElementSibling;
  for (let container = step(textarea.closest('.task-container')); container?.classList.contains('task-container'); container = step(container)) {
    const candidate = container.querySelector('textarea.task-textarea-box');
    if (candidate && !candidate.disabled) return candidate;
  }
  return null;
};

// Up on a task's first line or down on its last moves into the neighbouring task, keeping the caret's horizontal
// position, as in a text editor. Returns false to leave the key to the browser.
const moveToAdjacentTask = (e) => {
  const { target: textarea, key } = e;
  if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing) return false;
  if (textarea.selectionStart !== textarea.selectionEnd) return false;

  const up = key === "ArrowUp";
  const positions = measureCaretPositions(textarea);
  const caret = positions.get(textarea.selectionStart);
  const edge = positions.get(up ? 0 : textarea.value.length);
  if (!caret || caret.top !== edge.top) return false;

  const next = findAdjacentTaskTextarea(textarea, up);
  if (!next) return false;
  e.preventDefault();

  const nextPositions = measureCaretPositions(next);
  const lineTop = nextPositions.get(up ? next.value.length : 0).top;
  let best = up ? next.value.length : 0;
  let bestDistance = Infinity;
  nextPositions.forEach(({ top, left }, index) => {
    const distance = Math.abs(left - caret.left);
    if (top === lineTop && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  next.focus();
  next.setSelectionRange(best, best);
  return true;
};

// Memoised: every prop is stable or this task's own object, so editing one task re-renders only that task
const Task = memo(({ title, task, setTaskFields, toggleTaskChecked, addTask, handleDeleteTask, setPromptConf, setConfirmConf, setAlertConf }) => {
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

  // Handle text update (only set state if the value has changed)
  const handleTextUpdate = e => {
    const newDescription = e.target.value;
    if (newDescription !== description) {
      setDescription(newDescription);
      setTaskFields(task.SK, { Description: newDescription });
      queueUpdate(task.SK, task["GSI1-PK"], { Description: newDescription }, { typing: true });
    }
  }

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

  // Keyboard shortcuts for creating, deleting and moving between tasks
  const onKeyDown = (e, taskID, title) => {
    const { key, target } = e;
    if ((key === "ArrowUp" || key === "ArrowDown") && moveToAdjacentTask(e)) return;
    if (key === "Backspace" && target.value === "") {
      handleDeleteAndHideTask(taskID, title);
      return;
    }
    if (key === "Enter") {
      e.preventDefault();
      addTask();
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
  const taskAutoFocus = description === "";
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
