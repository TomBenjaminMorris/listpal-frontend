import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import axios from 'axios';
import config from "../config.json";

const client = new CognitoIdentityProviderClient({ region: config.region });
const AUTH_ENDPOINT = config.authEndpoint;
const CLIENT_ID = config.clientId;

function setTokensToStorage(tokens) {
  if ('id_token' in tokens) {
    sessionStorage.setItem("idToken", tokens.id_token || '');
    sessionStorage.setItem("accessToken", tokens.access_token || '');
    sessionStorage.setItem("refreshToken", tokens.refresh_token || '');
  } else {
    sessionStorage.setItem("idToken", tokens.IdToken || '');
    sessionStorage.setItem("accessToken", tokens.AccessToken || '');
    if (tokens.RefreshToken) {
      sessionStorage.setItem("refreshToken", tokens.RefreshToken);
    }
  }
}

async function setTokensFromCode(authorizationCode, redirectUri) {
  const details = {
    grant_type: "authorization_code",
    code: authorizationCode,
    client_id: CLIENT_ID,
    redirect_uri: redirectUri
  };

  const formBody = new URLSearchParams(details).toString();

  try {
    const { data } = await axios.post(
      AUTH_ENDPOINT,
      formBody,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    setTokensToStorage(data);
    window.location.replace("/home");
  } catch (error) {
    console.error('Auth code exchange failed:', error);
    throw error;
  }
}

async function refreshTokens(refreshToken) {
  const params = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: config.clientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await client.send(command);

    if (!AuthenticationResult) {
      throw new Error('No authentication result received');
    }

    setTokensToStorage(AuthenticationResult);
    return AuthenticationResult;
  } catch (error) {
    console.error("Token refresh failed:", error);
    sessionStorage.clear();
    return Promise.reject(error);
  }
}

function clearAuth() {
  sessionStorage.clear();
}

export { setTokensFromCode, refreshTokens, clearAuth };
