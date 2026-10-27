// Last tasks shown per board, so switching back renders at once while a fresh copy loads. Module scope
// keeps it across Board unmounting (Home and back); a reload or logout, which reloads, clears it.
const cache = new Map();

export const getCachedTasks = boardID => cache.get(boardID);
export const setCachedTasks = (boardID, sortedTasks) => cache.set(boardID, sortedTasks);
export const dropCachedTasks = boardID => cache.delete(boardID);
