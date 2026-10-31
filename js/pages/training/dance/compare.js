// Training > Dance > Compare
// #training-dance-compare             -> choose the practice video you've been learning
// #training-dance-compare-<video id>  -> compare yourself with that video:
//   1. choose a video of yourself from your phone
//   2. both videos are shown together; line each one up where the dance
//      starts, then Play both / Pause both / Restart both
//
// PRIVACY: your own video is opened directly on this device (a local
// "object URL"). It is never uploaded, saved by the app, or sent anywhere.
// When you leave the page, the app lets go of it.
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
        <p class="cmp-private">Your video stays on this phone. It isn&rsquo;t uploaded or saved anywhere.</p>
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

  fileInput.addEventListener('change', function () {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    myError.hidden = true;
    forgetMyVideo();
    startPoints = null;
    myUrl = URL.createObjectURL(file); // a local address; the file is not uploaded
    myVideo.src = myUrl;
    updateUI();
    // Show both videos and the buttons together
    q('.cmp-videos').scrollIntoView({ block: 'start' });
  });

  myVideo.addEventListener('error', function () {
    if (!myUrl) return;
    forgetMyVideo();
    myError.textContent = "This video can't be played here. Try a different video, or one recorded with your phone's camera.";
    myError.hidden = false;
    updateUI();
  });

  // ----- Playing both together -----

  playButton.addEventListener('click', function () {
    startPoints = { pro: player.getCurrentTime(), mine: myVideo.currentTime };
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
