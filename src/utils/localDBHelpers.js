function openDB(dbName, version = 1, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(`Error opening database: ${request.error}`);
    request.onupgradeneeded = () => upgradeCallback?.(request.result, request.transaction);
  });
}

export { openDB };
