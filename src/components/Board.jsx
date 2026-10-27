import { useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useRef, lazy, Suspense } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI, updateBoardEmojiAPI } from '../utils/apiGatewayClient';
import { applyPending, flushNow, mergePending, queueDeleteAll, readPending, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { dropCachedTasks, getCachedTasks, setCachedTasks } from '../utils/boardCache';
import { getBoardIdFromUrl } from '../utils/utils';
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

const Board = ({ sortedTasks, setSortedTasks, setBoards, boards, isLoading, setIsLoading, setPromptConf, setConfirmConf, setAlertConf, setActiveBoardID }) => {
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [displayTargetSetter, setDisplayTargetSetter] = useState(false);
  const cursorPosition = useRef({ x: 0, y: 0 }); // Read only when confetti starts, so moving the pointer never re-renders the board
  const [confettiOrigin, setConfettiOrigin] = useState(null);
  const [isTargetMet, setIsTargetMet] = useState({ weekly: true, monthly: true, yearly: true });
  const [isExploding, setIsExploding] = useState({ weekly: false, monthly: false, yearly: false });
  const [bannerQueue, setBannerQueue] = useState([]);
  const announced = useRef(new Set()); // Targets already queued for a banner, cleared when the score drops below target
  const [remoteData, setRemoteData] = useState(null); // { boardID, load, tasks, failed } so a late response can't land on another board or visit
  const [loadedBoardID, setLoadedBoardID] = useState(null); // Board whose tasks are in sortedTasks; the loader shows until it matches
  const loadCount = useRef(0); // Numbers each board switch, so only the latest load's response is applied
  // While a cached copy is on screen and the fresh one loads: SHOWING_CACHE until the cached copy lands, then the sortedTasks it landed as
  const shownFromCache = useRef(null);
  const boardID = getBoardIdFromUrl();
  const board = boards.find(b => b.SK === boardID)
  const maxLength = 20;
  const navigate = useNavigate();
  const emojiMenuRef = useRef(null)
  const deleteMessage = `Delete Board - "${board?.Board}" ?`;

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
    setBannerQueue([])
  }, [boardID]);

  // Fetched while idle so the first celebration doesn't wait on the network
  useEffect(() => {
    if (loadedBoardID !== boardID) return;
    const idle = window.requestIdleCallback ?? (cb => setTimeout(cb, 2000));
    idle(() => import('react-confetti-explosion'));
  }, [loadedBoardID, boardID]);

  // Queue a banner whenever confetti starts for a target, mirroring the confetti re-arm rules
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
      // One banner per type: skip any type already queued or on screen (e.g. complete, undo, complete again)
      setBannerQueue(current => [...current, ...newlyHit.filter(type => !current.includes(type))]);
    }
  }, [isExploding, isTargetMet]);

  // Also on pointer down, so a tap on a touch screen (which sends no mousemove) still places the confetti
  const trackPointer = (e) => {
    cursorPosition.current = {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
    };
  };

  // Pinned where the pointer was when it started, so the burst stays put while it plays
  const confettiActive = ['weekly', 'monthly', 'yearly'].some(type => isExploding[type] && !isTargetMet[type]);
  useEffect(() => {
    setConfettiOrigin(confettiActive ? { ...cursorPosition.current } : null);
  }, [confettiActive]);

  const handleEditBoard = async (name) => {
    if (!name) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "Board name can't be empty...",
      });
      return;
    }
    setIsLoading(true);

    try {
      await renameBoardAPI(boardID, name);
      setBoards(current => {
        return current.map(b => b.SK === boardID ? { ...b, Board: name } : b);
      });

    } catch (error) {
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    setIsLoading(true);
    try {
      await deleteBoard(boardID);
      dropCachedTasks(boardID);
      setBoards((boards) => boards.filter(b => b.SK !== boardID));
      navigate('/home');
    } catch (error) {
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Something went wrong while deleting the board.",
      });
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
        title: "Nothing to Clear ✨",
        textValue: "There are no completed tasks on this board.",
      });
      return;
    }
    setConfirmConf({
      display: true,
      title: "Clear All Completed Tasks?",
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
      const [data] = await Promise.all([getActiveTasks(boardID, { silent: background }), flushNow({ timeout: LOAD_FLUSH_TIMEOUT })]);
      const after = await readPending();
      setRemoteData({ boardID, load, tasks: applyPending(data ?? [], mergePending(before, after), boardID) });
    } catch (error) {
      if (background) {
        console.error('Background refresh failed, keeping the cached tasks:', error);
        return;
      }
      setRemoteData({ boardID, load, tasks: [], failed: true }); // Show the empty board behind the alert rather than spinning forever
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Failed to fetch tasks.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (e) => {
    const selectedEmoji = e.native;
    updateBoardEmojiAPI(boardID, selectedEmoji);
    setBoards(current =>
      current.map(b =>
        b.SK === boardID ? { ...b, Emoji: selectedEmoji } : b
      )
    );
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

  const renderConfetti = (type) => (
    isExploding[type] && !isTargetMet[type] && (
      <ConfettiExplosion
        key={type}
        zIndex={10000}
        duration={3000}
        width={window.innerWidth}
        particleSize={15}
        particleCount={60}
        onComplete={() => handleConfettiComplete(type)}
      />
    )
  );

  return (
    <div className="wrapper" onMouseMove={trackPointer} onPointerDown={trackPointer} >

      {confettiOrigin && (
        <div style={{ position: 'absolute', top: confettiOrigin.y - 25, left: confettiOrigin.x - 25 }}>
          <Suspense fallback={null}>
            {['weekly', 'monthly', 'yearly'].map((type) => renderConfetti(type))}
          </Suspense>
        </div>
      )}

      <TargetBanner queue={bannerQueue} onShown={() => setBannerQueue(current => current.slice(1))} />

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
                    title: "Enter New Board Name...",
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
                    textValue: "🚨 This action can't be undone 🚨",
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
              boards={boards}
              setPromptConf={setPromptConf}
              setConfirmConf={setConfirmConf}
              setAlertConf={setAlertConf}
            />
          </div>
        }
      </div>
      <SyncIndicator />
    </div >
  );
};

export default Board;
