import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queueCreate, queueDeleteAll, queueUpdate, queueUpdateAll } from '../utils/syncEngine';
import { getBoardIdFromUrl, getNextMondayAt5AM, periodsContaining, updateCategoryOrder } from '../utils/utils';
import addIcon from "../assets/icons8-plus-30.png";
import dotsIcon from "../assets/icons8-dots-50.png";
import DropdownMenu from "./DropdownMenu";
import Task from './Task';
import EmojiPicker, { preloadEmojiPicker } from './EmojiPicker';
import './Card.css';

// reduce builds new arrays, so sorting them doesn't mutate the tasks prop
const sortList = list => {
  if (!list) return [];
  const [doneList, notDoneList] = list.reduce((acc, el) => {
    el.CompletedDate === "nil" ? acc[1].push(el) : acc[0].push(el);
    return acc;
  }, [[], []]);

  // Not by ExpiryDate: every task ticked this week shares next Monday's expiry, and the server returns ties in no set order
  return [
    ...doneList.sort((a, b) => parseInt(a.CompletedDate) - parseInt(b.CompletedDate) || parseInt(a.CreatedDate) - parseInt(b.CreatedDate)),
    ...notDoneList.sort((a, b) => parseInt(a.CreatedDate) - parseInt(b.CreatedDate))
  ];
};

