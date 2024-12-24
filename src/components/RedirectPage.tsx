import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setTokensFromCode } from "../utils/authService";
import config from "../config.json";

const RedirectPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authCode = new URLSearchParams(location.search).get('code');
  const redirectUrl = config.isDev ? config.redirectLocal : config.redirectRemote;

  useEffect(() => {
    if (authCode) {
      setTimeout(() => {
        setTokensFromCode(authCode, redirectUrl);
      }, 800);
    } else {
      navigate("/home");
    }
  }, [authCode, redirectUrl, navigate]);

  return (
    <div className="loadingWrapper fadeInPure-animation" style={{ color: "white", fontSize: "35px", backgroundColor: "var(--purple-haze-bg)" }}>
      <div className="logo-text-wrapper">
        <div className="logo-text-1">List</div>
        <div className="logo-text-2">Pal</div>
      </div>
    </div>
  );
};

export default RedirectPage;

