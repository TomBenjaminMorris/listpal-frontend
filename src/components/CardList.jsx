import { useCallback, useLayoutEffect, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, updateCategoryOrder } from '../utils/utils';
import { queueCreate, queueDelete, queueUpdate } from '../utils/syncEngine';
import { suggestEmoji } from '../utils/categoryEmoji';
import Card from './Card';
import { PlusIcon } from './Icons';
import './Prompt.css';
import './CardList.css'

const CardList = ({ boardName, sortedTasks, setSortedTasks, setBoards, setPromptConf, setConfirmConf, setAlertConf, tickedCheckboxRef, remoteUpdateRef }) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Where the caret goes once a task shows a given text: { SK, caret, description }. Task reads it, as React moves the
  // caret to the end whenever it changes a value. Held here because a new category's first task asks for it from a new Card
  const focusRequestRef = useRef(null);

  // Stable React keys per category, so a rename doesn't remount the card and replay its entry animation
  const cardKeys = useRef({});

  const getCardKey = (title) => {
    if (!cardKeys.current[title]) cardKeys.current[title] = uuidv4();
    return cardKeys.current[title];
  };

  const isEmpty = Object.keys(sortedTasks).length === 0;
  // The first card and the add button take the place of the empty board panel, so they appear where they belong rather
  // than rising into it. The add button stays flagged, as gaining the fadeUp class later would play the animation then
  const wasEmptyRef = useRef(false);
  const replacesEmptyBoard = wasEmptyRef.current;
  wasEmptyRef.current = isEmpty;
  const addButtonRises = useRef(true);
  if (isEmpty) addButtonRises.current = false;

  const containerRef = useRef(null);
  const categoryOrder = Object.keys(sortedTasks).join('\u0000');
  const lastCategoryOrder = useRef(categoryOrder);
  const positionsBeforeChange = useRef(null);

  // offsetLeft/Top ignore transforms, so the cards' own fade animations don't skew the measurement
  const measurePositions = () => new Map(
    [...containerRef.current.children].map(el => [el, { left: el.offsetLeft, top: el.offsetTop }])
  );

  // Measured during render, while the DOM still shows the old layout. Only done when categories are added, removed or
  // reordered, or when a fresh copy of the board lands and may resize the cards above others: other re-renders would
  // capture positions already stale from task edits
  if ((categoryOrder !== lastCategoryOrder.current || remoteUpdateRef.current) && containerRef.current) {
    positionsBeforeChange.current = measurePositions();
    lastCategoryOrder.current = categoryOrder;
  }

  // No dependencies, as a fresh copy can move the cards without changing the category order. Does nothing unless measured above
  useLayoutEffect(() => {
    const before = positionsBeforeChange.current;
    if (!before) return;
    positionsBeforeChange.current = null;
    // Web Animations ignore the CSS reduced-motion rule, so check it here
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    measurePositions().forEach((after, el) => {
      const prev = before.get(el);
      if (!prev) return;
      const dx = prev.left - after.left;
      const dy = prev.top - after.top;
      if (!dx && !dy) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    });
  });

  const handleRenameCard = (oldTitle, newTitle) => {
    cardKeys.current[newTitle] = cardKeys.current[oldTitle];
    delete cardKeys.current[oldTitle];
  };

  const showAlert = useCallback((title, textValue) => {
    setAlertConf({
      display: true,
      title,
      textValue
    });
  }, [setAlertConf]);

  // For callbacks that outlive the render that made them: handleDeleteTask keeps one identity for every memoised Task,
  // and the new category prompt holds handleNewCard while a fresh copy of the board can land
  const sortedTasksRef = useRef(sortedTasks);
  sortedTasksRef.current = sortedTasks;

  const handleDeleteTask = useCallback((taskID, title) => {
    const tasks = sortedTasksRef.current[title];
    const task = tasks?.find(t => t.SK === taskID);
    if (!task) return;
    const uncheckedTasks = tasks.filter(t => t.CompletedDate === "nil");
    const isLastUncheckedTask = uncheckedTasks.length === 1 && uncheckedTasks[0].SK === taskID;

    // Card handles a category's only task. Beside ticked tasks, the last unticked one stays, so there's a task to type into
    if (isLastUncheckedTask) {
      if (!task.Description) {
        showAlert("This one has to stay 📌", "Every category needs one unticked task. If you're done with the category, delete it from its menu instead.");
        return;
      }

      queueUpdate(taskID, task["GSI1-PK"], { Description: "" });

      setSortedTasks(prev => prev[title] ? {
        ...prev,
        [title]: prev[title].map(t => t.SK === taskID ? { ...t, Description: "" } : t)
      } : prev);
      return;
    }

    queueDelete(taskID, task["GSI1-PK"]);

    setSortedTasks(prev => prev[title] ? {
      ...prev,
      [title]: prev[title].filter(t => t.SK !== taskID)
    } : prev);
  }, [setSortedTasks, showAlert]);

  // Synchronous, as the prompt closes as soon as this returns
  const handleNewCard = (typedName) => {
    // Trimmed, so " Car" can't sit beside "Car"
    const name = typedName.trim();
    const categories = Object.keys(sortedTasksRef.current);
    if (!name || categories.includes(name)) {
      if (name) showAlert("Already taken 👯", "This board already has a category with that name. Try another one.");
      else showAlert("Name, please! ✏️", "Every category needs a name, even a short one.");
      return;
    }

    const boardID = getBoardIdFromUrl();
    const newCardDefaultTask = {
      CreatedDate: String(Date.now()),
      SK: "t#" + uuidv4(),
      PK: "",
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      ExpiryDate: "nil",
      Description: "",
      CompletedDate: "nil",
      Category: name,
      EntityType: "Task",
      Emoji: suggestEmoji(name),
      Link: "",
      Important: "false",
      ExpiryDateTTL: 0
    };

    // From what's on screen, as the saved order can hold stale or missing names
    const sortArr = [...categories, name];
    updateCategoryOrder(sortArr, setBoards)

    focusRequestRef.current = { SK: newCardDefaultTask.SK, caret: 0, description: "" };
    queueCreate(newCardDefaultTask);

    setSortedTasks(prev => ({
      ...prev,
      [name]: [newCardDefaultTask]
    }), sortArr);
    forceUpdate();
  };

  const openNewCategoryPrompt = () => setPromptConf({
    display: true,
    isEdit: false,
    defaultText: "",
    title: "Name your new category ✏️",
    callbackFunc: handleNewCard,
  });

  return (
    <div className="card-list-container" ref={containerRef}>
      {Object.entries(sortedTasks).map(([key]) => (
        <Card
          key={getCardKey(key)}
          title={key}
          boardName={boardName}
          onRename={handleRenameCard}
          tasks={sortedTasks[key]}
          setSortedTasks={setSortedTasks}
          sortedTasks={sortedTasks}
          handleDeleteTask={handleDeleteTask}
          setBoards={setBoards}
          setPromptConf={setPromptConf}
          setConfirmConf={setConfirmConf}
          setAlertConf={setAlertConf}
          tickedCheckboxRef={tickedCheckboxRef}
          focusRequestRef={focusRequestRef}
          remoteUpdateRef={remoteUpdateRef}
          appearsInPlace={replacesEmptyBoard}
        />
      ))}
      {isEmpty ? (
        // Keyed so React doesn't reuse this element as the add button, which the card slide would carry across the page
        <div key="empty-board" className="empty-board fadeInPure-animation">
          <svg className="empty-board-art" viewBox="0 0 132 104" aria-hidden="true">
            <rect className="empty-board-art-back" x="24" y="8" width="92" height="84" rx="11" transform="rotate(7 70 50)" />
            <rect className="empty-board-art-front" x="16" y="12" width="92" height="84" rx="11" />
            <rect className="empty-board-art-tick" x="28" y="26" width="14" height="14" rx="4" />
            <path className="empty-board-art-check" d="M31.5 33l2.5 2.5 4.5-5" />
            <rect className="empty-board-art-line" x="50" y="30" width="44" height="6" rx="3" />
            <rect className="empty-board-art-tick" x="28" y="47" width="14" height="14" rx="4" />
            <path className="empty-board-art-check" d="M31.5 54l2.5 2.5 4.5-5" />
            <rect className="empty-board-art-line" x="50" y="51" width="32" height="6" rx="3" />
            <rect className="empty-board-art-box" x="29" y="69" width="12" height="12" rx="3" />
            <rect className="empty-board-art-line" x="50" y="72" width="38" height="6" rx="3" />
          </svg>
          <h2>Start with a category</h2>
          <p>Categories keep related tasks together. Name your first one, such as “This week” or “Ideas”, then start adding tasks.</p>
          <button className="prompt-button" onClick={openNewCategoryPrompt}>New category</button>
        </div>
      ) : (
        <button
          key="add-card-button"
          id="addCardButton"
          className={`add-tile ${addButtonRises.current ? "fadeUp-animation" : ""}`}
          onClick={openNewCategoryPrompt}
        >
          <span className="add-tile-icon"><PlusIcon /></span>
          <span>New category</span>
        </button>
      )}
    </div>
  );
};

export default CardList;
