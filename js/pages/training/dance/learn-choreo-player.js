// Training > Dance > Learn Choreo: learning one video, in two steps.
//
// 1. Mark sections (first time, or when you choose "Mark sections again"):
//    the video plays at normal speed from the beginning. Section 1 starts at
//    0:00. Each tap on "New section starts here" ends the section that was
//    playing and starts the next one. When the video reaches its end, the
//    last section ends there and the sections are saved.
//
// 2. Learn: Section 1 repeats on its own, starting at 0.30x. Slower / Faster
//    change the speed by 0.10x while it repeats. "Next section" appears only
//    once the speed is back to 1.00x; the next section starts again at 0.30x.
//
// Sections are saved under 'dance-choreo/<video id>' as
// { sections: [{ id, start, end }] } (times in seconds).
App.dance = App.dance || {};

App.dance.renderLearnPlayer = function (container, videoKey) {
  const LEARN_START_SPEED = 0.3;
  const MARK_SPEED = 1;
  const MIN_SPEED = 0.3;
  const MAX_SPEED = 1;
  const SPEED_STEP = 0.1;
  const sectionsPath = 'dance-choreo/' + videoKey;

  let video = null;          // { id, name, url } from your saved list
  let player = null;         // YouTube's player
  let ready = false;         // true once the player can be controlled
  let destroyed = false;     // true once you've left this page
  let sections = [];         // saved sections, in order
  let sectionsLoaded = false;
  let phase = null;          // 'mark' or 'learn'
  let marks = [];            // while marking: the start time of each section
  let current = 0;           // while learning: which section (0 = Section 1)
  let seekTarget = null;     // time we just jumped to (waiting for the player to get there)
  let seekDeadline = 0;
  let desiredSpeed = MARK_SPEED; // the speed you chose
  let appliedRate = null;    // the speed YouTube is actually playing
  let firstPlay = true;
  let pollTimer = null;
  const cleanups = [];

  container.innerHTML = `
    <p class="lc-note">Loading&hellip;</p>
    <div class="lc-area" hidden>
      <h3 class="lc-title"></h3>
      <p class="lc-error" role="alert" hidden></p>
      <div class="lc-ui">
        <div class="lc-video"><div id="lc-player"></div></div>
        <p class="lc-status"></p>

        <div class="lc-mark-controls" hidden>
          <button type="button" id="lc-mark-play">Play</button>
          <button type="button" id="lc-mark-next" class="lc-main">New section starts here</button>
        </div>

        <div class="lc-learn-controls" hidden>
          <div class="lc-speed">
            <button type="button" id="lc-slower">&minus; Slower</button>
            <p class="lc-speed-value">Speed <strong id="lc-speed">0.30&times;</strong></p>
            <button type="button" id="lc-faster">Faster +</button>
          </div>
          <p class="lc-speed-note" hidden></p>
          <div class="lc-learn-buttons">
            <button type="button" id="lc-learn-play">Pause</button>
            <button type="button" id="lc-next" class="lc-main" hidden>Next section</button>
          </div>
          <p class="lc-next-hint"></p>
        </div>

        <p class="lc-help"></p>
        <p class="lc-message" aria-live="polite"></p>
        <p class="lc-redo-row"><button type="button" id="lc-redo"></button></p>
      </div>
    </div>`;

  const q = function (selector) { return container.querySelector(selector); };
  const note = q('.lc-note');
  const area = q('.lc-area');
  const title = q('.lc-title');
  const errorBox = q('.lc-error');
  const ui = q('.lc-ui');
  const status = q('.lc-status');
  const help = q('.lc-help');
  const markControls = q('.lc-mark-controls');
  const markPlayButton = q('#lc-mark-play');
  const markNextButton = q('#lc-mark-next');
  const learnControls = q('.lc-learn-controls');
  const slowerButton = q('#lc-slower');
  const fasterButton = q('#lc-faster');
  const speedValue = q('#lc-speed');
  const speedNote = q('.lc-speed-note');
  const learnPlayButton = q('#lc-learn-play');
  const nextButton = q('#lc-next');
  const nextHint = q('.lc-next-hint');
  const message = q('.lc-message');
  const redoButton = q('#lc-redo');

  // ----- Small helpers -----

  function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // 65.4 -> '1:05.4'
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = (seconds - minutes * 60).toFixed(1);
    return minutes + ':' + (rest < 10 ? '0' : '') + rest;
  }

  // 0.3 -> '0.30×'
  function formatSpeed(rate) {
    return rate.toFixed(2) + '×';
  }

  function say(text) {
    message.textContent = text;
  }

  function isPlaying() {
    return ready && player.getPlayerState() === window.YT.PlayerState.PLAYING;
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Jump to a time; the checks wait until the player has got there
  function jumpTo(time) {
    seekTarget = time;
    seekDeadline = Date.now() + 2000;
    player.seekTo(time, true);
  }

  // Shows a problem that stops the video from playing, with a way to
  // watch it on YouTube instead
  function showFatal(text) {
    ui.hidden = true;
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
  }

  // ----- Speed -----

  // Speeds YouTube allows for this video, slowest first
  function availableRates() {
    const rates = player.getAvailablePlaybackRates();
    return rates && rates.length ? rates : [1];
  }

  // The allowed speed closest to the one you want (if two are equally
  // close, the slower one)
  function closestRate(target) {
    return availableRates().reduce(function (best, rate) {
      return Math.abs(rate - target) < Math.abs(best - target) - 1e-9 ? rate : best;
    });
  }

  function setSpeed(target) {
    desiredSpeed = round(target, 2);
    appliedRate = closestRate(desiredSpeed);
    player.setPlaybackRate(appliedRate);
    updateUI();
  }

  // The speed one tap of Faster (direction +1) or Slower (-1) goes to, or
  // null if there's nowhere to go. Steps by 0.10x, between 0.30x and 1x; if
  // YouTube doesn't allow that speed, keeps stepping until the speed it
  // plays really changes.
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

  // ----- Step 1: marking sections -----

  function startMarking() {
    phase = 'mark';
    marks = [0];
    say('');
    setSpeed(MARK_SPEED);
    jumpTo(0);
    player.pauseVideo();
    updateUI();
  }

  // "New section starts here": ends the section that was playing and
  // starts the next one at this moment
  function markNewSection() {
    const time = round(player.getCurrentTime(), 1);
    const lastStart = marks[marks.length - 1];
    if (time < lastStart + 0.5) {
      say('Section ' + marks.length + ' started at ' + formatTime(lastStart) +
        '. Let the video play a little longer before starting a new section.');
      return;
    }
    marks.push(time);
    say('Section ' + (marks.length - 1) + ' ended at ' + formatTime(time) +
      '. Section ' + marks.length + ' starts now.');
    updateUI();
  }

  // The video reached its end: the last section ends there, and learning starts
  function finishMarking() {
    const end = round(player.getDuration(), 1);
    sections = marks.map(function (start, i) {
      return { id: newId(), start: start, end: i < marks.length - 1 ? marks[i + 1] : end };
    }).filter(function (s) { return s.end > s.start; });
    marks = [];
    saveSections();
    startLearning(0);
    say('Sections saved. Now learn them one by one.');
  }

  // ----- Step 2: learning sections -----

  function startLearning(index) {
    phase = 'learn';
    current = index;
    setSpeed(LEARN_START_SPEED);
    jumpTo(sections[current].start);
    player.playVideo();
    updateUI();
  }

  // Runs 10 times a second: while learning, the section repeats on its own
  function check() {
    if (!ready || phase !== 'learn') return;
    const time = player.getCurrentTime();

    // Just jumped: wait until the player gets there
    if (seekTarget !== null) {
      if (Math.abs(time - seekTarget) < 1 || Date.now() > seekDeadline) seekTarget = null;
      return;
    }

    const section = sections[current];
    if (isPlaying() && (time >= section.end || time < section.start - 0.5)) {
      jumpTo(section.start);
    }
  }

  // ----- Saving sections -----

  function saveSections() {
    App.storage.save(sectionsPath, sections.length ? { sections: sections } : null)
      .catch(function () { say(App.storage.saveFailedMessage); });
  }

  // ----- Drawing -----

  function updateUI() {
    const playLabel = isPlaying() ? 'Pause' : 'Play';
    markControls.hidden = phase !== 'mark';
    learnControls.hidden = phase !== 'learn';

    if (phase === 'mark') {
      status.textContent = 'Marking sections · Section ' + marks.length +
        ' started at ' + formatTime(marks[marks.length - 1]);
      help.textContent = 'Step 1: mark the sections. Play the video. Each time a new part of the ' +
        'dance begins, tap “New section starts here”. When the video ends, ' +
        'your sections are saved and learning starts.';
      markPlayButton.textContent = playLabel;
      markPlayButton.disabled = !ready;
      markNextButton.disabled = !ready || !isPlaying();
      redoButton.textContent = 'Start marking over';
      redoButton.disabled = !ready || marks.length < 2;
    } else if (phase === 'learn') {
      const section = sections[current];
      const isLast = current >= sections.length - 1;
      const atFullSpeed = Math.abs(appliedRate - MAX_SPEED) < 1e-6;

      status.textContent = 'Section ' + (current + 1) + ' of ' + sections.length +
        ' (' + formatTime(section.start) + '–' + formatTime(section.end) + ') · repeating';
      help.textContent = 'Step 2: learn the section. It repeats on its own. ' +
        'Go faster when you’re ready.';
      learnPlayButton.textContent = playLabel;
      learnPlayButton.disabled = !ready;

      const onlyNormal = availableRates().length === 1;
      speedValue.textContent = formatSpeed(appliedRate);
      slowerButton.disabled = onlyNormal || speedStep(-1) === null;
      fasterButton.disabled = onlyNormal || speedStep(1) === null;
      if (onlyNormal) {
        speedNote.textContent = 'YouTube only plays this video at normal speed here.';
      } else if (Math.abs(appliedRate - desiredSpeed) > 1e-6) {
        speedNote.textContent = "YouTube can't play this video at " + formatSpeed(desiredSpeed) +
          ', so it uses the closest speed it allows.';
      } else {
        speedNote.textContent = '';
      }
      speedNote.hidden = !speedNote.textContent;

      // Next section only at full speed
      nextButton.hidden = isLast || !atFullSpeed;
      if (isLast) {
        nextHint.textContent = atFullSpeed
          ? 'This is the last section, and you’re at full speed.'
          : 'This is the last section. Reach ' + formatSpeed(MAX_SPEED) + ' to finish it.';
      } else {
        nextHint.textContent = atFullSpeed
          ? ''
          : 'Reach ' + formatSpeed(MAX_SPEED) + ' to unlock the next section.';
      }
      nextHint.hidden = !nextHint.textContent;
      redoButton.textContent = 'Mark sections again';
      redoButton.disabled = !ready;
    }
  }

  // ----- Buttons -----

  function togglePlay() {
    if (isPlaying()) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  markPlayButton.addEventListener('click', togglePlay);
  learnPlayButton.addEventListener('click', togglePlay);
  markNextButton.addEventListener('click', markNewSection);

  slowerButton.addEventListener('click', function () {
    const target = speedStep(-1);
    if (target !== null) setSpeed(target);
  });
  fasterButton.addEventListener('click', function () {
    const target = speedStep(1);
    if (target !== null) setSpeed(target);
  });

  nextButton.addEventListener('click', function () {
    if (current < sections.length - 1) {
      say('');
      startLearning(current + 1);
    }
  });

  redoButton.addEventListener('click', function () {
    startMarking();
  });

  // ----- Starting up -----

  // Once both the player and your saved sections are ready: learn if the
  // video already has sections, otherwise mark them first
  function begin() {
    if (!ready || !sectionsLoaded || phase !== null) return;
    if (sections.length) {
      phase = 'learn';
      current = 0;
      setSpeed(LEARN_START_SPEED);
      jumpTo(sections[0].start);
      updateUI();
      say('Tap Play to start learning Section 1.');
    } else {
      startMarking();
    }
  }

  function setUp() {
    note.hidden = true;
    area.hidden = false;
    title.textContent = video.name;

    // Scroll so the video and its buttons fill the screen
    const back = container.parentNode.querySelector('.dance-back');
    if (back) back.scrollIntoView({ block: 'start' });

    const youtubeId = App.youtube.videoId(video.url);
    if (!youtubeId) {
      showFatal("This link doesn't point to one YouTube video, so it can't play here.");
      return;
    }
    help.textContent = 'Loading the video…';
    redoButton.hidden = true;

    // Saved sections for this video (read once, when the page opens)
    let gotSections = false;
    cleanups.push(App.storage.watch(
      sectionsPath,
      function (data) {
        if (gotSections) return;
        gotSections = true;
        sections = data && Array.isArray(data.sections)
          ? data.sections.slice().sort(function (a, b) { return a.start - b.start; })
          : [];
        sectionsLoaded = true;
        begin();
      },
      function () { say(App.storage.notAvailableMessage); }
    ));

    // YouTube's player
    App.youtube.loadApi().then(
      function (YT) {
        if (destroyed) return;
        player = new YT.Player('lc-player', {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: function () {
              if (destroyed) return;
              ready = true;
              redoButton.hidden = false;
              pollTimer = setInterval(check, 100);
              begin();
            },
            onStateChange: function (event) {
              // Some phones reset the speed when a video first starts
              if (event.data === YT.PlayerState.PLAYING && firstPlay) {
                firstPlay = false;
                if (player.getPlaybackRate() !== appliedRate) player.setPlaybackRate(appliedRate);
              }
              if (event.data === YT.PlayerState.ENDED) {
                if (phase === 'mark') {
                  finishMarking();
                  return;
                }
                if (phase === 'learn') {
                  // The last section reached the end of the video: repeat it
                  jumpTo(sections[current].start);
                  player.playVideo();
                }
              }
              updateUI();
            },
            onPlaybackRateChange: function (event) {
              // Changed with YouTube's own speed menu: follow it
              if (event.data !== appliedRate) {
                appliedRate = event.data;
                desiredSpeed = event.data;
              }
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

  // Find the video in your saved list
  cleanups.push(App.storage.watch(
    'dance/videos',
    function (data) {
      if (video) return; // already set up
      const items = data && Array.isArray(data.items) ? data.items : [];
      video = items.find(function (item) { return item.id === videoKey; }) || null;
      if (!video) {
        note.innerHTML = "This video isn't in your Dance practice videos anymore. " +
          '<a href="#training-dance-learn-choreo">Choose another video</a>';
        return;
      }
      setUp();
    },
    function () { note.textContent = App.storage.notAvailableMessage; }
  ));

  // When you leave this page: stop the checks, the saved-data watchers and the player
  return function leave() {
    destroyed = true;
    clearInterval(pollTimer);
    cleanups.forEach(function (stop) { stop(); });
    if (player && player.destroy) player.destroy();
  };
};
