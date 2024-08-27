import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  const handleRefreshTokens = async () => {
    console.log("TTTT triggered: handleRefreshTokens")
    const token = await refreshTokens(sessionStorage.refreshToken)
    if (token) {
      console.log("TTTT tokens refreshed successfully");
      return token
    } else {
      console.log("TTTT tokens not refreshed");
    }
  };

  useEffect(() => {
    if (isTokenExpired()) {
      console.log("TTTT token expired, renewing...");
      try {
        handleRefreshTokens().then((t) => {
          window.location.reload();
        })
      }
      catch (err) {
      }
    }

    if (isAuthenticated) {
      getUser().then((u) => {
        setUserDetails(u[0]);
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />

        <Route path="/home" element={isAuthenticated() ? <HomePage
          setUserDetails={setUserDetails}
          userDetails={userDetails}
          setSortedTasks={setSortedTasks}
          boards={boards}
          setBoards={setBoards} /> : <Navigate replace to="/login" />} />

        <Route path="/board/*" element={isAuthenticated() ? <Board
          setUserDetails={setUserDetails}
          userDetails={userDetails}
          sortedTasks={sortedTasks}
          setBoards={setBoards}
          setSortedTasks={setSortedTasks} /> : <Navigate replace to="/login" />} />

        <Route path="/settings" element={<Settings userDetails={userDetails} setUserDetails={setUserDetails} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
