import { useLocation } from "react-router-dom";
import config from "../config.json";
import { setTokensFromCode } from "../utils/authService";

const RedirectPage = ({}) => {
  const location = useLocation();
  const authCode = new URLSearchParams(location.search).get('code');
  
  if (authCode) {
    setTokensFromCode(authCode, true ? config.redirectLocal : config.redirectRemote);
  } else {
    window.location.replace("/home")
  }

  return (
    <div className="loadingWrapper" style={{color: "white", backgroundColor: "var(--purple-haze-bg)"}}>
      logging in...
    </div>
  )
}

export default RedirectPage;
