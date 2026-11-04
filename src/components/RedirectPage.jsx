import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setTokensFromCode } from "../utils/authService";
import { describeApiError } from "../utils/apiErrors";
import config from "../config.json";
import "./Prompt.css";
import "./RedirectPage.css";

const RedirectPage = ({ isDev }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [failure, setFailure] = useState(null);
  const authCode = new URLSearchParams(location.search).get('code');
  const redirectUrl = isDev ? config.redirectLocal : config.redirectRemote;

  useEffect(() => {
    if (authCode) {
      setTokensFromCode(authCode, redirectUrl)
        .catch((error) => setFailure(describeApiError(error, "finish signing you in")));
    } else {
      navigate("/home");
    }
  }, [authCode, redirectUrl, navigate]);

  if (failure) {
    return (
      <div className="redirect-page fadeInPure-animation">
        <div className="prompt-inner-wrapper">
          <h1>{failure.title}</h1>
          <p>{failure.textValue}</p>
          <div className="prompt-buttons">
            {/* A code works only once, so retrying needs a fresh one from the sign-in page */}
            <button className="prompt-button" onClick={() => window.location.assign("/logout")}>
              Sign in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="redirect-page">
      <div className="redirect-page-status" role="status">Signing you in…</div>
    </div>
  );
};

export default RedirectPage;
