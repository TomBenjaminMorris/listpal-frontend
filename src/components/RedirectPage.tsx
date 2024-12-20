import { useLocation } from "react-router-dom";
import { setTokensFromCode } from "../utils/authService";
import config from "../config.json";

const RedirectPage = ({}) => {
  const location = useLocation();
  const authCode = new URLSearchParams(location.search).get('code');
  const isDev = config.isDev;

  if (authCode) {
    setTimeout(() => {
      setTokensFromCode(authCode, isDev ? config.redirectLocal : config.redirectRemote);
    }, 800);
  } else {
    setTimeout(() => {
      window.location.replace("/home")
    }, 800);
  }

  return (
    <div className="loadingWrapper fadeInPure-animation" style={{ color: "white", fontSize: "35px", backgroundColor: "var(--purple-haze-bg)" }}>
      <div className="logo-text-wrapper">
        <div className="logo-text-1">List</div>
        <div className="logo-text-2">Pal</div>
      </div>
    </div>
  )
}

export default RedirectPage;
