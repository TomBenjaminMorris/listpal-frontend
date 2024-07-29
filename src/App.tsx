import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import ConfirmUserPage from './confirmUserPage';
import './App.css'
import Board from './components/Board';

const App = () => {
  console.log("rendering: App")
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
        <Route path="/home" element={isAuthenticated() ? <HomePage /> : <Navigate replace to="/login" />} />
        <Route path="/board/*" element={isAuthenticated() ? <Board /> : <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
