// Training > Dance > Learn Choreo
// #training-dance-learn-choreo             -> choose one of your saved videos (below)
// #training-dance-learn-choreo-<video id>  -> learn that video (learn-choreo-player.js)
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

App.dance.renderView['learn-choreo'] = function (container, videoKey) {
  return videoKey
    ? App.dance.renderLearnPlayer(container, videoKey)
    : App.dance.renderLearnPicker(container);
};

// ----- Choose a video -----
// Also used by Compare: viewId is the view the chosen video opens in
// ('learn-choreo' or 'compare'), prompt the line shown above the list.

App.dance.renderLearnPicker = function (container, viewId, prompt) {
  viewId = viewId || 'learn-choreo';
  prompt = prompt || 'Choose a video to learn.';
  container.innerHTML = `
    <p class="lc-note">Loading&hellip;</p>
    <ul class="lc-picker"></ul>`;
  const note = container.querySelector('.lc-note');
  const list = container.querySelector('.lc-picker');

  return App.storage.watch(
    'dance/videos',
    function (data) {
      const items = data && Array.isArray(data.items) ? data.items : [];
      list.innerHTML = '';
      if (!items.length) {
        note.innerHTML = 'No videos yet. Add a YouTube link under ' +
          '<a href="#training-dance">Dance practice videos</a> first.';
        return;
      }
      note.textContent = prompt;
      items.forEach(function (item) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'lc-pick';
        link.href = '#training-dance-' + viewId + '-' + item.id;
        link.textContent = item.name;
        row.appendChild(link);
        list.appendChild(row);
      });
    },
    function () {
      note.textContent = App.storage.notAvailableMessage;
    }
  );
};

