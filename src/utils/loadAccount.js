import { getBoards, getUser, setUpAccount } from './apiGatewayClient';

// A new user has no data until their first load sets it up. If that fails, the next load tries again.
export async function loadAccount(boardsRead) {
  const [userData, boardsData] = await Promise.all([getUser(), boardsRead]);
  if (userData[0]) return { user: userData[0], boardsData };

  await setUpAccount();
  const [newUserData, newBoardsData] = await Promise.all([getUser(), getBoards()]);
  return { user: newUserData[0], boardsData: newBoardsData };
}
