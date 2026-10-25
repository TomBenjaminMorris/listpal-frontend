import { useState, useEffect, useRef, memo } from 'react';
import { queueCreate, queueUpdate } from '../utils/syncEngine';
import { v4 as uuidv4 } from 'uuid';
import { useOnClickOutside } from 'usehooks-ts'
import linkIcon from '../assets/icons8-link-64.png';
import menuIcon from "../assets/icons8-dots-50.png"
import arrowIcon from "../assets/icons8-line-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import TaskMenu from './TaskMenu';
import './Task.css'
import { getNextMondayAt5AM, periodsContaining } from '../utils/utils';

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

const Task = memo(({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setBoards, cardEmoji, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);

  // Update description when task.Description changes
  useEffect(() => {
    if (task.Description !== description) {  // Prevent unnecessary re-renders
      setDescription(task.Description);
    }
  }, [task.Description]);

  // Toggle checkbox state
  const handleCheckBox = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    updateActiveTaskChecked(newChecked);
  }

  // Handle text update (only set state if the value has changed)
  const handleTextUpdate = e => {
    const newDescription = e.target.value;
    if (newDescription !== description) {
      setDescription(newDescription);
      updateActiveTaskDescription(newDescription)
      queueUpdate(task.SK, task["GSI1-PK"], { Description: newDescription }, { typing: true });
    }
  }

  // Persist changes to app state
  const updateActiveTaskDescription = (value) => {
    let tmpSortedTasks = { ...sortedTasks };
    tmpSortedTasks[title] = sortedTasks[title].map(t =>
      t.SK === task.SK ? { ...t, Description: value } : t
    );
    setSortedTasks(tmpSortedTasks);
  }

  // Perform update actions to the DB and app state on checkbox toggle
  const updateActiveTaskChecked = (isChecked) => {
    let tmpSortedTasks = { ...sortedTasks };
    let isLastUncheckedTask = false;
    if (isChecked) {
      const tmpTaskList = tmpSortedTasks[title]?.filter((t) => t.CompletedDate == "nil");
      isLastUncheckedTask = tmpTaskList.length === 1 && tmpTaskList[0].SK == task.SK;
    }

    // Optimistic only: the server changes the scores in the same write as the tick and sends back the real values
    const updateBoardScores = (fields, increment) => {
      if (!fields.length) return;
      setBoards((current) => current.map(b => {
        if (b.SK !== task["GSI1-PK"]) return b;
        const updated = { ...b };
        fields.forEach(field => { updated[field] = Math.max(0, Number(updated[field]) + increment); });
        return updated;
      }));
    };

    tmpSortedTasks[title] = sortedTasks[title]?.map(t => {
      if (t.SK === task.SK) {
        if (isChecked) {
          // Mark task as completed
          const expiryDate = getNextMondayAt5AM();
          t.CompletedDate = String(Date.now());
          t["GSI1-SK"] = expiryDate;
          t.ExpiryDate = expiryDate;
          t.ExpiryDateTTL = Math.trunc(parseInt(expiryDate) / 1000);
          updateBoardScores(periodsContaining(Number(t.CompletedDate), Date.now()), 1);
        } else {
          // Only periods the completion counted in, so last week's untick can't eat this week's score
          const previousCompletedDate = t.CompletedDate;
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
          t.ExpiryDateTTL = 0;
          updateBoardScores(periodsContaining(Number(previousCompletedDate), Date.now()), -1);
        }

        queueUpdate(t.SK, t["GSI1-PK"], {
          CompletedDate: t.CompletedDate,
          ExpiryDate: t.ExpiryDate,
          "GSI1-SK": t["GSI1-SK"],
          ExpiryDateTTL: t.ExpiryDateTTL
        });
      }
      return t;
    });

    // Create a new task if this is the last unchecked task
    if (isLastUncheckedTask) {
      const newCardDefaultTask = {
        "CreatedDate": String(Date.now()),
        "SK": "t#" + uuidv4(),
        "PK": "",
        "GSI1-SK": "nil",
        "GSI1-PK": task["GSI1-PK"],
        "ExpiryDate": "nil",
        "Description": "",
        "CompletedDate": "nil",
        "Category": title,
        "EntityType": "Task",
        "Emoji": cardEmoji,
        "Link": "",
        "Important": "false",
        "ExpiryDateTTL": 0
      };

      tmpSortedTasks[title].push(newCardDefaultTask);
      queueCreate(newCardDefaultTask);
    }

    setSortedTasks(tmpSortedTasks);
  };

  // Delete the task and remove from the view
  const handleDeleteAndHideTask = (taskID, title) => {
    handleDeleteTask(taskID, title)
    setTaskMenuVisible(false);
  };

  // Perform update actions to the DB and app state on importance toggle
  const handleMarkAsImportant = (taskID) => {
    const updatedTasks = { ...sortedTasks };
    const task = updatedTasks[title]?.find(t => t.SK === taskID);
    if (task) {
      const newImportantStatus = task.Important === "true" ? "false" : "true";
      task.Important = newImportantStatus;
      queueUpdate(task.SK, task["GSI1-PK"], { Important: newImportantStatus });
      setSortedTasks(updatedTasks);
    }
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
      // Pass the latest sortedTasks to the handleNewTask to prevent it being overwritten (bug)
      let tmpSortedTasks = { ...sortedTasks };
      tmpSortedTasks[title] = sortedTasks[title].map(t =>
        t.SK === taskID ? { ...t, Description: description } : t
      );
      handleNewTask(tmpSortedTasks);
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

  // Handle click outside task menu
  const taskMenuRef = useRef(null);
  useOnClickOutside(taskMenuRef, () => taskMenuVisible && setTaskMenuVisible(false));

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
            markAsImportant={() => handleMarkAsImportant(task.SK)}
            deleteAndHideTask={() => handleDeleteAndHideTask(task.SK, title)}
            isImportant={isImportant}
            task={task}
            setSortedTasks={setSortedTasks}
            sortedTasks={sortedTasks}
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
