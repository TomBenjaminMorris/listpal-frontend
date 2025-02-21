function openDB(dbName, version = 1, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(`Error opening database: ${event.target.error}`);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (upgradeCallback) {
        upgradeCallback(db, event.target.transaction);
      }
    };
  });
}

function createObjectStore(db, storeName, keyPath, autoIncrement = true) {
  if (!db.objectStoreNames.contains(storeName)) {
    const store = db.createObjectStore(storeName, { keyPath, autoIncrement });
    store.createIndex("by_key", keyPath, { unique: true });
  }
}

function writeDataToLocalDB(db, storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(data);
    request.onerror = (event) => reject(`Error writing data: ${event.target.error}`);
  });
}

function readDataFromLocalDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = (event) => {
      if (event.target.result) {
        resolve(event.target.result);
      } else {
        reject("Data not found.");
      }
    };
    request.onerror = (event) => reject(`Error reading data: ${event.target.error}`);
  });
}

function deleteDataFromLocalDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(`Data with key ${key} deleted`);
    request.onerror = (event) => reject(`Error deleting data: ${event.target.error}`);
  });
}

function clearLocalDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(`All data cleared from ${storeName}`);
    request.onerror = (event) => reject(`Error clearing data: ${event.target.error}`);
  });
}

function readAllFromLocalDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();

    const results = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        results.push(cursor.value); // Collect the record
        cursor.continue(); // Move to the next record
      } else {
        resolve(results); // Resolve with the collected results once done
      }
    };

    request.onerror = (event) => reject(`Error reading all data: ${event.target.error}`);
  });
}

function deleteTaskFromLocalDBWrapper(localDB, taskID) {
  // Check if the task has been created since the last sync and update accordingly
  let localTaskExists = false
  readDataFromLocalDB(localDB, 'tasks', taskID).then(localTask => {
      localTaskExists = true
      if (localTask.Action === "create") {
          deleteDataFromLocalDB(localDB, 'tasks', taskID);
      } else if (localTask.Action === "update") {
          writeDataToLocalDB(localDB, "tasks", { Action: "delete", SK: taskID })
          setLocalSyncRequired(true);
      }
  }).catch(() => { }).finally(() => {
      if (!localTaskExists) {
          writeDataToLocalDB(localDB, "tasks", { Action: "delete", SK: taskID })
          setLocalSyncRequired(true);
      }
  })
}

export { openDB, createObjectStore, writeDataToLocalDB, readDataFromLocalDB, deleteDataFromLocalDB, clearLocalDB, readAllFromLocalDB, deleteTaskFromLocalDBWrapper };
