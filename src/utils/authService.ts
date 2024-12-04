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
  // console.log(formBody);
  await axios.post('https://listpal-dev.auth.eu-west-2.amazoncognito.com/oauth2/token', formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then((res) => {
    sessionStorage.setItem("idToken", res.data.id_token || '');
    sessionStorage.setItem("accessToken", res.data.access_token || '');
    sessionStorage.setItem("refreshToken", res.data.refresh_token || '');
    // console.log(res);
  }).catch((err) => {
    console.log(err);
  });
};

export const signUp = async (given_name: string, family_name: string, email: string, password: string, setUserDetails) => {
  const params = {
    ClientId: config.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "given_name",
        Value: given_name,
      },
      {
        Name: "family_name",
        Value: family_name,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    const userID = "u#" + response.UserSub
    const user = {
      "Theme": "purple-haze"
    }
    newUser(userID, email, given_name);
    setUserDetails(user)
    localStorage.setItem('userDetails', JSON.stringify(user))
    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
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
      // console.log("TTTT refreshing tokens")
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
      navigate('/login');
    }
  } catch (error) {
    console.error("Error refreshing token: ", error);
    sessionStorage.clear();
    const navigate = useNavigate();
    navigate('/login');
    throw error;
  }
};

// export const signIn = async (email: string, password: string) => {
//   const params = {
//     AuthFlow: "USER_PASSWORD_AUTH",
//     ClientId: config.clientId,
//     AuthParameters: {
//       USERNAME: email,
//       PASSWORD: password,
//     },
//   };
//   try {
//     const command = new InitiateAuthCommand(params);
//     const { AuthenticationResult } = await cognitoClient.send(command);
//     if (AuthenticationResult) {
//       sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
//       sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
//       sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
//       return AuthenticationResult;
//     }
//   } catch (error) {
//     console.error("Error signing in: ", error);
//     throw error;
//   }
// };

// export const confirmSignUp = async (email: string, code: string) => {
//   const params = {
//     ClientId: config.clientId,
//     Username: email,
//     ConfirmationCode: code,
//   };
//   try {
//     const command = new ConfirmSignUpCommand(params);
//     await cognitoClient.send(command);
//     console.log("User confirmed successfully");
//     return true;
//   } catch (error) {
//     console.error("Error confirming sign up: ", error);
//     throw error;
//   }
// };
