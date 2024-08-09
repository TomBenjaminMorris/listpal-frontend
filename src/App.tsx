import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useReducer } from 'react';
import { isTokenExpired } from './utils/utils';
import { refreshTokens } from './utils/authService';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import ConfirmUserPage from './ConfirmUserPage';
import Board from './components/Board';
import './App.css'

const App = () => {
  // console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [activeBoard, setActiveBoard] = useState("");

  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  const handleRefreshTokens = async () => {
    console.log("TTTT triggered: handleRefreshTokens")
    const token = await refreshTokens(sessionStorage.refreshToken)
    if (token) {
      console.log("TTTT tokens refreshed successfully");
    } else {
      console.log("TTTT tokens not refreshed");
    }
  };

  useEffect(() => {
    if (isTokenExpired()) {
      console.log("TTTT token expired, renewing...");
      try {
        handleRefreshTokens().then(() => {
          window.location.reload();
        })
      }
      catch (err) {
      }
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />
        <Route path="/home" element={isAuthenticated() ? <HomePage setActiveBoard={setActiveBoard} boards={boards} setBoards={setBoards} setActiveTasks={setActiveTasks} /> : <Navigate replace to="/login" />} />
        <Route path="/board/*" element={isAuthenticated() ? <Board activeBoard={activeBoard} activeTasks={activeTasks} setActiveTasks={setActiveTasks} /> : <Navigate replace to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