const Card = ({ title, onRename, tasks, setSortedTasks, sortedTasks, handleDeleteTask, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [titleEdited, setTitleEdited] = useState(title);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [titleHasChanged, setTitleHasChanged] = useState(false);
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [cardEmoji, setCardEmoji] = useState(tasks?.[0]?.Emoji || "✅");
  // A fresh copy of the board can replace a cached one in place, so follow an emoji changed elsewhere
  const firstTaskEmoji = tasks?.[0]?.Emoji;
  useEffect(() => {
    if (firstTaskEmoji) setCardEmoji(firstTaskEmoji);
  }, [firstTaskEmoji]);
  const [isDeleting, setIsDeleting] = useState(false);

  const cardMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);

  // Keyed on this category's array rather than sortedTasks, so edits elsewhere on the board don't re-sort it.
  // Relies on every change to this category replacing the array, not mutating it
  const orderedTasks = useMemo(() => sortList(tasks), [tasks]);

  // Same approach as CardList's card slide: a ticked task moves up to the done tasks and the tasks it passes move down
  const containerRef = useRef(null);
  const taskOrder = orderedTasks.map(t => t.SK).join('\u0000');
  const lastTaskOrder = useRef(taskOrder);
  const positionsBeforeChange = useRef(null);

  const measurePositions = () => new Map(
    [...containerRef.current.children].map(el => [el, el.offsetTop])
  );

  // Measured during render, while the DOM still shows the old order. Only on a reorder, add or delete: a textarea
  // growing as the user types would otherwise slide every task below it
  if (taskOrder !== lastTaskOrder.current && containerRef.current) {
    positionsBeforeChange.current = measurePositions();
    lastTaskOrder.current = taskOrder;
  }

  useLayoutEffect(() => {
    const before = positionsBeforeChange.current;
    if (!before) return;
    positionsBeforeChange.current = null;
    // Web Animations ignore the CSS reduced-motion rule, so check it here
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    measurePositions().forEach((top, el) => {
      const prev = before.get(el);
      if (prev === undefined || prev === top) return;
      el.animate(
        [{ transform: `translateY(${prev - top}px)` }, { transform: 'none' }],
        { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    });
  }, [taskOrder]);

  const handleDeleteCategory = () => {
    queueDeleteAll(sortedTasks[title] ?? []);
    // Update the state to reflect the deleted category
    const newSortedTasks = { ...sortedTasks };
    delete newSortedTasks[title];
    // From what's on screen, for the same reason as renameCategory
    const sortArr = Object.keys(sortedTasks).filter(category => category !== title);
    updateCategoryOrder(sortArr, boards, setBoards);
    setSortedTasks(newSortedTasks, sortArr);
  }

  // Animation events bubble up from tasks and menus, so only react to the card's own exit animation
  const handleCardAnimationEnd = e => {
    if (e.target === e.currentTarget && e.animationName === "fadeOutDown") {
      handleDeleteCategory();
    }
  };

  const renameCategory = newTitle => {
    // Perform validations on the new title name
    if (!newTitle) {
      setAlertConf({
        display: true,
        title: "Name, please! ✏️",
        textValue: "Every category needs a name, even a short one.",
      });
      setTitleEdited(title);
      return;
    }

    if (sortedTasks[newTitle]) {
      setAlertConf({
        display: true,
        title: "Already taken 👯",
        textValue: "This board already has a category with that name. Try another one.",
      });
      setTitleEdited(title);
      return;
    }

    const renamedTasks = sortedTasks[title].map(t => t.Category === title ? { ...t, Category: newTitle } : t);

    const tmpSortedTasks = { ...sortedTasks }
    tmpSortedTasks[newTitle] = renamedTasks
    delete tmpSortedTasks[title];
    queueUpdateAll(sortedTasks[title].filter(t => t.Category === title), { Category: newTitle });

    // Build the order from what's on screen, as the saved order can hold stale or missing names and
    // anything missing from it sorts to the top
    const sortArr = Object.keys(sortedTasks).map(category => category === title ? newTitle : category);
    updateCategoryOrder(sortArr, boards, setBoards)
    onRename(title, newTitle);
    setSortedTasks(tmpSortedTasks, sortArr);
  };

  // The callbacks below are passed to every memoised Task, so they keep one identity while tasks change. They
  // write through updaters, and read this ref only to decide which side effects to run
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Local state only: callers queue the sync themselves
  const setTaskFields = useCallback((SK, fields) => {
    setSortedTasks(prev => prev[title]
      ? { ...prev, [title]: prev[title].map(t => t.SK === SK ? { ...t, ...fields } : t) }
      : prev);
  }, [title, setSortedTasks]);

  const addTask = useCallback(() => {
    const newTaskData = {
      CreatedDate: String(Date.now()),
      SK: "t#" + uuidv4(),
      PK: "",
      "GSI1-SK": "nil",
      "GSI1-PK": getBoardIdFromUrl(),
      ExpiryDate: "nil",
      Description: "",
      CompletedDate: "nil",
      Category: title,
      EntityType: "Task",
      Emoji: cardEmoji,
      Link: "",
      Important: "false",
      ExpiryDateTTL: 0
    };

    queueCreate(newTaskData);
    setSortedTasks(prev => ({ ...prev, [title]: [newTaskData, ...(prev[title] || [])] }));
  }, [title, cardEmoji, setSortedTasks]);

  const toggleTaskChecked = useCallback((SK, isChecked) => {
    const list = tasksRef.current ?? [];
    const task = list.find(t => t.SK === SK);
    if (!task) return;
    let isLastUncheckedTask = false;
    if (isChecked) {
      const uncheckedTasks = list.filter(t => t.CompletedDate == "nil");
      isLastUncheckedTask = uncheckedTasks.length === 1 && uncheckedTasks[0].SK == SK;
    }

    // Optimistic only: the server changes the scores in the same write as the tick and sends back the real values
    const updateBoardScores = (fields, increment) => {
      if (!fields.length) return;
      setBoards(current => current.map(b => {
        if (b.SK !== task["GSI1-PK"]) return b;
        const updated = { ...b };
        fields.forEach(field => { updated[field] = Math.max(0, Number(updated[field]) + increment); });
        return updated;
      }));
    };

    let completion;
    if (isChecked) {
      const expiryDate = getNextMondayAt5AM();
      completion = {
        CompletedDate: String(Date.now()),
        ExpiryDate: expiryDate,
        "GSI1-SK": expiryDate,
        ExpiryDateTTL: Math.trunc(parseInt(expiryDate) / 1000)
      };
      updateBoardScores(periodsContaining(Number(completion.CompletedDate), Date.now()), 1);
    } else {
      completion = { CompletedDate: "nil", ExpiryDate: "nil", "GSI1-SK": "nil", ExpiryDateTTL: 0 };
      // Only periods the completion counted in, so last week's untick can't eat this week's score
      updateBoardScores(periodsContaining(Number(task.CompletedDate), Date.now()), -1);
    }
    queueUpdate(task.SK, task["GSI1-PK"], completion);

    let newCardDefaultTask = null;
    if (isLastUncheckedTask) {
      newCardDefaultTask = {
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
      queueCreate(newCardDefaultTask);
    }

    setSortedTasks(prev => {
      if (!prev[title]) return prev;
      const updatedList = prev[title].map(t => t.SK === SK ? { ...t, ...completion } : t);
      return { ...prev, [title]: newCardDefaultTask ? [...updatedList, newCardDefaultTask] : updatedList };
    });
  }, [title, cardEmoji, setSortedTasks, setBoards]);

  const handleEmojiSelect = (e) => {
    const newEmoji = e.native;
    setCardEmoji(newEmoji)
    const updatedCategoryArray = sortedTasks[title].map(t => ({ ...t, Emoji: newEmoji }));
    const tmpSortedTasks = { ...sortedTasks }
    tmpSortedTasks[title] = updatedCategoryArray
    queueUpdateAll(tasks, { Emoji: newEmoji });
    setSortedTasks(tmpSortedTasks);
  }

  const handleCardTitleEdit = (e) => {
    const newTitle = e.target.value
    setTitleHasChanged(true);
    setTitleEdited(newTitle);
  }

  // Blur covers every way of leaving the field: a click elsewhere, Tab or switching window
  const handleCardTitleBlur = () => {
    if (titleHasChanged) {
      renameCategory(titleEdited);
      setTitleHasChanged(false);
    }
  };

  // fadeUp stays on: a CSS animation only plays when its class is first applied, so re-renders don't replay it
  return (
    <div
      className={`card-container ${isDeleting ? "fadeOutDown-animation" : "fadeUp-animation"}`}
      onAnimationEnd={handleCardAnimationEnd}
      ref={containerRef}
    >
      <div className="headingWrapper">
        <div className={`card-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : ""}`} ref={emojiMenuRef}>
          <div className="card-emoji-icon" onPointerEnter={preloadEmojiPicker} onClick={() => setDisplayEmojiPicker(prev => !prev)}>
            {cardEmoji}
          </div>
          {displayEmojiPicker && (
            <div className="board-emoji-wrapper">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} containerRef={emojiMenuRef} onClose={() => setDisplayEmojiPicker(false)} />
            </div>
          )}
        </div>

        <input className="edit-title-input" type="text" value={titleEdited} onChange={handleCardTitleEdit} onBlur={handleCardTitleBlur} />

        <div className="menu" onClick={() => setDropdownVisible(prev => !prev)} ref={cardMenuRef}>
          <img className={`rotate card-menu-dots ${isDropdownVisible ? "card-menu-dots-bg-fill" : ""}`} src={dotsIcon} alt="menu icon" />
          {isDropdownVisible && (
            <DropdownMenu
              containerRef={cardMenuRef}
              onClose={() => setDropdownVisible(false)}
              handleDeleteCategory={() => setIsDeleting(true)}
              boards={boards}
              title={title}
              sortedTasks={sortedTasks}
              setSortedTasks={setSortedTasks}
              setBoards={setBoards}
              setConfirmConf={setConfirmConf}
            />
          )}
        </div>
      </div>

      <hr />

      {orderedTasks.map(task => (
        <Task
          key={task.SK}
          title={title}
          task={task}
          setTaskFields={setTaskFields}
          toggleTaskChecked={toggleTaskChecked}
          addTask={addTask}
          handleDeleteTask={handleDeleteTask}
          setPromptConf={setPromptConf}
          setConfirmConf={setConfirmConf}
          setAlertConf={setAlertConf}
        />
      ))}

      <div className="new-task-container">
        <div className="addTaskWrapper" onClick={addTask}>
          <img className="addTask" src={addIcon} alt="add icon" />
          <div className="addTaskText">new task...</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
