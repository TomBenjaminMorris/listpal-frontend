import { useCallback, useLayoutEffect, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, updateCategoryOrder } from '../utils/utils';
import { queueCreate, queueDelete, queueUpdate } from '../utils/syncEngine';
import Card from './Card';
import './CardList.css'

const CardList = ({ sortedTasks, setSortedTasks, setBoards, setPromptConf, setConfirmConf, setAlertConf, tickedCheckboxRef, remoteUpdateRef }) => {
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

  // Passed to every memoised Task, so it keeps one identity and reads the latest tasks from a ref to validate
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

  const handleNewCard = (name) => {
    if (!name || Object.keys(sortedTasks).includes(name)) {
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
      Emoji: "✅",
      Link: "",
      Important: "false",
      ExpiryDateTTL: 0
    };

    // From what's on screen, as the saved order can hold stale or missing names
    const sortArr = [...Object.keys(sortedTasks), name];
    updateCategoryOrder(sortArr, setBoards)

    focusRequestRef.current = { SK: newCardDefaultTask.SK, caret: 0, description: "" };
    queueCreate(newCardDefaultTask);

    setSortedTasks({
      ...sortedTasks,
      [name]: [newCardDefaultTask]
    }, sortArr);
    forceUpdate();
  };

  return (
    <div className="card-list-container" ref={containerRef}>
      {Object.entries(sortedTasks).map(([key]) => (
        <Card
          key={getCardKey(key)}
          title={key}
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
        />
      ))}
      {sortedTasks && (
        <div
          id="addCardButton"
          className="fadeUp-animation"
          onClick={() => setPromptConf({
            display: true,
            isEdit: false,
            defaultText: "",
            title: "Name your new category ✏️",
            callbackFunc: handleNewCard,
          })}
        >
          +
        </div>
      )}
    </div>
  );
};

export default CardList;
