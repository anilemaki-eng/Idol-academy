// Video files kept on this device only (used by Dance > Compare for your
// own videos). They're stored in the browser's on-device database
// (IndexedDB) for this website. Nothing here is ever uploaded.
App.localVideos = (function () {
  const DB_NAME = 'idol-academy-files';
  const STORE = 'videos';
  let dbPromise = null;

  function open() {
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        if (!window.indexedDB) {
          reject(new Error('not available'));
          return;
        }
        const request = window.indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = function () {
          request.result.createObjectStore(STORE);
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error); };
      });
      dbPromise.catch(function () { dbPromise = null; });
    }
    return dbPromise;
  }

  // Runs one request on the store; resolves with its result
  function run(mode, makeRequest) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, mode);
        const request = makeRequest(tx.objectStore(STORE));
        tx.oncomplete = function () { resolve(request.result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  return {
    // Keeps a video file under a name (replacing any earlier one)
    save: function (name, file) {
      return run('readwrite', function (store) {
        return store.put({ blob: file, fileName: file.name || '' }, name);
      });
    },
    // Resolves to { blob, fileName }, or null if nothing is kept under that name
    load: function (name) {
      return run('readonly', function (store) { return store.get(name); })
        .then(function (record) { return record && record.blob ? record : null; });
    },
    remove: function (name) {
      return run('readwrite', function (store) { return store.delete(name); });
    }
  };
})();
