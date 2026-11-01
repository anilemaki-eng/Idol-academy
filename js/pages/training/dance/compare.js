// Training > Dance > Compare
// #training-dance-compare             -> choose the practice video you've been learning
// #training-dance-compare-<video id>  -> compare yourself with that video:
//   1. choose a video of yourself from your phone
//   2. both videos are shown together; line each one up where the dance
//      starts, then Play both / Pause both / Restart both
//   - Slower / Faster change the speed of both videos together (0.50x-1.00x)
//   - Flip shows your video mirrored (for phones that save selfie videos
//     flipped); remembered under 'dance-compare-flip/<video id>'
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
          <div class="cmp-mine-head">
            <figcaption>You</figcaption>
            <button type="button" id="cmp-sound" aria-pressed="false">Sound: off</button>
            <button type="button" id="cmp-flip" aria-pressed="false">&#8644; Flip</button>
          </div>
          <video id="cmp-my-video" playsinline muted preload="metadata"></video>
          <div class="cmp-seek">
            <button type="button" id="cmp-back" aria-label="Your video: back 0.2 seconds">&#9664;</button>
            <input type="range" id="cmp-time" min="0" max="0" step="0.1" value="0"
              aria-label="Position in your video">
            <button type="button" id="cmp-fwd" aria-label="Your video: forward 0.2 seconds">&#9654;</button>
            <span class="cmp-time-label">0:00.0</span>
          </div>
        </figure>
      </div>

      <div class="cmp-controls" hidden>
        <div class="cmp-buttons">
          <button type="button" id="cmp-play">Play both</button>
          <button type="button" id="cmp-pause">Pause both</button>
          <button type="button" id="cmp-restart" disabled>Restart both</button>
        </div>
        <div class="cmp-speed">
          <button type="button" id="cmp-slower">&minus; Slower</button>
          <p class="cmp-speed-value">Speed <strong id="cmp-speed">1.00&times;</strong></p>
          <button type="button" id="cmp-faster">Faster +</button>
        </div>
        <p class="cmp-speed-note" hidden></p>
        <p class="cmp-help">Line both videos up where the dance starts (the practice video&rsquo;s
          time bar, and the slider under your video), then tap Play both. Your video&rsquo;s
          sound is off so the music doesn&rsquo;t play twice. The speed changes both videos.</p>
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
  const soundButton = q('#cmp-sound');
  const flipButton = q('#cmp-flip');
  const timeSlider = q('#cmp-time');
  const timeLabel = q('.cmp-time-label');
  const slowerButton = q('#cmp-slower');
  const fasterButton = q('#cmp-faster');
  const speedValue = q('#cmp-speed');
  const speedNote = q('.cmp-speed-note');
  const flipPath = 'dance-compare-flip/' + videoKey;
  const MIN_SPEED = 0.5;
  const MAX_SPEED = 1;
  const SPEED_STEP = 0.1;
  let desiredSpeed = MAX_SPEED; // the speed you chose
  let appliedRate = 1;          // the speed YouTube is playing (your video matches it)
  let flipped = false;
  let dragging = false;         // moving the slider right now
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
    soundButton.textContent = myVideo.muted ? 'Sound: off' : 'Sound: on';
    soundButton.setAttribute('aria-pressed', String(!myVideo.muted));
    flipButton.setAttribute('aria-pressed', String(flipped));
    myVideo.classList.toggle('flipped', flipped);
    if (ready) {
      const onlyNormal = availableRates().length === 1;
      speedValue.textContent = appliedRate.toFixed(2) + '\u00d7';
      slowerButton.disabled = onlyNormal || speedStep(-1) === null;
      fasterButton.disabled = onlyNormal || speedStep(1) === null;
      speedNote.textContent = onlyNormal
        ? 'YouTube only plays this video at normal speed here.'
        : Math.abs(appliedRate - desiredSpeed) > 1e-6
          ? "YouTube can't play this video at " + desiredSpeed.toFixed(2) +
            '\u00d7, so both use the closest speed it allows.'
          : '';
      speedNote.hidden = !speedNote.textContent;
    }
  }

  // ----- Speed (both videos together) -----

  function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function availableRates() {
    const rates = player.getAvailablePlaybackRates();
    return rates && rates.length ? rates : [1];
  }

  // The allowed speed closest to the one you want (the slower one on a tie)
  function closestRate(target) {
    return availableRates().reduce(function (best, rate) {
      return Math.abs(rate - target) < Math.abs(best - target) - 1e-9 ? rate : best;
    });
  }

  // Where one tap of Faster (+1) or Slower (-1) goes, or null if nowhere:
  // 0.10x steps between 0.50x and 1.00x, skipping speeds YouTube rounds away
  function speedStep(direction) {
    let target = desiredSpeed;
    for (;;) {
      let next = round(target + direction * SPEED_STEP, 2);
      if (direction > 0 && next > MAX_SPEED && target < MAX_SPEED) next = MAX_SPEED;
      if (direction < 0 && next < MIN_SPEED && target > MIN_SPEED) next = MIN_SPEED;
      if (next > MAX_SPEED + 1e-9 || next < MIN_SPEED - 1e-9) return null;
      target = next;
      if (closestRate(target) !== appliedRate) return target;
    }
  }

  function setSpeed(target) {
    desiredSpeed = round(target, 2);
    appliedRate = closestRate(desiredSpeed);
    player.setPlaybackRate(appliedRate);
    myVideo.playbackRate = appliedRate; // your video always matches the practice video
    updateUI();
  }

  slowerButton.addEventListener('click', function () {
    const target = speedStep(-1);
    if (target !== null) setSpeed(target);
  });
  fasterButton.addEventListener('click', function () {
    const target = speedStep(1);
    if (target !== null) setSpeed(target);
  });

  // ----- Your video's own controls -----

  // 65.4 -> '1:05.4'
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = (seconds - minutes * 60).toFixed(1);
    return minutes + ':' + (rest < 10 ? '0' : '') + rest;
  }

  function showTime() {
    const duration = isFinite(myVideo.duration) ? myVideo.duration : 0;
    timeSlider.max = String(duration);
    if (!dragging) timeSlider.value = String(myVideo.currentTime);
    timeLabel.textContent = formatTime(myVideo.currentTime) + ' / ' + formatTime(duration);
  }

  function moveMine(seconds) {
    const duration = isFinite(myVideo.duration) ? myVideo.duration : 0;
    myVideo.currentTime = Math.min(Math.max(0, seconds), duration);
    showTime();
  }

  myVideo.addEventListener('loadedmetadata', showTime);
  myVideo.addEventListener('timeupdate', showTime);
  myVideo.addEventListener('seeked', showTime);
  timeSlider.addEventListener('input', function () {
    dragging = true;
    moveMine(Number(timeSlider.value));
  });
  timeSlider.addEventListener('change', function () { dragging = false; });
  q('#cmp-back').addEventListener('click', function () { moveMine(myVideo.currentTime - 0.2); });
  q('#cmp-fwd').addEventListener('click', function () { moveMine(myVideo.currentTime + 0.2); });

  // Tap your video to play or pause it on its own
  myVideo.addEventListener('click', function () {
    if (myVideo.paused) {
      const playing = myVideo.play();
      if (playing && playing.catch) playing.catch(function () {});
    } else {
      myVideo.pause();
    }
  });

  soundButton.addEventListener('click', function () {
    myVideo.muted = !myVideo.muted;
    updateUI();
  });

  flipButton.addEventListener('click', function () {
    flipped = !flipped;
    App.storage.save(flipPath, flipped ? { flip: true } : null).catch(function () {});
    updateUI();
  });

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
    myVideo.playbackRate = appliedRate;
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

    // Flip setting from last time
    let gotFlip = false;
    cleanups.push(App.storage.watch(flipPath, function (data) {
      if (gotFlip) return;
      gotFlip = true;
      flipped = !!(data && data.flip);
      updateUI();
    }, function () {}));

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
        q('.cmp-videos').scrollIntoView({ block: 'start' });
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
              setSpeed(MAX_SPEED);
              lineUp();
            },
            onPlaybackRateChange: function (event) {
              // Changed with YouTube's own speed menu: your video follows
              appliedRate = event.data;
              if (Math.abs(closestRate(desiredSpeed) - appliedRate) > 1e-6) desiredSpeed = appliedRate;
              myVideo.playbackRate = appliedRate;
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
