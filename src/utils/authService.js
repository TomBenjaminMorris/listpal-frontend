import axios from 'axios';
import config from "../config.json";

const AUTH_ENDPOINT = config.authEndpoint;
const CLIENT_ID = config.clientId;

function setTokensToStorage(tokens) {
  sessionStorage.setItem("idToken", tokens.id_token || '');
  sessionStorage.setItem("accessToken", tokens.access_token || '');
  // A refresh response carries no refresh token unless rotation is enabled, so keep the one we have
  if (tokens.refresh_token) sessionStorage.setItem("refreshToken", tokens.refresh_token);
}

// Both grants POST form-encoded data to the Cognito token endpoint
const postToTokenEndpoint = (details) => axios.post(
  AUTH_ENDPOINT,
  new URLSearchParams(details).toString(),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);

async function setTokensFromCode(authorizationCode, redirectUri) {
  try {
    const { data } = await postToTokenEndpoint({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: CLIENT_ID,
      redirect_uri: redirectUri
    });

    setTokensToStorage(data);
    window.location.replace("/home");
  } catch (error) {
    console.error('Auth code exchange failed:', error);
    throw error;
  }
}

let refreshing = null;

// Calls that find the token expired at the same moment share one refresh
function refreshTokens(refreshToken) {
  if (!refreshing) {
    refreshing = requestRefresh(refreshToken).finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function requestRefresh(refreshToken) {
  try {
    const { data } = await postToTokenEndpoint({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken
    });

    if (!data?.access_token) {
      throw new Error('No authentication result received');
    }

    setTokensToStorage(data);
    return data;
  } catch (error) {
    console.error("Token refresh failed:", error);
    sessionStorage.clear();
    throw error;
  }
}

function clearAuth() {
  sessionStorage.clear();
}

export { setTokensFromCode, refreshTokens, clearAuth };
