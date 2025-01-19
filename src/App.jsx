import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import { getSortArray, isAuthenticated } from './utils/utils';
import _debounce from 'lodash.debounce';
import HomePage from './components/HomePage';
import WeeklyRoundups from './components/WeeklyRoundups';
import Board from './components/Board';
import Settings from './components/Settings';
import Prompt from './components/Prompt';
import Confirm from './components/Confirm';
import Alert from './components/Alert';
import Header from './components/Header';
import SideNavBar from './components/SideNavBar';
import RedirectPage from './components/RedirectPage';
import Logout from './components/Logout';
import Stats from './components/Stats';
import config from "./config.json";
import './App.css';

const DEFAULT_THEME = 'purple-haze';
const MOBILE_BREAKPOINT = 650;

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
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [sidebarBoardsMenuIsOpen, setSidebarBoardsMenuIsOpen] = useState(false);
  const [hideMobileSidebar, setHideMobileSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [isLoading, setIsLoading] = useState(true);
  const [modalStates, setModalStates] = useState({ prompt: { callbackFunc: () => { } }, confirm: { callbackFunc: () => { } }, alert: {} });
  const [userDetails, setUserDetails] = useState(() => {
    const storedDetails = localStorage.getItem('userDetails');
    return storedDetails && storedDetails !== "undefined"
      ? JSON.parse(storedDetails)
      : { Theme: DEFAULT_THEME };
  });

  const applyTheme = useCallback((theme) => {
    const cssVars = {
      '--background': `var(--${theme}-bg)`,
      '--foreground': `var(--${theme}-fg)`,
      '--text-colour': `var(--${theme}-text-colour)`,
      '--accent': `var(--${theme}-accent)`,
      '--accent-2': `var(--${theme}-accent-2)`
    };

    Object.entries(cssVars).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, []);


  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthenticated()) return;

      try {
        const [userData, boardsData] = await Promise.all([getUser(), getBoards()]);
        const user = userData[0];
        const processedBoards = boardsData.map(board => ({
          ...board,
          CategoryOrder: board.CategoryOrder ? JSON.parse(board.CategoryOrder) : []
        }));

        setUserDetails(user);
        setBoards(processedBoards);
        localStorage.setItem('userDetails', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
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


  useEffect(() => {
    applyTheme(userDetails.Theme);
  }, [userDetails, applyTheme]);


  const setOrderedSortedTasks = useCallback((tasks) => {
    const sortArr = getSortArray(boards);
    if (!sortArr?.length) {
      setSortedTasks(tasks);
      return;
    }

    const sortFunc = (a, b) => sortArr.indexOf(a) - sortArr.indexOf(b);
    const orderedTasks = Object.keys(tasks)
      .sort(sortFunc)
      .reduce((obj, key) => ({ ...obj, [key]: tasks[key] }), {});

    setSortedTasks(orderedTasks);
  }, [boards]);


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


  const modalSetters = useMemo(() => ({
    setPromptConf: (conf) => setModalStates(prev => ({ ...prev, prompt: conf })),
    setConfirmConf: (conf) => setModalStates(prev => ({ ...prev, confirm: conf })),
    setAlertConf: (conf) => setModalStates(prev => ({ ...prev, alert: conf }))
  }), []);

  return (
    <>
      <span className="transparent_gradient" />
      <BrowserRouter>
        {Object.keys(modalStates.prompt).length > 1 && (<Prompt promptConf={modalStates.prompt} setPromptConf={modalSetters.setPromptConf} />)}
        {Object.keys(modalStates.confirm).length > 1 && (<Confirm confirmConf={modalStates.confirm} setConfirmConf={modalSetters.setConfirmConf} />)}
        {Object.keys(modalStates.alert).length > 1 && (<Alert alertConf={modalStates.alert} setAlertConf={modalSetters.setAlertConf} />)}

        {isAuthenticated() ? (<SideNavBar
          handleSidebarCollapse={handleSidebarCollapse}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          setIsLoading={setIsLoading}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar}
        />) : null}

        <div className={`${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>

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
              />) : (<Navigate replace to="/logout" />)}
            />

            <Route
              path="/weekly-roundups"
              element={isAuthenticated() ? (<WeeklyRoundups
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              ) : (<Navigate replace to="/logout" />)}
            />

            <Route
              path="/stats"
              element={isAuthenticated() ? (<Stats
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                boards={boards}
              />
              ) : (<Navigate replace to="/logout" />)}
            />

            <Route
              path="/board/*"
              element={isAuthenticated() ? (<Board
                sortedTasks={sortedTasks}
                setBoards={setBoards}
                setSortedTasks={setOrderedSortedTasks}
                boards={boards}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setPromptConf={modalSetters.setPromptConf}
                setConfirmConf={modalSetters.setConfirmConf}
                setAlertConf={modalSetters.setAlertConf}
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
