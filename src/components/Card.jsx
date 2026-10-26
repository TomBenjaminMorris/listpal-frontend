import { useState, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queueCreate, queueDeleteAll, queueUpdateAll } from '../utils/syncEngine';
import { useOnClickOutside } from 'usehooks-ts'
import { updateCategoryOrder } from '../utils/utils';
import addIcon from "../assets/icons8-plus-30.png";
import dotsIcon from "../assets/icons8-dots-50.png";
import DropdownMenu from "./DropdownMenu";
import PulseLoader from "react-spinners/PulseLoader";
import Task from './Task';
import EmojiPicker, { preloadEmojiPicker } from './EmojiPicker';
import './Card.css';

const loaderStyle = {
  marginLeft: "30px",
  marginTop: "6px",
  marginBottom: "19px",
  opacity: "0.8",
};

// reduce builds new arrays, so sorting them doesn't mutate the tasks prop
const sortList = list => {
  if (!list) return [];
  const [doneList, notDoneList] = list.reduce((acc, el) => {
    el.CompletedDate === "nil" ? acc[1].push(el) : acc[0].push(el);
    return acc;
  }, [[], []]);

  return [
    ...doneList.sort((a, b) => parseInt(a.ExpiryDate) - parseInt(b.ExpiryDate)),
    ...notDoneList.sort((a, b) => parseInt(a.CreatedDate) - parseInt(b.CreatedDate))
  ];
};

const Card = ({ title, onRename, tasks, setSortedTasks, sortedTasks, handleDeleteTask, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [titleEdited, setTitleEdited] = useState(title);
  const [loadingTask, setLoadingTask] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [titleHasChanged, setTitleHasChanged] = useState(false);
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [cardEmoji, setCardEmoji] = useState(tasks?.[0]?.Emoji || "✅");
  const [isDeleting, setIsDeleting] = useState(false);

  const cardMenuRef = useRef(null);
  const cardTitleRef = useRef(null);
  const emojiMenuRef = useRef(null);

  // Keyed on this category's array rather than sortedTasks, so edits elsewhere on the board don't re-sort it.
  // Relies on every change to this category replacing the array, not mutating it
  const orderedTasks = useMemo(() => sortList(tasks), [tasks]);

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
        title: "Notice ⚠️",
        textValue: "Category name can't be empty...",
      });
      setTitleEdited(title);
      return;
    }

    if (sortedTasks[newTitle]) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "That category already exists on this board, chose another...",
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

  const handleNewTask = async (incomingTasks) => {
    setLoadingTask(true);
    const boardID = window.location.href.split('/').pop();

    const newTaskData = {
      CreatedDate: String(Date.now()),
      SK: "t#" + uuidv4(),
      PK: "",
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
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

    // A new array, as unshifting onto the existing one would leave orderedTasks stale
    const base = incomingTasks || sortedTasks;
    setSortedTasks({ ...base, [title]: [newTaskData, ...(base[title] || [])] });
    setLoadingTask(false);
  };

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

  useOnClickOutside(cardMenuRef, () => isDropdownVisible && setDropdownVisible(false));
  useOnClickOutside(cardTitleRef, () => {
    if (titleHasChanged) {
      renameCategory(titleEdited);
      setTitleHasChanged(false);
    }
  });
  useOnClickOutside(emojiMenuRef, () => displayEmojiPicker && setDisplayEmojiPicker(false));

  // fadeUp stays on: a CSS animation only plays when its class is first applied, so re-renders don't replay it
  return (
    <div
      className={`card-container ${isDeleting ? "fadeOutDown-animation" : "fadeUp-animation"}`}
      onAnimationEnd={handleCardAnimationEnd}
    >
      <div className="headingWrapper">
        <div className={`card-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : ""}`} ref={emojiMenuRef}>
          <div className="card-emoji-icon" onPointerEnter={preloadEmojiPicker} onClick={() => setDisplayEmojiPicker(prev => !prev)}>
            {cardEmoji}
          </div>
          {displayEmojiPicker && (
            <div className="board-emoji-wrapper">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </div>

        <input className="edit-title-input" type="text" value={titleEdited} onChange={handleCardTitleEdit} ref={cardTitleRef} />

        <div className="menu" onClick={() => setDropdownVisible(prev => !prev)} ref={cardMenuRef}>
          <img className={`rotate card-menu-dots ${isDropdownVisible ? "card-menu-dots-bg-fill" : ""}`} src={dotsIcon} alt="menu icon" />
          {isDropdownVisible && (
            <DropdownMenu
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
          sortedTasks={sortedTasks}
          setSortedTasks={setSortedTasks}
          handleDeleteTask={handleDeleteTask}
          handleNewTask={handleNewTask}
          setBoards={setBoards}
          cardEmoji={cardEmoji}
          setPromptConf={setPromptConf}
          setConfirmConf={setConfirmConf}
          setAlertConf={setAlertConf}
        />
      ))}

      <div className="new-task-container">
        {loadingTask && (
          <PulseLoader
            cssOverride={loaderStyle}
            size={5}
            color="var(--text-colour)"
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        )}
        <div className="addTaskWrapper" onClick={() => handleNewTask(null)}>
          <img className="addTask" src={addIcon} alt="add icon" />
          <div className="addTaskText">new task...</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
