// Training > Dance > Compare
// #training-dance-compare             -> choose the practice video you've been learning
// #training-dance-compare-<video id>  -> compare yourself with that video:
//   1. choose a video of yourself from your phone
//   2. both videos are shown together; line each one up where the dance
//      starts, then Play both / Pause both / Restart both
//
// PRIVACY: your own video is opened directly on this device (a local
// "object URL") and kept only in this browser's on-device storage
// (local-videos.js), so you don't have to choose it again. It is never
// uploaded or sent anywhere. "Remove my video" deletes the app's copy.
// Where both videos were lined up (start points) is saved under
// 'dance-compare/<video id>'.
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

App.dance.renderView['compare'] = function (container, videoKey) {
  return videoKey
    ? App.dance.renderCompare(container, videoKey)
    : App.dance.renderLearnPicker(container, 'compare', 'Choose the video you’ve been learning.');
};

App.dance.renderCompare = function (container, videoKey) {
  let video = null;        // the practice video { id, name, url }
  let player = null;       // YouTube's player
  let ready = false;       // YouTube player can be controlled
  let destroyed = false;
  let myUrl = null;        // local address of your own video (stays on this device)
  let startPoints = null;  // { pro, mine }: where both were when you last tapped Play both
  const cleanups = [];

  container.innerHTML = `
    <p class="cmp-note">Loading&hellip;</p>
    <div class="cmp-area" hidden>
      <h3 class="cmp-title"></h3>
      <p class="cmp-error" role="alert" hidden></p>

      <div class="cmp-pick">
        <p>Choose a video of yourself dancing the same choreography.</p>
        <label class="cmp-pick-button">
          <span class="cmp-pick-label">Choose my video</span>
          <input type="file" id="cmp-file" accept="video/*">
        </label>
        <p class="cmp-private">Your video stays on this phone. The app keeps a copy on this
          phone so you don&rsquo;t have to choose it again; it&rsquo;s never uploaded.</p>
        <p class="cmp-kept" hidden></p>
      </div>
      <p class="cmp-my-error" role="alert" hidden></p>

      <div class="cmp-videos">
        <figure class="cmp-video">
          <figcaption>Practice video</figcaption>
          <div class="cmp-pro"><div id="cmp-player"></div></div>
        </figure>
        <figure class="cmp-video cmp-mine" hidden>
          <figcaption>You</figcaption>
          <video id="cmp-my-video" controls playsinline muted preload="metadata"></video>
        </figure>
      </div>

      <div class="cmp-controls" hidden>
        <div class="cmp-buttons">
          <button type="button" id="cmp-play">Play both</button>
          <button type="button" id="cmp-pause">Pause both</button>
          <button type="button" id="cmp-restart" disabled>Restart both</button>
        </div>
        <p class="cmp-help">Line both videos up where the dance starts (use each video&rsquo;s
          own time bar), then tap Play both. Your video is muted so the music
          doesn&rsquo;t play twice; tap its speaker icon to hear it.</p>
        <p class="cmp-remove-row">
          <button type="button" id="cmp-remove">Remove my video from the app</button>
          <span class="cmp-remove-note">(It stays in your phone&rsquo;s gallery.)</span>
        </p>
      </div>
    </div>`;

  const q = function (selector) { return container.querySelector(selector); };
  const note = q('.cmp-note');
  const area = q('.cmp-area');
  const title = q('.cmp-title');
  const errorBox = q('.cmp-error');
  const pick = q('.cmp-pick');
  const fileInput = q('#cmp-file');
  const pickLabel = q('.cmp-pick-label');
  const myError = q('.cmp-my-error');
  const mine = q('.cmp-mine');
  const myVideo = q('#cmp-my-video');
  const controls = q('.cmp-controls');
  const playButton = q('#cmp-play');
  const pauseButton = q('#cmp-pause');
  const restartButton = q('#cmp-restart');
  const removeButton = q('#cmp-remove');
  const kept = q('.cmp-kept');
  const pointsPath = 'dance-compare/' + videoKey;
  let lineUpPending = false; // move both videos to the saved start points once they're ready

  // Shows a problem with the practice video, with a way to watch it on YouTube
  function showFatal(text) {
    errorBox.textContent = text + ' ';
    if (video) {
      const link = document.createElement('a');
      link.href = video.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open it on YouTube instead';
      errorBox.appendChild(link);
    }
    errorBox.hidden = false;
    q('.cmp-videos').firstElementChild.hidden = true;
    controls.hidden = true;
  }

  function updateUI() {
    const haveMine = !!myUrl;
    mine.hidden = !haveMine;
    pickLabel.textContent = haveMine ? 'Choose a different video' : 'Choose my video';
    controls.hidden = !haveMine || !ready;
    restartButton.disabled = !startPoints;
  }

  // ----- Your own video (local only) -----

  function forgetMyVideo() {
    if (myUrl) {
      myVideo.removeAttribute('src');
      myVideo.load();
      URL.revokeObjectURL(myUrl);
      myUrl = null;
    }
  }

  function showMine(blob) {
    myError.hidden = true;
    forgetMyVideo();
    myUrl = URL.createObjectURL(blob); // a local address; the file is not uploaded
    myVideo.src = myUrl;
    updateUI();
  }

  function saveStartPoints() {
    App.storage.save(pointsPath, startPoints).catch(function () {});
  }

  // Both videos ready: put them where you last lined them up
  function lineUp() {
    if (!lineUpPending || !startPoints || !ready || !myUrl || myVideo.readyState < 1) return;
    lineUpPending = false;
    player.seekTo(startPoints.pro, true);
    player.pauseVideo();
    myVideo.currentTime = startPoints.mine;
  }

  fileInput.addEventListener('change', function () {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    startPoints = null;
    saveStartPoints();
    showMine(file);
    // Show both videos and the buttons together
    q('.cmp-videos').scrollIntoView({ block: 'start' });
    // Keep a copy on this phone for next time
    kept.hidden = true;
    App.localVideos.save(videoKey, file).catch(function () {
      kept.textContent = "There isn't enough space to keep this video for next time, " +
        "so you'll need to choose it again then.";
      kept.hidden = false;
    });
  });

  removeButton.addEventListener('click', function () {
    App.localVideos.remove(videoKey).catch(function () {});
    forgetMyVideo();
    startPoints = null;
    saveStartPoints();
    kept.hidden = true;
    fileInput.value = '';
    updateUI();
  });

  myVideo.addEventListener('loadedmetadata', lineUp);

  myVideo.addEventListener('error', function () {
    if (!myUrl) return;
    forgetMyVideo();
    App.localVideos.remove(videoKey).catch(function () {});
    myError.textContent = "This video can't be played here. Try a different video, or one recorded with your phone's camera.";
    myError.hidden = false;
    updateUI();
  });

  // ----- Playing both together -----

  playButton.addEventListener('click', function () {
    startPoints = { pro: player.getCurrentTime(), mine: myVideo.currentTime };
    saveStartPoints();
    player.playVideo();
    const playing = myVideo.play();
    if (playing && playing.catch) playing.catch(function () {});
    updateUI();
  });

  pauseButton.addEventListener('click', function () {
    player.pauseVideo();
    myVideo.pause();
  });

  // Back to where both were when you last tapped Play both, and play again
  restartButton.addEventListener('click', function () {
    if (!startPoints) return;
    player.seekTo(startPoints.pro, true);
    myVideo.currentTime = startPoints.mine;
    player.playVideo();
    const playing = myVideo.play();
    if (playing && playing.catch) playing.catch(function () {});
  });

  // ----- Starting up -----

  function setUp() {
    note.hidden = true;
    area.hidden = false;
    title.textContent = video.name;
    updateUI();

    const youtubeId = App.youtube.videoId(video.url);
    if (!youtubeId) {
      showFatal("This link doesn't point to one YouTube video, so it can't play here.");
      return;
    }

    // Your video and start points from last time (kept on this phone)
    let gotPoints = false;
    cleanups.push(App.storage.watch(pointsPath, function (data) {
      if (gotPoints) return;
      gotPoints = true;
      if (data && typeof data.pro === 'number' && typeof data.mine === 'number') {
        startPoints = data;
      }
      App.localVideos.load(videoKey).then(function (record) {
        if (destroyed || !record || myUrl) return;
        lineUpPending = !!startPoints;
        showMine(record.blob);
      }).catch(function () {});
    }, function () {}));

    App.youtube.loadApi().then(
      function (YT) {
        if (destroyed) return;
        player = new YT.Player('cmp-player', {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: function () {
              if (destroyed) return;
              ready = true;
              updateUI();
              lineUp();
            },
            onError: function (event) {
              showFatal(App.youtube.errorMessage(event.data));
            }
          }
        });
      },
      function () {
        if (!destroyed) {
          showFatal("Couldn't load the YouTube player. Check your internet connection, then open the video again.");
        }
      }
    );
  }

  // Find the practice video in your saved list
  cleanups.push(App.storage.watch(
    'dance/videos',
    function (data) {
      if (video) return; // already set up
      const items = data && Array.isArray(data.items) ? data.items : [];
      video = items.find(function (item) { return item.id === videoKey; }) || null;
      if (!video) {
        note.innerHTML = "This video isn't in your Dance practice videos anymore. " +
          '<a href="#training-dance-compare">Choose another video</a>';
        return;
      }
      setUp();
    },
    function () { note.textContent = App.storage.notAvailableMessage; }
  ));

  // When you leave this page: stop the player and let go of your video
  return function leave() {
    destroyed = true;
    cleanups.forEach(function (stop) { stop(); });
    if (player && player.destroy) player.destroy();
    forgetMyVideo();
  };
};
