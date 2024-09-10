import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isTokenExpired } from './utils/utils';
import { refreshTokens } from './utils/authService';
import { getUser } from './utils/apiGatewayClient';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ConfirmUserPage from './components/ConfirmUserPage';
import Board from './components/Board';
import Settings from './components/Settings';
import './App.css'

const App = () => {
  // console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [sortedTasks, setSortedTasks] = useState({});
  const [userDetails, setUserDetails] = useState({});
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  // const [theme, setTheme] = useState('purple-haze');

  useEffect(() => {
    const theme = userDetails.Theme ? userDetails.Theme : 'purple-haze';
    document.documentElement.style.setProperty("--background", `var(--${theme}-bg)`);
    document.documentElement.style.setProperty("--foreground", `var(--${theme}-fg)`);
    document.documentElement.style.setProperty("--text-colour", `var(--${theme}-text-colour)`);
    document.documentElement.style.setProperty("--accent", `var(--${theme}-accent)`);
    document.documentElement.style.setProperty("--accent-2", `var(--${theme}-accent-2)`);
  }, [userDetails])

  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  const handleRefreshTokens = async () => {
    console.log("TTTT triggered: handleRefreshTokens")
    const token = await refreshTokens(sessionStorage.refreshToken)
    if (token) {
      // console.log("TTTT tokens refreshed successfully");
      return token
    } else {
      // console.log("TTTT tokens not refreshed");
    }
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
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />

        <Route path="/home" element={isAuthenticated() ? <HomePage
          setUserDetails={setUserDetails}
          userDetails={userDetails}
          setSortedTasks={setOrderedSortedTasks}
          boards={boards}
          setBoards={setBoards}
          handleRefreshTokens={handleRefreshTokens}
          handleSidebarCollapse={handleSidebarCollapse}
          sidebarIsOpen={sidebarIsOpen} /> : <Navigate replace to="/login" />} />

        <Route path="/board/*" element={isAuthenticated() ? <Board
          setUserDetails={setUserDetails}
          userDetails={userDetails}
          sortedTasks={sortedTasks}
          setBoards={setBoards}
          setSortedTasks={setOrderedSortedTasks}
          handleRefreshTokens={handleRefreshTokens}
          handleSidebarCollapse={handleSidebarCollapse}
          sidebarIsOpen={sidebarIsOpen}
          boards={boards} /> : <Navigate replace to="/login" />} />

        <Route path="/settings"
          element={isAuthenticated() ? <Settings userDetails={userDetails}
            setUserDetails={setUserDetails}
            isTokenExpired={isTokenExpired}
            handleRefreshTokens={handleRefreshTokens}
            getUser={getUser}
            handleSidebarCollapse={handleSidebarCollapse}
            sidebarIsOpen={sidebarIsOpen}
            setSortedTasks={setSortedTasks}
            setBoards={setBoards}
            boards={boards} /> : <Navigate replace to="/login" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
