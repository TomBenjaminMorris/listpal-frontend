import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp } from '../utils/authService';

const ConfirmUserPage = ({ setAlertConf }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await confirmSignUp(email, confirmationCode);
      setAlertConf({
        display: true,
        animate: true,
        title: "Confirmation 👍",
        textValue: "Account confirmed successfully! Sign in on next page...",
      })
      navigate('/login');
    } catch (error) {
      setAlertConf({
        display: true,
        animate: true,
        title: "Error 💀",
        textValue: `Failed to confirm account: ${error}`,
      })
    }
  };

  return (
    <div className="loginForm">
      <h2>Confirm Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            className="inputText"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            className="inputText"
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Confirmation Code"
            required />
        </div>
        <br />
        <button type="submit">Confirm Account</button>
      </form>
    </div>
  );
};

export default ConfirmUserPage;
