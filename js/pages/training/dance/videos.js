// Training > Dance: practice videos (the area below the buttons).
// You add each video yourself: a name and its YouTube link.
// Tapping a video opens it on YouTube.
// Saved under 'dance/videos' as { items: [{ id, name, url }] }, in the order added.
App.dance = App.dance || {};

App.dance.renderVideos = function (container) {
  const savePath = 'dance/videos';
  let items = [];

  container.innerHTML = `
    <h3>Dance practice videos</h3>
    <p class="videos-error" role="alert" hidden></p>
    <p class="videos-note">Loading&hellip;</p>
    <ul class="videos-list"></ul>
    <form class="videos-form" novalidate hidden>
      <label class="videos-field">
        Video name
        <input type="text" id="video-name" maxlength="200" autocomplete="off">
      </label>
      <label class="videos-field">
        YouTube link
        <input type="url" id="video-url" maxlength="500" autocomplete="off" inputmode="url">
      </label>
      <p class="videos-form-error" role="alert" hidden></p>
      <button type="submit">Add video</button>
    </form>`;

  const note = container.querySelector('.videos-note');
  const errorBox = container.querySelector('.videos-error');
  const list = container.querySelector('.videos-list');
  const form = container.querySelector('.videos-form');
  const formError = container.querySelector('.videos-form-error');
  const nameInput = container.querySelector('#video-name');
  const urlInput = container.querySelector('#video-url');

  // Returns the link as a full https address if it's a YouTube link, otherwise null.
  // Accepts youtube.com, m.youtube.com, music.youtube.com and youtu.be links,
  // with or without "https://" in front.
  function youtubeLink(text) {
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text);
    } catch (e) {
      return null;
    }
    const host = url.hostname.toLowerCase();
    const isYouTube = host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com');
    if (!isYouTube) return null;
    url.protocol = 'https:';
    return url.href;
  }

  // Draw the list in the order the videos were added
  function showList() {
    list.innerHTML = '';
    items.forEach(function (item) {
      const row = document.createElement('li');
      row.className = 'video';

      // Tapping the name opens the video on YouTube
      const link = document.createElement('a');
      link.className = 'video-link';
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = item.name;

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'video-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.setAttribute('aria-label', 'Delete ' + item.name);
      deleteButton.addEventListener('click', function () {
        saveItems(items.filter(function (i) { return i.id !== item.id; }));
      });

      row.append(link, deleteButton);
      list.appendChild(row);
    });
    note.textContent = items.length ? '' : 'No videos added yet.';
    note.hidden = items.length > 0;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  // Update the screen right away, then save
  function saveItems(newItems) {
    items = newItems;
    showList();
    errorBox.hidden = true;
    App.storage.save(savePath, items.length ? { items: items } : null).catch(function () {
      showError(App.storage.saveFailedMessage);
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    const url = youtubeLink(urlInput.value.trim());

    if (!name) {
      formError.textContent = 'Type a name for the video.';
      formError.hidden = false;
      nameInput.focus();
      return;
    }
    if (!url) {
      formError.textContent = 'Paste a YouTube link, like https://www.youtube.com/watch?v=… or https://youtu.be/…';
      formError.hidden = false;
      urlInput.focus();
      return;
    }

    formError.hidden = true;
    saveItems(items.concat({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name,
      url: url
    }));
    form.reset();
  });

  // Load the saved list, and keep it up to date.
  // The Add form appears only once the list has loaded, so adding a video
  // can never replace videos that haven't loaded yet.
  return App.storage.watch(
    savePath,
    function (data) {
      items = data && Array.isArray(data.items) ? data.items : [];
      showList();
      form.hidden = false;
    },
    function (err) {
      note.hidden = true;
      form.hidden = true;
      showError(err && err.code === 'not_available'
        ? App.storage.notAvailableMessage
        : "Couldn't load your videos. Close and reopen the app to try again.");
    }
  );
};
