import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import config from "../config.json";
import { useNavigate } from 'react-router-dom';
import { newUser } from "./apiGatewayClient";
import axios from 'axios';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

export const setTokensFromCode = async (authorizationCode: string, redirectUri: string) => {
  const details = {
    grant_type: "authorization_code",
    code: authorizationCode,
    client_id: "4vi87ls8jg8pj6o2fbvmlj5l3g",
    redirect_uri: redirectUri
  };
  const formBody = Object.keys(details).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(details[key])}`).join("&");

  await axios.post('https://listpal-dev.auth.eu-west-2.amazoncognito.com/oauth2/token', formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then((res) => {
    sessionStorage.setItem("idToken", res.data.id_token || '');
    sessionStorage.setItem("accessToken", res.data.access_token || '');
    sessionStorage.setItem("refreshToken", res.data.refresh_token || '');
    window.location.replace("/home")
  }).catch((err) => {
    console.log(err);
  });
};

export const refreshTokens = async (refreshToken: string) => {
  const params = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: config.clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  };
  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      if (AuthenticationResult.RefreshToken) {
        sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      }
      return AuthenticationResult;
    }
    else {
      sessionStorage.clear();
      const navigate = useNavigate();
      navigate('/logout');
    }
  } catch (error) {
    console.error("Error refreshing token: ", error);
    sessionStorage.clear();
    const navigate = useNavigate();
    navigate('/logout');
    throw error;
  }
};
