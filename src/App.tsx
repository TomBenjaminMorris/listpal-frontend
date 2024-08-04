import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import ConfirmUserPage from './confirmUserPage';
import './App.css'
import Board from './components/Board';

const App = () => {
  console.log("rendering: App")
  const [boards, setBoards] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />
        <Route path="/home" element={isAuthenticated() ? <HomePage boards={boards} setBoards={setBoards} setActiveTasks={setActiveTasks} /> : <Navigate replace to="/login" />} />
        <Route path="/board/*" element={isAuthenticated() ? <Board activeTasks={activeTasks} setActiveTasks={setActiveTasks} /> : <Navigate replace to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
