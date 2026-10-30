import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import { isAuthenticated } from './utils/utils';
import { applyPendingBoards, boardsWithQueuedTasks, flushNow, mergePending, startSync, getSyncStatus, readPending, LOAD_FLUSH_TIMEOUT } from './utils/syncEngine';
import { setAlertListener } from './utils/alertBus';
import { watchForReturn } from './utils/refreshOnReturn';
import _debounce from 'lodash.debounce';
import HomePage from './components/HomePage';
import Board from './components/Board';
import Settings from './components/Settings';
import Prompt from './components/Prompt';
import Confirm from './components/Confirm';
import Alert from './components/Alert';
import SideNavBar from './components/SideNavBar';
import RedirectPage from './components/RedirectPage';
import Logout from './components/Logout';
import config from "./config.json";
import './App.css';

const DEFAULT_THEME = 'purple-haze';
const MOBILE_BREAKPOINT = 650;
const SIDEBAR_OPEN_KEY = 'sidebarIsOpen';
const SIDEBAR_BOARDS_MENU_OPEN_KEY = 'sidebarBoardsMenuIsOpen';

const readStoredFlag = (key) => localStorage.getItem(key) === 'true';

const parseBoards = (boardsData) => boardsData.map(board => ({
  ...board,
  CategoryOrder: board.CategoryOrder ? JSON.parse(board.CategoryOrder) : []
}));

let isDev = true;
if (process.env.NODE_ENV === 'development') {
  isDev = true;
} else if (process.env.NODE_ENV === 'production') {
  isDev = false;
} else {
  console.log('Unknown Environment');
}

