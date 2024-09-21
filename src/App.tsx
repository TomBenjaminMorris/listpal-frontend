import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getBoards, getUser } from './utils/apiGatewayClient';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ConfirmUserPage from './components/ConfirmUserPage';
import Board from './components/Board';
import Settings from './components/Settings';
import './App.css'
import _debounce from 'lodash.debounce';

const App = () => {
  // console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [sortedTasks, setSortedTasks] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [sidebarBoardsMenuIsOpen, setSidebarBoardsMenuIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
  const [hideMobileSidebar, setHideMobileSidebar] = useState(true);

  useEffect(() => {
    const handleResize = _debounce(() => setIsMobile(window.innerWidth < 650), 10)
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  useEffect(() => {
    const theme = userDetails.Theme ? userDetails.Theme : 'purple-haze';
    document.documentElement.style.setProperty("--background", `var(--${theme}-bg)`);
    document.documentElement.style.setProperty("--foreground", `var(--${theme}-fg)`);
    document.documentElement.style.setProperty("--text-colour", `var(--${theme}-text-colour)`);
    document.documentElement.style.setProperty("--accent", `var(--${theme}-accent)`);
    document.documentElement.style.setProperty("--accent-2", `var(--${theme}-accent-2)`);
  }, [userDetails])

  useEffect(() => {
    setIsLoading(true);
    getUser().then((u) => {
      getBoards().then((b) => {
        setUserDetails(u[0]);
        setBoards(b);
        setIsLoading(false);
      });
    })
  }, [])

  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  const setOrderedSortedTasks = (tasks) => {
    const tmpOrderedSortedTasks = Object.keys(tasks).sort().reduce(
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
    console.log("TTT triggered: handleLogout")
    setBoards([]);
    setSortedTasks([]);
    setUserDetails({})
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />

        <Route path="/home" element={isAuthenticated() ? <HomePage
          userDetails={userDetails}
          boards={boards}
          setBoards={setBoards}
          handleSidebarCollapse={handleSidebarCollapse}
          handleLogout={handleLogout}
          sidebarIsOpen={sidebarIsOpen}
          isLoading={isLoading}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar}
          setHideMobileSidebar={setHideMobileSidebar}
          setSidebarIsOpen={setSidebarIsOpen} /> : <Navigate replace to="/login" />} />

        <Route path="/board/*" element={isAuthenticated() ? <Board
          setUserDetails={setUserDetails}
          userDetails={userDetails}
          sortedTasks={sortedTasks}
          setBoards={setBoards}
          setSortedTasks={setOrderedSortedTasks}
          handleSidebarCollapse={handleSidebarCollapse}
          handleLogout={handleLogout}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          isLoading={isLoading}
          setHideMobileSidebar={setHideMobileSidebar}
          setSidebarIsOpen={setSidebarIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar} /> : <Navigate replace to="/login" />} />

        <Route path="/settings" element={isAuthenticated() ? <Settings
          userDetails={userDetails}
          setUserDetails={setUserDetails}
          handleSidebarCollapse={handleSidebarCollapse}
          handleLogout={handleLogout}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards}
          sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen}
          isLoading={isLoading}
          setHideMobileSidebar={setHideMobileSidebar}
          setSidebarIsOpen={setSidebarIsOpen}
          isMobile={isMobile}
          hideMobileSidebar={hideMobileSidebar} /> : <Navigate replace to="/login" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
