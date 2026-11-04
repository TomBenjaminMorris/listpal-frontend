import { useNavigate } from 'react-router-dom';
import { memo, useEffect, useLayoutEffect, useMemo, useState, useRef, lazy, Suspense } from 'react';
import { deleteBoard, getActiveTasks } from '../utils/apiGatewayClient';
import { applyPending, boardCreateQueued, flushNow, forgetBoard, mergePending, queueDeleteAll, readPending, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { dropCachedTasks, getCachedTasks, setCachedTasks } from '../utils/boardCache';
import { getBoardIdFromUrl, saveBoardSettings } from '../utils/utils';
import { apiErrorAlert } from '../utils/apiErrors';
import { nameRequiredAlert } from '../utils/nameAlerts';
import { EraserIcon, PencilIcon, TargetIcon, TrashIcon } from './Icons';
import CardList from './CardList';
import DatePills from './DatePills';
import ScoreBoard from './ScoreBoard';
import TargetSetterModal from './TargetSetterModal';
import TargetBanner from './TargetBanner';
import SyncIndicator from './SyncIndicator';
import EmojiPicker, { preloadEmojiPicker } from './EmojiPicker';
import './Board.css';

// Memoised as the library rebuilds its styles for every particle on each render, which ticking a task mid-burst would otherwise trigger
const ConfettiExplosion = memo(lazy(() => import('react-confetti-explosion')));
const SHOWING_CACHE = Symbol('showing cache');
const TARGET_TYPES = ['weekly', 'monthly', 'yearly'];
const targetFlags = value => Object.fromEntries(TARGET_TYPES.map(type => [type, value]));

const Board = ({ sortedTasks, setSortedTasks, setBoards, boards, refreshCount, setPromptConf, setConfirmConf, setAlertConf, setActiveBoardID }) => {
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [displayTargetSetter, setDisplayTargetSetter] = useState(false);
  const cursorPosition = useRef({ x: 0, y: 0 }); // Read only when confetti starts, so moving the pointer never re-renders the board
  const [confettiOrigins, setConfettiOrigins] = useState({}); // Per target, so each burst stays where it started while later ones start elsewhere
  // Set by a tick and cleared by a press, so a burst the tick causes starts at the task and any other starts at the pointer
  const tickedCheckbox = useRef(null);
  const [isTargetMet, setIsTargetMet] = useState(() => targetFlags(true));
  const [isExploding, setIsExploding] = useState(() => targetFlags(false));
  const [banners, setBanners] = useState([]);
  const announced = useRef(new Set()); // Targets already given a banner, cleared when the score drops below target
  const [remoteData, setRemoteData] = useState(null); // { boardID, load, tasks, failed } so a late response can't land on another board or visit
  const [loadedBoardID, setLoadedBoardID] = useState(null); // Board whose tasks are in sortedTasks; the cards wait until it matches
  const [isDeleting, setIsDeleting] = useState(false);
  const loadCount = useRef(0); // Numbers each board switch, so only the latest load's response is applied
  // While a background load runs: SHOWING_CACHE until a cached copy lands, then the sortedTasks on screen when it
  // started (the cached copy, or the board as it was when a refresh on return began)
  const shownFromCache = useRef(null);
  // True for the one commit in which a fresh copy replaces the board on screen, so the cards can animate what it changes
  const remoteUpdateRef = useRef(false);
  const boardID = getBoardIdFromUrl();
  const board = boards.find(b => b.SK === boardID);
  const tasksReady = loadedBoardID === boardID && !isDeleting;
  const navigate = useNavigate();
  const emojiMenuRef = useRef(null);

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
      remoteUpdateRef.current = !!baseline;
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

  // Runs after the children's layout effects, which is when the cards read it
  useLayoutEffect(() => {
    remoteUpdateRef.current = false;
  }, [sortedTasks]);

  // A layout effect, so a cached copy is on screen before the browser paints the board without it
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    setActiveBoardID(boardID);
    const load = ++loadCount.current;
    // board is undefined on a direct page load until boards arrive, and the cache is empty then anyway
    const cached = getCachedTasks(boardID);
    if (cached && board) {
      setSortedTasks(cached, board.CategoryOrder);
      setLoadedBoardID(boardID);
      shownFromCache.current = SHOWING_CACHE;
    } else {
      setLoadedBoardID(null);
      shownFromCache.current = null;
    }
    getTasks({ load, background: !!(cached && board) });
    // Stale state from the previous board must not leak into the new one, or its confetti would play on the switch
    setIsTargetMet(targetFlags(true));
    setIsExploding(targetFlags(false));
    announced.current.clear();
    setBanners([]);
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
    TARGET_TYPES.forEach((type) => {
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
      setAlertConf(nameRequiredAlert('board'));
      return;
    }
    saveBoardSettings(setBoards, boardID, { Board: name });
  };

  const handleDeleteBoard = async () => {
    setIsDeleting(true);
    try {
      // The delete reads the board's tasks and then removes them, so a sync creating one in between would leave it
      // behind with no board. Sending the queue first means nothing for this board is in flight during the delete.
      await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
      await deleteBoard(boardID);
      await forgetBoard(boardID).catch(error => console.error('Could not clear the deleted board from the outbox:', error));
      dropCachedTasks(boardID);
      setBoards((boards) => boards.filter(b => b.SK !== boardID));
      navigate('/home');
    } catch {
      // apiPost has already shown the user what went wrong
    } finally {
      setIsDeleting(false);
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
    // Until the tasks land, sortedTasks still holds the previous board's, and clearing would delete those
    if (!tasksReady) return;
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
    const byCategory = {};
    data.forEach(task => (byCategory[task.Category] ??= []).push(task));
    setSortedTasks(byCategory, board.CategoryOrder);
  };

  // In the background a cached copy is already on screen, so a failure leaves that copy in place
  const getTasks = async ({ load, background = false }) => {
    try {
      // Records queued now are overlaid even if the flush settles them before the fetch reads, and queued
      // changes hold whole field values, so applying one the server already has changes nothing
      const before = await readPending();
      let data = [];
      if (boardCreateQueued(before, boardID)) {
        // The server doesn't have the board yet and would refuse the fetch. Until the create lands, every task on
        // the board is still queued too, so the outbox alone holds the board.
        await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
        if (!boardCreateQueued(await readPending(), boardID)) data = await getActiveTasks(boardID, { silent: true });
      } else {
        [data] = await Promise.all([getActiveTasks(boardID, { silent: true }), flushNow({ timeout: LOAD_FLUSH_TIMEOUT })]);
      }
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
    }
  };

  const handleEmojiSelect = (e) => saveBoardSettings(setBoards, boardID, { Emoji: e.native });

  // Stable, because the library restarts its completion timer whenever onComplete changes, and the board re-renders
  // during a burst. A new handler each render kept a finished burst counted as playing.
  const confettiCompleteHandlers = useMemo(
    () => Object.fromEntries(TARGET_TYPES.map(type => [type, () => setIsTargetMet(current => ({ ...current, [type]: true }))])),
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
          particleCount={40}
          onComplete={confettiCompleteHandlers[type]}
        />
      </div>
    );
  };

  return (
    <div onMouseMove={trackPointer} onPointerDown={handlePointerDown} >

      <Suspense fallback={null}>
        {TARGET_TYPES.map(renderConfetti)}
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
        <div className="flex-container">
          {board && (
            <div className="board-filter-actions-wrapper fadeUp-animation">

              {/* Prefixed because ScoreBoard, a sibling, is keyed by the board too. A shared key leaves old titles on screen */}
              <div key={`name-${boardID}`} className="board-name-content fadeInPure-animation">
                <div className={`board-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : ""}`} ref={emojiMenuRef}>
                  <div className="emoji-icon" onPointerEnter={preloadEmojiPicker} onClick={() => setDisplayEmojiPicker(current => !current)}>{board.Emoji}</div>
                  {
                    displayEmojiPicker ? <div className="board-emoji-wrapper">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} containerRef={emojiMenuRef} onClose={() => setDisplayEmojiPicker(false)} />
                    </div> : null
                  }
                </div>
                <h1 className="board-title" title={board.Board}>{board.Board}</h1>
                <button className="board-rename" aria-label="Rename board" onClick={() => setPromptConf({
                  display: true,
                  isEdit: true,
                  defaultText: board.Board,
                  title: "Rename this board ✏️",
                  callbackFunc: handleEditBoard,
                })}>
                  <PencilIcon />
                </button>
              </div>

              <DatePills />

              <div className={`board-actions-wrapper ${tasksReady ? "" : "board-actions-loading"}`}>
                <div className="board-action">
                  <button aria-label="Delete board" onClick={() => setConfirmConf({
                    display: true,
                    title: `Delete "${board.Board}" for good?`,
                    textValue: "🚨 No take-backs: this can't be undone 🚨",
                    callbackFunc: handleDeleteBoard,
                  })}>
                    <TrashIcon />
                  </button>
                  <div className="tooltip">Delete board</div>
                </div>

                <div className="board-action">
                  <button aria-label="Clear tasks" onClick={handleClearClick}>
                    <EraserIcon />
                  </button>
                  <div className="tooltip">Clear tasks</div>
                </div>

                <div className="board-action">
                  <button aria-label="Set targets" onClick={() => setDisplayTargetSetter(true)}>
                    <TargetIcon />
                  </button>
                  <div className="tooltip">Set targets</div>
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
          )}
          {tasksReady && (
            <CardList
              key={boardID}
              boardName={board?.Board}
              sortedTasks={sortedTasks}
              setSortedTasks={setSortedTasks}
              setBoards={setBoards}
              setPromptConf={setPromptConf}
              setConfirmConf={setConfirmConf}
              setAlertConf={setAlertConf}
              tickedCheckboxRef={tickedCheckbox}
              remoteUpdateRef={remoteUpdateRef}
            />
          )}
        </div>
      </div>
      <SyncIndicator />
    </div>
  );
};

export default Board;
