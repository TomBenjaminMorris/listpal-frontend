import { useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useMemo, useState, useRef, lazy, Suspense } from 'react';
import { deleteBoard, getActiveTasks } from '../utils/apiGatewayClient';
import { applyPending, flushNow, mergePending, queueBoardUpdate, queueDeleteAll, readPending, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { dropCachedTasks, getCachedTasks, setCachedTasks } from '../utils/boardCache';
import { getBoardIdFromUrl } from '../utils/utils';
import { apiErrorAlert } from '../utils/apiErrors';
import deleteIcon from '../assets/icons8-delete-48.png';
import editIcon from '../assets/icons8-edit-64.png';
import targetIcon from '../assets/icons8-bullseye-50.png';
import clearIcon from '../assets/icons8-clear-60.png';
import CardList from './CardList';
import DatePills from './DatePills';
import ScoreBoard from './ScoreBoard';
import TargetSetterModal from './TargetSetterModal';
import TargetBanner from './TargetBanner';
import Loader from './Loader';
import SyncIndicator from './SyncIndicator';
import EmojiPicker, { preloadEmojiPicker } from './EmojiPicker';
import './Board.css';

const ConfettiExplosion = lazy(() => import('react-confetti-explosion'));
const SHOWING_CACHE = Symbol('showing cache');
const TARGET_TYPES = ['weekly', 'monthly', 'yearly'];

const Board = ({ sortedTasks, setSortedTasks, setBoards, boards, refreshCount, isLoading, setIsLoading, setPromptConf, setConfirmConf, setAlertConf, setActiveBoardID }) => {
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [displayTargetSetter, setDisplayTargetSetter] = useState(false);
  const cursorPosition = useRef({ x: 0, y: 0 }); // Read only when confetti starts, so moving the pointer never re-renders the board
  const [confettiOrigins, setConfettiOrigins] = useState({}); // Per target, so each burst stays where it started while later ones start elsewhere
  // Set by a tick and cleared by a press, so a burst the tick causes starts at the task and any other starts at the pointer
  const tickedCheckbox = useRef(null);
  const [isTargetMet, setIsTargetMet] = useState({ weekly: true, monthly: true, yearly: true });
  const [isExploding, setIsExploding] = useState({ weekly: false, monthly: false, yearly: false });
  const [banners, setBanners] = useState([]);
  const announced = useRef(new Set()); // Targets already given a banner, cleared when the score drops below target
  const [remoteData, setRemoteData] = useState(null); // { boardID, load, tasks, failed } so a late response can't land on another board or visit
  const [loadedBoardID, setLoadedBoardID] = useState(null); // Board whose tasks are in sortedTasks; the loader shows until it matches
  const loadCount = useRef(0); // Numbers each board switch, so only the latest load's response is applied
  // While a background load runs: SHOWING_CACHE until a cached copy lands, then the sortedTasks on screen when it
  // started (the cached copy, or the board as it was when a refresh on return began)
  const shownFromCache = useRef(null);
  const boardID = getBoardIdFromUrl();
  const board = boards.find(b => b.SK === boardID)
  const maxLength = 20;
  const navigate = useNavigate();
  const emojiMenuRef = useRef(null)
  const deleteMessage = `Delete "${board?.Board}" for good?`;

  // Keyed on the fields shown, so a rename or emoji change updates the title but a score change doesn't
  useEffect(() => {
    if (board) document.title = `ListPal | ${board.Board} ${board.Emoji}`;
  }, [board?.Board, board?.Emoji]);

  useEffect(() => {
    if (remoteData && board && remoteData.boardID === board.SK && remoteData.load === loadCount.current) {
      const baseline = shownFromCache.current;
      shownFromCache.current = null;
      // The user may have edited the cached copy while the fresh one loaded; those edits are queued, so keep them
      if (baseline && sortedTasks !== baseline) return;
      sortTasks(remoteData.tasks);
      setLoadedBoardID(board.SK);
    }
  }, [remoteData, board?.SK]); // Depend on the ID, not the object, so local category edits aren't overwritten by stale remote data

  useEffect(() => {
    if (loadedBoardID !== boardID) return;
    // The empty board shown behind a load error isn't the board's tasks, so it mustn't be shown instantly next time
    if (remoteData?.failed && remoteData.boardID === boardID) return;
    setCachedTasks(boardID, sortedTasks);
    // Every edit replaces the sortedTasks object, so this first value after the cached copy lands is the baseline for spotting them
    if (shownFromCache.current === SHOWING_CACHE) shownFromCache.current = sortedTasks;
  }, [sortedTasks, loadedBoardID, boardID]);

  // A layout effect, so a cached copy replaces the loader before the browser paints it
  useLayoutEffect(() => {
    setActiveBoardID(boardID);
    const load = ++loadCount.current;
    // board is undefined on a direct page load until boards arrive, and the cache is empty then anyway
    const cached = getCachedTasks(boardID);
    if (cached && board) {
      setSortedTasks(cached, board.CategoryOrder);
      setLoadedBoardID(boardID);
      shownFromCache.current = SHOWING_CACHE;
    } else {
      shownFromCache.current = null;
    }
    getTasks({ load, background: !!(cached && board) });
    setIsTargetMet({ weekly: true, monthly: true, yearly: true }) // Reset this to the original state to stop confetti explosion on board switch
    setIsExploding({ weekly: false, monthly: false, yearly: false }) // Stale state from the previous board must not leak into the new one
    announced.current.clear()
    setBanners([])
  }, [boardID]);

  // Picks up tasks changed on another device, the same way as a background refresh of a cached board. A board still
  // loading is skipped, as that load is fetching fresh tasks anyway.
  useEffect(() => {
    if (!refreshCount || loadedBoardID !== boardID) return;
    shownFromCache.current = sortedTasks;
    getTasks({ load: ++loadCount.current, background: true });
  }, [refreshCount]);

  // Fetched while idle so the first celebration doesn't wait on the network
  useEffect(() => {
    if (loadedBoardID !== boardID) return;
    const idle = window.requestIdleCallback ?? (cb => setTimeout(cb, 2000));
    idle(() => import('react-confetti-explosion'));
  }, [loadedBoardID, boardID]);

  // Show a banner whenever confetti starts for a target, mirroring the confetti re-arm rules
  useEffect(() => {
    const newlyHit = [];
    ['weekly', 'monthly', 'yearly'].forEach((type) => {
      if (isExploding[type] && !isTargetMet[type] && !announced.current.has(type)) {
        announced.current.add(type);
        newlyHit.push(type);
      } else if (!isExploding[type]) {
        announced.current.delete(type);
      }
    });
    if (newlyHit.length) {
      // One banner per type: skip any type already on screen (e.g. complete, undo, complete again)
      setBanners(current => [...current, ...newlyHit.filter(type => !current.includes(type))]);
    }
  }, [isExploding, isTargetMet]);

  // Also on pointer down, so a tap on a touch screen (which sends no mousemove) still places the confetti
  const trackPointer = (e) => {
    cursorPosition.current = {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
    };
  };

  const handlePointerDown = (e) => {
    tickedCheckbox.current = null;
    trackPointer(e);
  };

  // A ticked task moves up to the done tasks, and the page can scroll to follow it, so where the pointer was may now
  // be off screen. The task has only just started sliding, and getBoundingClientRect includes the slide, so take that
  // off to find where it ends up.
  const confettiOrigin = () => {
    const checkbox = tickedCheckbox.current;
    if (!checkbox?.isConnected) return { ...cursorPosition.current };
    const rect = checkbox.getBoundingClientRect();
    const slide = new DOMMatrixReadOnly(getComputedStyle(checkbox.closest('.task-container')).transform);
    return {
      x: rect.left + rect.width / 2 - slide.m41 + window.scrollX,
      y: rect.top + rect.height / 2 - slide.m42 + window.scrollY,
    };
  };

  // Each burst is pinned where it started, so it stays put while it plays. A target hit while another burst is still
  // playing gets its own origin rather than reusing the earlier one.
  const activeConfetti = TARGET_TYPES.filter(type => isExploding[type] && !isTargetMet[type]);
  const activeConfettiKey = activeConfetti.join();
  useEffect(() => {
    setConfettiOrigins(current => Object.fromEntries(
      activeConfetti.map(type => [type, current[type] ?? confettiOrigin()])
    ));
  }, [activeConfettiKey]);

  const handleEditBoard = (name) => {
    if (!name) {
      setAlertConf({
        display: true,
        title: "Name, please! ✏️",
        textValue: "Every board needs a name, even a short one.",
      });
      return;
    }
    setBoards(current => current.map(b => b.SK === boardID ? { ...b, Board: name } : b));
    queueBoardUpdate(boardID, { Board: name });
  };

  const handleDeleteBoard = async () => {
    setIsLoading(true);
    try {
      await deleteBoard(boardID);
      dropCachedTasks(boardID);
      setBoards((boards) => boards.filter(b => b.SK !== boardID));
      navigate('/home');
    } catch {
      // apiPost has already shown the user what went wrong
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTasks = async () => {
    const tasksToDelete = [];
    const remaining = {};
    for (const [category, tasks] of Object.entries(sortedTasks)) {
      remaining[category] = tasks.filter(task => {
        if (task.CompletedDate === 'nil') return true;
        tasksToDelete.push(task);
        return false;
      });
    }
    setSortedTasks(remaining);

    queueDeleteAll(tasksToDelete);
  };

  const handleClearClick = () => {
    const hasCompleted = Object.values(sortedTasks ?? {}).some(tasks => tasks.some(t => t.CompletedDate !== 'nil'));
    if (!hasCompleted) {
      setAlertConf({
        display: true,
        title: "Already spotless ✨",
        textValue: "There are no completed tasks on this board yet. Go tick a few off!",
      });
      return;
    }
    setConfirmConf({
      display: true,
      title: "Clear all completed tasks?",
      textValue: "✨ Time for a spring clean ✨",
      callbackFunc: handleClearTasks,
    });
  };

  const sortTasks = (data) => {
    if (!data || data.length === 0) {
      setSortedTasks({});
      return;
    }
    const sortedData = data.reduce((acc, item) => {
      if (!acc[item.Category]) {
        acc[item.Category] = [item];
      } else {
        acc[item.Category].push(item);
      }
      return acc;
    }, {});
    setSortedTasks(sortedData, board.CategoryOrder);
    setIsLoading(false);
  };

  // In the background a cached copy is already on screen, so there is no loader, and a failure leaves that copy in place
  const getTasks = async ({ load, background = false }) => {
    if (!background) setIsLoading(true);
    try {
      // Records queued now are overlaid even if the flush settles them before the fetch reads, and queued
      // changes hold whole field values, so applying one the server already has changes nothing
      const before = await readPending();
      const [data] = await Promise.all([getActiveTasks(boardID, { silent: true }), flushNow({ timeout: LOAD_FLUSH_TIMEOUT })]);
      const after = await readPending();
      setRemoteData({ boardID, load, tasks: applyPending(data ?? [], mergePending(before, after), boardID) });
    } catch (error) {
      if (background) {
        console.error('Background refresh failed, keeping the cached tasks:', error);
        return;
      }
      setRemoteData({ boardID, load, tasks: [], failed: true }); // Show the empty board behind the alert rather than spinning forever
      // Reported here rather than by apiGet, because the local outbox reads can fail too
      setAlertConf({ display: true, ...apiErrorAlert(error, "load this board's tasks") });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (e) => {
    const selectedEmoji = e.native;
    setBoards(current =>
      current.map(b =>
        b.SK === boardID ? { ...b, Emoji: selectedEmoji } : b
      )
    );
    queueBoardUpdate(boardID, { Emoji: selectedEmoji });
  };

  const handleConfettiComplete = (type) => {
    // setAlertConf({
    //   display: true,
    //   title: "Great News! 🎉",
    //   animate: true,
    //   textValue: `You've hit your ${type} target... Keep going!`,
    // });
    setIsTargetMet(current => ({
      ...current,
      [type]: true,
    }));
  };

  // Stable, because the library restarts its completion timer whenever onComplete changes, and the board re-renders
  // during a burst. A new handler each render kept a finished burst counted as playing.
  const confettiCompleteHandlers = useMemo(
    () => Object.fromEntries(TARGET_TYPES.map(type => [type, () => handleConfettiComplete(type)])),
    []
  );

  const renderConfetti = (type) => {
    const origin = confettiOrigins[type];
    return isExploding[type] && !isTargetMet[type] && origin && (
      <div key={type} style={{ position: 'absolute', top: origin.y - 25, left: origin.x - 25 }}>
        <ConfettiExplosion
          zIndex={10000}
          duration={3000}
          width={window.innerWidth}
          particleSize={15}
          particleCount={60}
          onComplete={confettiCompleteHandlers[type]}
        />
      </div>
    );
  };

  return (
    <div className="wrapper" onMouseMove={trackPointer} onPointerDown={handlePointerDown} >

      <Suspense fallback={null}>
        {TARGET_TYPES.map((type) => renderConfetti(type))}
      </Suspense>

      <TargetBanner banners={banners} onDone={type => setBanners(current => current.filter(t => t !== type))} />

      <TargetSetterModal
        display={displayTargetSetter}
        setDisplay={setDisplayTargetSetter}
        boardID={boardID}
        boards={boards}
        setBoards={setBoards}
        setAlertConf={setAlertConf}
      />

      <div className="board-content-wrapper">
        {
          isLoading || loadedBoardID !== boardID ? <Loader /> : <div className="flex-container">
            <div className="board-filter-actions-wrapper fadeUp-animation">

              <div className="board-name-wrapper">

                <div className="board-name">
                  <div className={`board-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : null}`} ref={emojiMenuRef}>
                    <div className="emoji-icon" onPointerEnter={preloadEmojiPicker} onClick={() => setDisplayEmojiPicker(current => !current)}>{board?.Emoji}</div>
                    {
                      displayEmojiPicker ? <div className="board-emoji-wrapper">
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} containerRef={emojiMenuRef} onClose={() => setDisplayEmojiPicker(false)} />
                      </div> : null
                    }
                  </div>
                  {board?.Board.length > maxLength ? `${board.Board.substring(0, maxLength)}...` : board?.Board}
                  <img className="edit-icon" src={editIcon} alt="edit icon" onClick={() => setPromptConf({
                    display: true,
                    isEdit: true,
                    defaultText: board.Board,
                    title: "Rename this board ✏️",
                    callbackFunc: handleEditBoard,
                  })} />
                </div>
              </div>

              <DatePills />

              <div className="board-actions-wrapper">
                <div className="board-action">
                  <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={() => setConfirmConf({
                    display: true,
                    title: deleteMessage,
                    textValue: "🚨 No take-backs: this can't be undone 🚨",
                    callbackFunc: handleDeleteBoard,
                  })} />
                  <div className="board-action-tooltip">Delete Board</div>
                </div>

                <div className="board-action">
                  <img className="clear-icon" src={clearIcon} alt="clear icon" onClick={handleClearClick} />
                  <div className="board-action-tooltip">Clear Tasks</div>
                </div>

                <div className="board-action">
                  <img className="clear-icon" src={targetIcon} alt="target icon" onClick={() => setDisplayTargetSetter(true)} />
                  <div className="board-action-tooltip">Set Targets</div>
                </div>
              </div>

              <ScoreBoard
                key={boardID}
                boards={boards}
                setBoards={setBoards}
                boardID={boardID}
                refreshCount={refreshCount}
                setAlertConf={setAlertConf}
                setIsExploding={setIsExploding}
                setIsTargetMet={setIsTargetMet}
                isExploding={isExploding}
              />

            </div>
            {
              !sortedTasks || Object.keys(sortedTasks).length === 0 ? (
                <div className="fadeUp-animation" style={{ fontSize: "20px", marginTop: "40px", marginBottom: "30px", }}>
                  Create a category to get going...
                </div>
              ) : null
            }
            <CardList
              key={boardID}
              sortedTasks={sortedTasks}
              setSortedTasks={setSortedTasks}
              setBoards={setBoards}
              setPromptConf={setPromptConf}
              setConfirmConf={setConfirmConf}
              setAlertConf={setAlertConf}
              tickedCheckboxRef={tickedCheckbox}
            />
          </div>
        }
      </div>
      <SyncIndicator />
    </div >
  );
};

export default Board;
