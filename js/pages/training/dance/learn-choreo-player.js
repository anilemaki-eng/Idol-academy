// Training > Dance > Learn Choreo: learning one video, in two steps.
//
// 1. Mark sections (first time, or when you choose "Mark sections again"):
//    the video plays at normal speed from the beginning. Section 1 starts at
//    0:00. Each tap on "New section starts here" ends the section that was
//    playing and starts the next one. When the video reaches its end, the
//    last section ends there and the sections are saved.
//
// 2. Learn: Section 1 repeats on its own, starting at 0.50x. Slower / Faster
//    change the speed by 0.10x while it repeats. "Next section" appears only
//    once the speed is back to 1.00x; the next section starts again at 0.50x.
//    Previous section goes back; sections you've already reached can be
//    revisited freely. "Fix sections" moves, splits or joins single sections.
//    Once every section has been reached at 1.00x, "Practice the whole dance"
//    repeats the whole choreography, with the same speed buttons.
//
// Saved under 'dance-choreo/<video id>' as
// { sections: [{ id, start, end }], current, furthest, speed, mirror, finished }
// (times in seconds; current = the section you were on, furthest = the
// furthest section you've reached, speed = your speed when you left,
// mirror = whether the video is shown flipped like a mirror,
// finished = every section has been learned up to 1.00x).
App.dance = App.dance || {};

