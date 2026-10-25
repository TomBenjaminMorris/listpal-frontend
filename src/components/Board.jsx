import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI, updateBoardEmojiAPI } from '../utils/apiGatewayClient';
import { flushNow, overlayPending, queueDeleteAll, useSyncStatus, LOAD_FLUSH_TIMEOUT } from '../utils/syncEngine';
import { useOnClickOutside } from 'usehooks-ts'
import { getBoardIdFromUrl } from '../utils/utils';
import ConfettiExplosion from 'react-confetti-explosion';
import deleteIcon from '../assets/icons8-delete-48.png';
import editIcon from '../assets/icons8-edit-64.png';
import targetIcon from '../assets/icons8-bullseye-50.png';
import clearIcon from '../assets/icons8-clear-60.png';
import syncIcon from '../assets/icons8-sync-64.png';
import tickIcon from '../assets/icons8-tick-64.png';
import CardList from './CardList';
import DatePills from './DatePills';
import ScoreBoard from './ScoreBoard';
import TargetSetterModal from './TargetSetterModal';
import TargetBanner from './TargetBanner';
import Loader from './Loader';
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import './Board.css';

const BACK_ONLINE_DURATION = 3000;

const Board = ({ sortedTasks, setSortedTasks, setBoards, boards, isLoading, setIsLoading, setPromptConf, setConfirmConf, setAlertConf, setActiveBoard }) => {
  const syncStatus = useSyncStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const offlineSinceLastSave = useRef(false); // Survives a "Couldn't save" in between, e.g. a flaky reconnect
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [displayTargetSetter, setDisplayTargetSetter] = useState(false);
  const [boardEmoji, setBoardEmoji] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("Delete Board?");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isTargetMet, setIsTargetMet] = useState({ weekly: true, monthly: true, yearly: true });
  const [isExploding, setIsExploding] = useState({ weekly: false, monthly: false, yearly: false });
  const [bannerQueue, setBannerQueue] = useState([]);
  const announced = useRef(new Set()); // Targets already queued for a banner, cleared when the score drops below target
  const [remoteData, setRemoteData] = useState(null); // { boardID, tasks } so a late response can't land on another board
  const [loadedBoardID, setLoadedBoardID] = useState(null); // Board whose tasks are in sortedTasks; the loader shows until it matches
  const boardID = getBoardIdFromUrl();
  const board = boards.find(b => b.SK === boardID)
  const maxLength = 20;
  const navigate = useNavigate();
  const emojiMenuRef = useRef(null)

  useEffect(() => {
    calculatePageTitle()
    loadEmoji();
  }, [boards]);

  useEffect(() => {
    if (remoteData && board && remoteData.boardID === board.SK) {
      sortTasks(remoteData.tasks);
      setLoadedBoardID(board.SK);
    }
  }, [remoteData, board?.SK]); // Depend on the ID, not the object, so local category edits aren't overwritten by stale remote data

  useEffect(() => {
    calculatePageTitle()
    loadEmoji();
    getTasks();
    setIsTargetMet({ weekly: true, monthly: true, yearly: true }) // Reset this to the original state to stop confetti explosion on board switch
    setIsExploding({ weekly: false, monthly: false, yearly: false }) // Stale state from the previous board must not leak into the new one
    announced.current.clear()
    setBannerQueue([])
  }, [boardID]);

  // Confirm recovery once queued edits from an offline spell have actually reached the server
  useEffect(() => {
    if (syncStatus.lastError) {
      if (syncStatus.lastError === "Offline") offlineSinceLastSave.current = true;
      setShowBackOnline(false);
      return;
    }
    if (!offlineSinceLastSave.current) return;
    offlineSinceLastSave.current = false;
    setShowBackOnline(true);
    const timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_DURATION);
    return () => clearTimeout(timer);
  }, [syncStatus.lastError]);

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

  // Calculate and set the page title and active board from the URL ID
  const calculatePageTitle = () => {
    document.title = `ListPal | ${board?.Board} ${board?.Emoji}`;
    setDeleteMessage(`Delete Board - "${board?.Board}" ?`);
    setActiveBoard(board);
  }

  // Function to update the cursor position on mouse move
  const handleMouseMove = (e) => {
    setCursorPosition({
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
    });
  };

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
      document.title = `ListPal$ | ${name + ' ' + board.Emoji}`;
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
    // Loop through categories and filter tasks
    for (const category in sortedTasks) {
      const incompleteTasks = [];
      for (const task of sortedTasks[category]) {
        if (task.CompletedDate !== 'nil') {
          tasksToDelete.push(task); // Collect tasks to delete
        } else {
          incompleteTasks.push(task); // Keep incomplete tasks
        }
      }
      // Update category with only incomplete tasks
      sortedTasks[category] = incompleteTasks;
    }
    // Update the state with the modified tasks
    setSortedTasks({ ...sortedTasks });

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

  const getTasks = async () => {
    setIsLoading(true);
    try {
      // Push queued edits first so the fetch reflects them, then overlay anything that didn't make it
      await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
      const data = await getActiveTasks(boardID);
      setRemoteData({ boardID, tasks: await overlayPending(data ?? [], boardID) });
    } catch (error) {
      setRemoteData({ boardID, tasks: [] }); // Show the empty board behind the alert rather than spinning forever
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
    setBoardEmoji(selectedEmoji);
    updateBoardEmojiAPI(boardID, selectedEmoji);
    document.title = `ListPal | ${board?.Board} ${selectedEmoji}`;
    setBoards(current =>
      current.map(b =>
        b.SK === boardID ? { ...b, Emoji: selectedEmoji } : b
      )
    );
  };

  const loadEmoji = () => {
    setBoardEmoji(board?.Emoji);
  };

  useOnClickOutside(emojiMenuRef, () => {
    if (displayEmojiPicker) {
      setDisplayEmojiPicker(false)
    }
  })

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
    <div className="wrapper" onMouseMove={handleMouseMove} >

      <div style={{ position: 'absolute', top: cursorPosition.y - 25, left: cursorPosition.x - 25 }}>
        {['weekly', 'monthly', 'yearly'].map((type) => renderConfetti(type))}
      </div>

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
                    <div className="emoji-icon" onClick={() => setDisplayEmojiPicker(current => !current)}>{boardEmoji}</div>
                    {
                      displayEmojiPicker ? <div className="board-emoji-wrapper">
                        <Picker
                          data={emojiData}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          autoFocus
                          navPosition="none"
                          previewPosition="none"
                          perLine={8}
                        />
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
                <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={() => setConfirmConf({
                  display: true,
                  title: deleteMessage,
                  textValue: "🚨 This action can't be undone 🚨",
                  callbackFunc: handleDeleteBoard,
                })} />

                <img className="clear-icon" src={clearIcon} alt="clear icon" onClick={handleClearClick} />

                <img className="clear-icon" src={targetIcon} alt="target icon" onClick={() => setDisplayTargetSetter(true)} />
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
      {syncStatus.lastError && syncStatus.pending > 0 && (
        <div className="sync-pill sync-pill-error fadeIn-animation" role="status">
          {syncStatus.lastError === "Offline" ? "Offline" : "Couldn't save"}, retrying...
        </div>
      )}
      {showBackOnline && !syncStatus.lastError && (
        <div className="sync-pill sync-pill-ok fadeIn-animation" role="status">
          Back online
        </div>
      )}
      <div
        className={`board-local-sync-indicator-wrapper ${syncStatus.lastError ? "sync-error" : ""}`}
        title={syncStatus.lastError ? `${syncStatus.lastError}, will retry...` : syncStatus.pending ? "Saving..." : "Saved"}
      >
        {/* Both icons stay mounted so they load up front; swapping src would fetch the sync icon only once offline */}
        <img className="sync-status-icon spin" src={syncIcon} alt="" hidden={!syncStatus.pending} />
        <img className="sync-status-icon" src={tickIcon} alt="" hidden={!!syncStatus.pending} />
      </div>
    </div >
  );
};

export default Board;
