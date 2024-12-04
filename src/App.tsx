import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import { getSortArray, isAuthenticated, isDev } from './utils/utils';
import { setTokensFromCode } from './utils/authService';
// import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
// import ConfirmUserPage from './components/ConfirmUserPage';
import Board from './components/Board';
import Settings from './components/Settings';
import Prompt from './components/Prompt';
import Confirm from './components/Confirm';
import Alert from './components/Alert';
import _debounce from 'lodash.debounce';
import Header from './components/Header';
import SideNavBar from './components/SideNavBar';
import config from "./config.json";
import './App.css'

const App = () => {
  // console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [sortedTasks, setSortedTasks] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [sidebarBoardsMenuIsOpen, setSidebarBoardsMenuIsOpen] = useState(false);
  const [hideMobileSidebar, setHideMobileSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
  const [isLoading, setIsLoading] = useState(true);
  const [promptConf, setPromptConf] = useState({
    // display: false,
    // isEdit: false,
    // defaultText: "",
    // title: "...",
    callbackFunc: () => { },
  });
  const [confirmConf, setConfirmConf] = useState({
    // display: true,
    // title: "",
    // textValue: "",
    callbackFunc: () => { },
  });
  const [alertConf, setAlertConf] = useState({
    // display: true,
    // title: "Warning!",
    // textValue: "This thing is about to happen",
  });
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  // code ? window.location.replace(window.location.href.split("?")[0]) : null
  console.log("isDev: ", isDev())
  const isDevel = false

  useEffect(() => {
    const handleResize = _debounce(() => setIsMobile(window.innerWidth < 650), 10)
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  useEffect(() => {
    if (code) {
      setIsLoading(true);
      !isAuthenticated() ? setTokensFromCode(code, isDevel ? config.redirectURLLocal : config.redirectURLRemote).then(() => {
        loadRequests();
      }) : loadRequests();
    } else {
      if (isAuthenticated()) {
        setIsLoading(true);
        loadRequests();
      } else {
        window.location.replace(isDevel ? config.managedLoginUIURLLocal : config.managedLoginUIURLRemote)
      }
    }
  }, [])

  useEffect(() => {
    const userDetailsTmp = localStorage.getItem('userDetails')
    const ls_userDetails = userDetailsTmp != "undefined" ? JSON.parse(userDetailsTmp) : null
    const theme = ls_userDetails && ls_userDetails != null ? ls_userDetails.Theme : userDetails ? userDetails.Theme : 'purple-haze';
    document.documentElement.style.setProperty("--background", `var(--${theme}-bg)`);
    document.documentElement.style.setProperty("--foreground", `var(--${theme}-fg)`);
    document.documentElement.style.setProperty("--text-colour", `var(--${theme}-text-colour)`);
    document.documentElement.style.setProperty("--accent", `var(--${theme}-accent)`);
    document.documentElement.style.setProperty("--accent-2", `var(--${theme}-accent-2)`);
  }, [userDetails])

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
    setIsLoading(true);
    setBoards([]);
    setSortedTasks([]);
    setUserDetails({})
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(isDevel ? config.managedLoginUIURLLocal : config.managedLoginUIURLRemote)
  };

  return (
    <>
      <span className="transparent_gradient"></span>
      <BrowserRouter>

        {/* Prompt/Confirm/Alert */}
        {Object.keys(promptConf).length > 1 && <Prompt promptConf={promptConf} setPromptConf={setPromptConf} />}
        {Object.keys(confirmConf).length > 1 && <Confirm confirmConf={confirmConf} setConfirmConf={setConfirmConf} />}
        {Object.keys(alertConf).length > 1 && <Alert alertConf={alertConf} setAlertConf={setAlertConf} />}

        {isAuthenticated() ? <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} /> : null}

        {isAuthenticated() ? <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} setIsLoading={setIsLoading} /> : null}

        <Routes>
          <Route path="/" element={<Navigate replace to="/home" />} />

          {/* HOME PAGE */}
          <Route path="/home" element={
            <HomePage
              boards={boards}
              setBoards={setBoards}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
              setPromptConf={setPromptConf}
              setAlertConf={setAlertConf}
            />}
          />

          {/* BOARD */}
          <Route path="/board/*" element={
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
            />}
          />

          {/* SETTINGS */}
          <Route path="/settings" element={
            <Settings
              userDetails={userDetails}
              setUserDetails={setUserDetails}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
            />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
