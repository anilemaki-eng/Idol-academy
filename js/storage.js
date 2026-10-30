// Saved data.
// Everything is saved in this browser on this device (the browser's
// "local storage"). It stays when you close the app, but it isn't shared
// with other devices, and it's deleted if you clear the browser's data
// for this website.
// Each record has a name like 'schedule/2026-10-29'.
App.storage = (function () {
  const PREFIX = 'idol-academy:';
  const watchers = {}; // name -> list of onData functions

  function read(name) {
    const text = window.localStorage.getItem(PREFIX + name);
    return text ? JSON.parse(text) : null;
  }

  // Calls onData(data) now and whenever the record is changed in another
  // tab (data is null if nothing is saved). Calls onError(error) if saving
  // doesn't work in this browser (error.code is 'not_available').
  // Returns a function that stops watching.
  function watch(name, onData, onError) {
    let stopped = false;
    const list = watchers[name] || (watchers[name] = []);
    list.push(onData);

    // Answer right after the page has finished drawing, like online storage would
    setTimeout(function () {
      if (stopped) return;
      let data;
      try {
        data = read(name);
      } catch (e) {
        onError({ code: 'not_available' });
        return;
      }
      onData(data);
    }, 0);

    return function stop() {
      stopped = true;
      const i = list.indexOf(onData);
      if (i >= 0) list.splice(i, 1);
    };
  }

  // Saves data under a name (null deletes it).
  function save(name, data) {
    try {
      if (data === null) {
        window.localStorage.removeItem(PREFIX + name);
      } else {
        window.localStorage.setItem(PREFIX + name, JSON.stringify(data));
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject({ code: 'not_available' });
    }
  }

  // The app open in another tab changed something: update this tab too
  window.addEventListener('storage', function (event) {
    if (!event.key || event.key.indexOf(PREFIX) !== 0) return;
    const name = event.key.slice(PREFIX.length);
    let data = null;
    try {
      data = read(name);
    } catch (e) {
      return;
    }
    (watchers[name] || []).slice().forEach(function (onData) { onData(data); });
  });

  return { watch: watch, save: save };
})();

// Messages shown when saving doesn't work in this browser
App.storage.notAvailableMessage =
  "Saving doesn't work in this browser. If this is a private window, open Idol Academy in a normal window.";
App.storage.saveFailedMessage =
  "Couldn't save your change in this browser. If this is a private window, open Idol Academy in a normal window.";