App.dance.renderLearnPlayer = function (container, videoKey) {
  const LEARN_START_SPEED = 0.5;
  const MARK_SPEED = 1;
  const MIN_SPEED = 0.5;
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
  let furthest = 0;          // the furthest section you've reached
  let savedState = null;     // what was saved last time (to carry on where you stopped)
  let editOpen = false;      // the "Fix sections" panel is showing
  let mirrored = false;      // video shown flipped like a mirror
  let finished = false;      // reached 1.00x on the last section: whole-dance practice is open
  let whole = false;         // practising the whole dance instead of one section
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
      <div class="lc-title-row">
        <h3 class="lc-title"></h3>
        <button type="button" id="lc-mirror" aria-pressed="false">&#8644; Mirror</button>
      </div>
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
            <p class="lc-speed-value">Speed <strong id="lc-speed">0.50&times;</strong></p>
            <button type="button" id="lc-faster">Faster +</button>
          </div>
          <p class="lc-speed-note" hidden></p>
          <div class="lc-learn-buttons">
            <button type="button" id="lc-prev" hidden>&larr; Previous</button>
            <button type="button" id="lc-learn-play">Pause</button>
            <button type="button" id="lc-next" class="lc-main" hidden>Next &rarr;</button>
          </div>
          <p class="lc-next-hint"></p>
          <button type="button" id="lc-whole" class="lc-whole lc-main" hidden></button>
        </div>

        <p class="lc-help"></p>
        <p class="lc-message" aria-live="polite"></p>
        <p class="lc-redo-row">
          <button type="button" id="lc-edit" hidden>Fix sections</button>
          <button type="button" id="lc-redo"></button>
        </p>
        <div class="lc-edit" hidden>
          <h4>Fix sections</h4>
          <p class="lc-edit-help">Move where a section starts by 0.2 seconds, join a
            section with the one before it, or split the section you&rsquo;re on at
            the moment the video is showing.</p>
          <button type="button" id="lc-split">Split this section here</button>
          <ol class="lc-edit-list"></ol>
          <button type="button" id="lc-edit-done">Done</button>
        </div>
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
  const prevButton = q('#lc-prev');
  const editButton = q('#lc-edit');
  const editPanel = q('.lc-edit');
  const editList = q('.lc-edit-list');
  const splitButton = q('#lc-split');
  const editDoneButton = q('#lc-edit-done');
  const nextHint = q('.lc-next-hint');
  const wholeButton = q('#lc-whole');
  const message = q('.lc-message');
  const redoButton = q('#lc-redo');
  const mirrorButton = q('#lc-mirror');
  const videoBox = q('.lc-video');

  // Mirror: flips the video left to right, so it moves like your reflection
  function showMirror() {
    videoBox.classList.toggle('mirrored', mirrored);
    mirrorButton.setAttribute('aria-pressed', String(mirrored));
  }
  mirrorButton.addEventListener('click', function () {
    mirrored = !mirrored;
    showMirror();
    if (sections.length) saveState();
  });

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

  // 0.5 -> '0.50×'
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
    if (phase === 'learn' && !whole) saveState();
    updateUI();
  }

  // The speed one tap of Faster (direction +1) or Slower (-1) goes to, or
  // null if there's nowhere to go. Steps by 0.10x, between 0.50x and 1x; if
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
    editOpen = false;
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
    furthest = 0;
    finished = false;
    startLearning(0);
    say('Sections saved. Now learn them one by one.');
  }

  // ----- Step 2: learning sections -----

  function startLearning(index) {
    phase = 'learn';
    whole = false;
    current = index;
    furthest = Math.max(furthest, index);
    setSpeed(LEARN_START_SPEED); // also saves where you are
    jumpTo(sections[current].start);
    player.playVideo();
    updateUI();
  }

  // What repeats: the current section, or the whole dance
  function loopRange() {
    return whole
      ? { start: sections[0].start, end: sections[sections.length - 1].end }
      : sections[current];
  }

  function startWholeDance() {
    whole = true;
    editOpen = false;
    setSpeed(LEARN_START_SPEED);
    jumpTo(loopRange().start);
    player.playVideo();
    say('');
    updateUI();
  }

  // ----- Fixing single sections -----
  // Sections follow each other, so where one starts is where the one
  // before it ends.

  // Move where section i starts (i >= 1) by delta seconds
  function moveStart(i, delta) {
    const time = round(sections[i].start + delta, 1);
    if (time < sections[i - 1].start + 0.5 || time > sections[i].end - 0.5) {
      say('Sections must be at least half a second long.');
      return;
    }
    sections[i - 1].end = time;
    sections[i].start = time;
    say('');
    saveState();
    updateUI();
  }

  // Join section i (i >= 1) with the one before it
  function joinWithPrevious(i) {
    sections[i - 1].end = sections[i].end;
    sections.splice(i, 1);
    if (current >= i) current--;
    if (furthest >= i) furthest--;
    say('Sections ' + i + ' and ' + (i + 1) + ' are now one section.');
    saveState();
    updateUI();
  }

  // Split the section you're on at the moment the video is showing
  function splitCurrent() {
    const section = sections[current];
    const time = round(player.getCurrentTime(), 1);
    if (time < section.start + 0.5 || time > section.end - 0.5) {
      say('Pause the video inside Section ' + (current + 1) +
        ' (not right at its start or end), then tap Split.');
      return;
    }
    sections.splice(current + 1, 0, { id: newId(), start: time, end: section.end });
    section.end = time;
    if (furthest > current) furthest++;
    say('Section ' + (current + 1) + ' is now two sections, split at ' + formatTime(time) + '.');
    saveState();
    updateUI();
  }

  function drawEditList() {
    editList.innerHTML = '';
    sections.forEach(function (section, i) {
      if (i === 0) return; // Section 1 always starts at the beginning
      const row = document.createElement('li');
      row.className = 'lc-edit-row';
      const label = document.createElement('span');
      label.className = 'lc-edit-label';
      label.textContent = 'Section ' + (i + 1) + ' starts at ' + formatTime(section.start);
      const buttons = [
        ['\u2212 0.2s', 'Section ' + (i + 1) + ' starts earlier', function () { moveStart(i, -0.2); }],
        ['+ 0.2s', 'Section ' + (i + 1) + ' starts later', function () { moveStart(i, 0.2); }],
        ['Join', 'Join section ' + (i + 1) + ' with section ' + i, function () { joinWithPrevious(i); }]
      ].map(function (b) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = b[0];
        button.setAttribute('aria-label', b[1]);
        button.addEventListener('click', b[2]);
        return button;
      });
      row.append.apply(row, [label].concat(buttons));
      editList.appendChild(row);
    });
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

    const range = loopRange();
    if (isPlaying() && (time >= range.end || time < range.start - 0.5)) {
      jumpTo(range.start);
    }
  }

  // ----- Saving sections -----

  // Saves the sections and where you are (section, furthest section, speed)
  function saveState() {
    const data = sections.length
      ? { sections: sections, current: current, furthest: furthest, speed: desiredSpeed,
          mirror: mirrored, finished: finished }
      : null;
    App.storage.save(sectionsPath, data)
      .catch(function () { say(App.storage.saveFailedMessage); });
  }

  // ----- Drawing -----

  function updateUI() {
    const playLabel = isPlaying() ? 'Pause' : 'Play';
    markControls.hidden = phase !== 'mark';
    learnControls.hidden = phase !== 'learn';
    editButton.hidden = phase !== 'learn' || editOpen || whole;
    editPanel.hidden = phase !== 'learn' || !editOpen || whole;
    if (!editPanel.hidden) drawEditList();

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

      // Learned the last section at full speed: the whole dance opens up
      if (!whole && isLast && atFullSpeed && !finished) {
        finished = true;
        saveState();
      }

      if (whole) {
        const range = loopRange();
        status.textContent = 'Whole dance (' + formatTime(range.start) + '–' +
          formatTime(range.end) + ') · repeating';
        help.textContent = 'Practise the whole choreography. It repeats on its own. ' +
          'Go faster when you’re ready.';
      } else {
        status.textContent = 'Section ' + (current + 1) + ' of ' + sections.length +
          ' (' + formatTime(section.start) + '–' + formatTime(section.end) + ') · repeating';
        help.textContent = 'Step 2: learn the section. It repeats on its own. ' +
          'Go faster when you’re ready.';
      }
      wholeButton.hidden = !finished;
      wholeButton.textContent = whole
        ? '\u2190 Back to Section ' + (current + 1)
        : 'Practice the whole dance';
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

      // Next section only at full speed (or if you've already been further)
      const reachedBefore = current < furthest;
      prevButton.hidden = whole || current === 0;
      nextButton.hidden = whole || isLast || !(atFullSpeed || reachedBefore);
      if (whole) {
        nextHint.textContent = '';
      } else if (isLast) {
        nextHint.textContent = atFullSpeed
          ? 'You’ve learned every section! Now practise the whole dance.'
          : finished ? '' : 'This is the last section. Reach ' + formatSpeed(MAX_SPEED) + ' to finish it.';
      } else {
        nextHint.textContent = atFullSpeed || reachedBefore
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

  prevButton.addEventListener('click', function () {
    if (current > 0) {
      say('');
      startLearning(current - 1);
    }
  });

  editButton.addEventListener('click', function () {
    editOpen = true;
    say('');
    updateUI();
  });
  editDoneButton.addEventListener('click', function () {
    editOpen = false;
    say('');
    updateUI();
  });
  splitButton.addEventListener('click', splitCurrent);

  wholeButton.addEventListener('click', function () {
    if (whole) {
      say('');
      startLearning(current);
    } else {
      startWholeDance();
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
      // Carry on where you stopped last time
      const last = sections.length - 1;
      const saved = savedState || {};
      current = Math.min(Math.max(0, Math.floor(Number(saved.current) || 0)), last);
      furthest = Math.min(Math.max(current, Math.floor(Number(saved.furthest) || 0)), last);
      const speed = Number(saved.speed);
      phase = 'learn';
      setSpeed(speed >= MIN_SPEED && speed <= MAX_SPEED ? speed : LEARN_START_SPEED);
      jumpTo(sections[current].start);
      updateUI();
      say(current > 0 || speed > LEARN_START_SPEED
        ? 'Welcome back! Tap Play to carry on with Section ' + (current + 1) + '.'
        : 'Tap Play to start learning Section 1.');
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
        savedState = data;
        finished = !!(data && data.finished);
        mirrored = !!(data && data.mirror);
        showMirror();
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
                  jumpTo(loopRange().start);
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
