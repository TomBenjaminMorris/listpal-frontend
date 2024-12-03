import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import { getSortArray, isAuthenticated } from './utils/utils';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ConfirmUserPage from './components/ConfirmUserPage';
import Board from './components/Board';
import Settings from './components/Settings';
import Prompt from './components/Prompt';
import Confirm from './components/Confirm';
import Alert from './components/Alert';
import _debounce from 'lodash.debounce';
import './App.css'
import Header from './components/Header';
import SideNavBar from './components/SideNavBar';


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

  useEffect(() => {
    const handleResize = _debounce(() => setIsMobile(window.innerWidth < 650), 10)
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  useEffect(() => {
    const ls_userDetails = JSON.parse(localStorage.getItem('userDetails'))
    const theme = ls_userDetails ? ls_userDetails.Theme : userDetails.Theme ? userDetails.Theme : 'purple-haze';
    document.documentElement.style.setProperty("--background", `var(--${theme}-bg)`);
    document.documentElement.style.setProperty("--foreground", `var(--${theme}-fg)`);
    document.documentElement.style.setProperty("--text-colour", `var(--${theme}-text-colour)`);
    document.documentElement.style.setProperty("--accent", `var(--${theme}-accent)`);
    document.documentElement.style.setProperty("--accent-2", `var(--${theme}-accent-2)`);
  }, [userDetails])

  useEffect(() => {
    setIsLoading(true);
    isAuthenticated() && getUser().then((u) => {
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
  }, [])

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
    setBoards([]);
    setSortedTasks([]);
    setUserDetails({})
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <>
      <BrowserRouter>

        {/* Prompt/Confirm/Alert */}
        {Object.keys(promptConf).length > 1 && <Prompt promptConf={promptConf} setPromptConf={setPromptConf} />}
        {Object.keys(confirmConf).length > 1 && <Confirm confirmConf={confirmConf} setConfirmConf={setConfirmConf} />}
        {Object.keys(alertConf).length > 1 && <Alert alertConf={alertConf} setAlertConf={setAlertConf} />}

        {isAuthenticated() ? <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} /> : null}

        {isAuthenticated() ? <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} setIsLoading={setIsLoading} /> : null}

        <Routes>
          <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />

          <Route path="/login" element={<LoginPage setUserDetails={setUserDetails} setAlertConf={setAlertConf} />} />

          <Route path="/confirm" element={<ConfirmUserPage setAlertConf={setAlertConf} />} />

          {/* HOME PAGE */}
          <Route path="/home" element={isAuthenticated() ?
            <HomePage
              boards={boards}
              setBoards={setBoards}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
              setPromptConf={setPromptConf}
              setAlertConf={setAlertConf}
            /> : <Navigate replace to="/login" />}
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
            /> : <Navigate replace to="/login" />}
          />

          {/* SETTINGS */}
          <Route path="/settings" element={isAuthenticated() ?
            <Settings
              userDetails={userDetails}
              setUserDetails={setUserDetails}
              sidebarIsOpen={sidebarIsOpen}
              isLoading={isLoading}
            /> : <Navigate replace to="/login" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
