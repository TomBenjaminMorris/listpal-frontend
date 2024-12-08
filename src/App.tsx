import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import { getSortArray, isAuthenticated } from './utils/utils';
import _debounce from 'lodash.debounce';
import HomePage from './components/HomePage';
import Board from './components/Board';
import Settings from './components/Settings';
import Prompt from './components/Prompt';
import Confirm from './components/Confirm';
import Alert from './components/Alert';
import Header from './components/Header';
import SideNavBar from './components/SideNavBar';
import RedirectPage from './components/RedirectPage';
import config from "./config.json";
import Logout from './components/Logout';
import './App.css'

const App = () => {
  // console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [sortedTasks, setSortedTasks] = useState({});
  const [userDetails, setUserDetails] = useState({ Theme: "purple-haze" });
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [sidebarBoardsMenuIsOpen, setSidebarBoardsMenuIsOpen] = useState(false);
  const [hideMobileSidebar, setHideMobileSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
  const [isLoading, setIsLoading] = useState(true);
  const [promptConf, setPromptConf] = useState({ callbackFunc: () => { } });
  const [confirmConf, setConfirmConf] = useState({ callbackFunc: () => { } });
  const [alertConf, setAlertConf] = useState({});
  const isDev = config.isDev;

  useEffect(() => {
    setTheme();
    isAuthenticated() ? loadRequests() : null
    const handleResize = _debounce(() => setIsMobile(window.innerWidth < 650), 10)
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  useEffect(() => {
    setTheme()
  }, [userDetails])

  const setTheme = () => {
    const userDetailsTmp = localStorage.getItem('userDetails')
    const ls_userDetails = userDetailsTmp != "undefined" ? JSON.parse(userDetailsTmp) : null
    const theme = ls_userDetails && ls_userDetails != null ? ls_userDetails.Theme : userDetails ? userDetails.Theme : 'purple-haze';
    document.documentElement.style.setProperty("--background", `var(--${theme}-bg)`);
    document.documentElement.style.setProperty("--foreground", `var(--${theme}-fg)`);
    document.documentElement.style.setProperty("--text-colour", `var(--${theme}-text-colour)`);
    document.documentElement.style.setProperty("--accent", `var(--${theme}-accent)`);
    document.documentElement.style.setProperty("--accent-2", `var(--${theme}-accent-2)`);
  }

  const loadRequests = () => {
    getUser().then((u) => {
      getBoards().then((br) => {
        setUserDetails(u[0]);
        const tmpBr = br.map(b => {
          b['CategoryOrder'] = b.CategoryOrder && JSON.parse(b.CategoryOrder);
          return b;
        })
        setBoards(tmpBr);
        setIsLoading(false);
        localStorage.setItem('userDetails', JSON.stringify(u[0]))
      });
    })
  }

  const setOrderedSortedTasks = (tasks) => {
    let sortArr = getSortArray(boards)
    const sortFunc = (a, b) => {
      return sortArr.indexOf(a) - sortArr.indexOf(b)
    }
    const tmpOrderedSortedTasks = Object.keys(tasks).sort(sortArr === undefined || sortArr.length === 0 ? undefined : sortFunc).reduce(
      (obj, key) => {
        obj[key] = tasks[key];
        return obj;
      },
      {}
    );
    setSortedTasks(tmpOrderedSortedTasks)
  };

  const handleSidebarCollapse = async () => {
    setSidebarIsOpen(current => !current);
    setHideMobileSidebar(current => !current);
  }

  const handleLogout = () => {
    // setBoards([]);
    // setSortedTasks([]);
    // setUserDetails({})
    setIsLoading(true);
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(isDev ? config.managedLoginLocal : config.managedLoginRemote)
  };

  return (
    <>
      <span className="transparent_gradient"></span>
      <BrowserRouter>

        {Object.keys(promptConf).length > 1 && <Prompt promptConf={promptConf} setPromptConf={setPromptConf} />}
        {Object.keys(confirmConf).length > 1 && <Confirm confirmConf={confirmConf} setConfirmConf={setConfirmConf} />}
        {Object.keys(alertConf).length > 1 && <Alert alertConf={alertConf} setAlertConf={setAlertConf} />}

        {isAuthenticated() && !isLoading ? <Header
          setHideMobileSidebar={setHideMobileSidebar}
          setSidebarIsOpen={setSidebarIsOpen}
          sidebarIsOpen={sidebarIsOpen}
          isMobile={isMobile}
        /> : null}

        {isAuthenticated() && !isLoading ? <SideNavBar
          handleSidebarCollapse={handleSidebarCollapse}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          setIsLoading={setIsLoading}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar}
        /> : null}

        <Routes>
          <Route path="/" element={<Navigate replace to="/home" />} />
          <Route path="/redirect" element={<RedirectPage />} />
          <Route path="/logout" element={<Logout handleLogout={handleLogout} />} />

          {/* HOME PAGE */}
          <Route path="/home" element={isAuthenticated() ?
            <HomePage
              boards={boards}
              setBoards={setBoards}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
              setPromptConf={setPromptConf}
              setAlertConf={setAlertConf}
            /> : <Navigate replace to="/logout" />}
          />

          {/* BOARD */}
          <Route path="/board/*" element={isAuthenticated() ?
            <Board
              sortedTasks={sortedTasks}
              setBoards={setBoards}
              setSortedTasks={setOrderedSortedTasks}
              sidebarIsOpen={sidebarIsOpen}
              boards={boards}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setPromptConf={setPromptConf}
              setConfirmConf={setConfirmConf}
              setAlertConf={setAlertConf}
            /> : <Navigate replace to="/logout" />}
          />

          {/* SETTINGS */}
          <Route path="/settings" element={isAuthenticated() ?
            <Settings
              userDetails={userDetails}
              setUserDetails={setUserDetails}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
            /> : <Navigate replace to="/logout" />}
          />

          <Route path="*" element={isAuthenticated() ? <Navigate to="/" /> : <Navigate replace to="/logout" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
