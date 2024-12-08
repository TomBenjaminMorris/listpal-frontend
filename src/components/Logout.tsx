import { useEffect } from 'react';
const Logout = ({ handleLogout }) => {
  useEffect(() => {
    handleLogout()
  }, []);
  return null
}

export default Logout;