const App = () => {
  const [boards, setBoards] = useState([]);
  const [sortedTasks, setSortedTasks] = useState({});
  const [sidebarIsOpen, setSidebarIsOpen] = useState(() => readStoredFlag(SIDEBAR_OPEN_KEY));
  const [sidebarBoardsMenuIsOpen, setSidebarBoardsMenuIsOpen] = useState(() => readStoredFlag(SIDEBAR_BOARDS_MENU_OPEN_KEY));
  // Toggled in step with sidebarIsOpen, so it starts as its inverse
  const [hideMobileSidebar, setHideMobileSidebar] = useState(() => !readStoredFlag(SIDEBAR_OPEN_KEY));
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [isLoading, setIsLoading] = useState(true);
  // Separate from isLoading, which Board turns back on for each board switch and would hide the sidebar each time
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0); // Moves on each refresh on return, after the boards have landed
  const [modalStates, setModalStates] = useState({ prompt: { callbackFunc: () => { } }, confirm: { callbackFunc: () => { } }, alert: {} });
  const [userDetails, setUserDetails] = useState(() => {
    const storedDetails = localStorage.getItem('userDetails');
    return storedDetails && storedDetails !== "undefined"
      ? JSON.parse(storedDetails)
      : { Theme: DEFAULT_THEME };
  });
  // An ID, not a copy of the board: a copy goes stale on every boards change, and refreshing it re-rendered the whole app
  const [activeBoardID, setActiveBoardID] = useState(null);
  const activeBoard = useMemo(() => boards.find(b => b.SK === activeBoardID) ?? null, [boards, activeBoardID]);

  const modalSetters = useMemo(() => ({
    setPromptConf: (conf) => setModalStates(prev => ({ ...prev, prompt: conf })),
    setConfirmConf: (conf) => setModalStates(prev => ({ ...prev, confirm: conf })),
    setAlertConf: (conf) => setModalStates(prev => ({ ...prev, alert: conf }))
  }), []);

  // Declared before the data load so API failures from it have somewhere to go
  useEffect(() => setAlertListener(modalSetters.setAlertConf), [modalSetters]);

  const applyTheme = useCallback((theme) => {
    document.documentElement.dataset.theme = theme;
  }, []);

  // Queued edits survive a reload and are resent on the next load, so only warn while syncing is failing:
  // closing the tab then leaves them stranded on this device. A reload can't be told apart from a close here.
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const { pending, lastError } = getSyncStatus();
      if (pending > 0 && lastError) {
        const message = "Are you sure you want to leave? Your changes may not be saved.";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Server-confirmed scores replace the optimistic ones applied when a task was ticked
  useEffect(() => {
    startSync({
      onBoardScores: (scores) => setBoards(current => current.map(b => {
        const confirmed = scores.find(s => s.SK === b.SK);
        return confirmed ? { ...b, ...confirmed } : b;
      }))
    });
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthenticated()) return;

      try {
        // Read either side of the flush, as Board does for tasks, so a board edit settled in between still shows
        const before = await readPending();
        // A tick queued before a reload must land before the boards are read, or the scores come back stale
        const boardsAfterSync = flushNow({ timeout: LOAD_FLUSH_TIMEOUT }).then(() => getBoards());
        const [userData, boardsData] = await Promise.all([getUser(), boardsAfterSync]);
        const after = await readPending();
        const user = userData[0];

        setUserDetails(user);
        setBoards(applyPendingBoards(parseBoards(boardsData), mergePending(before, after)));
        localStorage.setItem('userDetails', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
        setInitialLoadDone(true);
      }
    };

    applyTheme(userDetails.Theme);
    loadInitialData();

    const handleResize = _debounce(
      () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT),
      20
    );

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Picks up changes made on another device when the user comes back. Boards (scores, names, category order)
  // land before refreshCount moves, so Board refetches its tasks knowing the latest category order.
  useEffect(() => watchForReturn(async () => {
    if (!isAuthenticated()) return;
    try {
      await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
      const before = await readPending();
      const fetched = parseBoards(await getBoards({ silent: true }));
      const after = await readPending();
      // Board settings still queued here win over the server's, so a refresh mid-request can't undo them
      const fresh = applyPendingBoards(fetched, mergePending(before, after));
      // The server's scores leave out ticks still queued here, so those boards keep their optimistic scores
      const pendingBoards = boardsWithQueuedTasks([...before, ...after]);
      setBoards(current => fresh.map(board => {
        const local = current.find(b => b.SK === board.SK);
        return local && pendingBoards.has(board.SK)
          ? { ...board, WScore: local.WScore, MScore: local.MScore, YScore: local.YScore }
          : board;
      }));
      setRefreshCount(count => count + 1);
    } catch (error) {
      console.error('Refresh on return failed, keeping what is on screen:', error);
    }
  }), []);

  useEffect(() => {
    applyTheme(userDetails.Theme);
  }, [userDetails]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, sidebarIsOpen);
  }, [sidebarIsOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_BOARDS_MENU_OPEN_KEY, sidebarBoardsMenuIsOpen);
  }, [sidebarBoardsMenuIsOpen]);

  // Read at call time, so the setter below can keep one identity for memoised children
  const categoryOrderRef = useRef([]);
  categoryOrderRef.current = activeBoard?.CategoryOrder ?? [];

  // Takes a value or an updater, like a state setter. A category missing from the order ranks -1 and
  // sorts first, and a repeated one ranks by its first place, both as indexOf did
  const setOrderedSortedTasks = useCallback((next, incomingSortArr) => {
    const sortArr = incomingSortArr ?? categoryOrderRef.current;
    const rank = new Map();
    sortArr?.forEach((category, i) => { if (!rank.has(category)) rank.set(category, i); });
    const position = category => rank.get(category) ?? -1;

    setSortedTasks(prev => {
      const tasks = typeof next === 'function' ? next(prev) : next;
      if (!rank.size) return tasks;
      return Object.fromEntries(
        Object.keys(tasks).sort((a, b) => position(a) - position(b)).map(key => [key, tasks[key]])
      );
    });
  }, []);

  const handleSidebarCollapse = useCallback(() => {
    setSidebarIsOpen(prev => !prev);
    setHideMobileSidebar(prev => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(
      isDev ? config.managedLoginLocal : config.managedLoginRemote
    );
  }, []);

  return (
    <>
      <span className="transparent_gradient" />
      <BrowserRouter>
        {Object.keys(modalStates.prompt).length > 1 && (<Prompt promptConf={modalStates.prompt} setPromptConf={modalSetters.setPromptConf} />)}
        {Object.keys(modalStates.confirm).length > 1 && (<Confirm confirmConf={modalStates.confirm} setConfirmConf={modalSetters.setConfirmConf} />)}
        {Object.keys(modalStates.alert).length > 1 && (<Alert alertConf={modalStates.alert} setAlertConf={modalSetters.setAlertConf} />)}

        {/* Held back until the first load lands, so it arrives with the page content instead of beside the loader */}
        {isAuthenticated() && initialLoadDone ? (<SideNavBar
          handleSidebarCollapse={handleSidebarCollapse}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar}
          setActiveBoardID={setActiveBoardID}
          activeBoard={activeBoard}
        />) : null}

        <div className={`${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`} >

          <Routes>
            <Route path="/" element={<Navigate replace to="/home" />} />
            <Route path="/redirect" element={<RedirectPage isDev={isDev} />} />
            <Route path="/logout" element={<Logout handleLogout={handleLogout} />} />

            <Route
              path="/home"
              element={isAuthenticated() ? (<HomePage
                boards={boards}
                setBoards={setBoards}
                isLoading={isLoading}
                setPromptConf={modalSetters.setPromptConf}
                setAlertConf={modalSetters.setAlertConf}
                setActiveBoardID={setActiveBoardID}
              />) : (<Navigate replace to="/logout" />)}
            />

            <Route
              path="/board/*"
              element={isAuthenticated() ? (<Board
                sortedTasks={sortedTasks}
                setBoards={setBoards}
                setSortedTasks={setOrderedSortedTasks}
                boards={boards}
                refreshCount={refreshCount}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setPromptConf={modalSetters.setPromptConf}
                setConfirmConf={modalSetters.setConfirmConf}
                setAlertConf={modalSetters.setAlertConf}
                setActiveBoardID={setActiveBoardID}
              />) : (<Navigate replace to="/logout" />)}
            />

            <Route
              path="/settings"
              element={isAuthenticated() ? (<Settings
                userDetails={userDetails}
                setUserDetails={setUserDetails}
                isLoading={isLoading}
              />) : (<Navigate replace to="/logout" />)}
            />

            <Route path="*" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/logout" />} />
          </Routes>

        </div>
      </BrowserRouter>
    </>
  );
};

export default App;
