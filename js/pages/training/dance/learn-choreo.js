// Training > Dance > Learn Choreo
// #training-dance-learn-choreo             -> choose one of your saved videos
// #training-dance-learn-choreo-<video id>  -> learn that video:
//   - it starts at 0.30x speed; Slower / Faster change it by 0.10x (up to 1x)
//   - while it plays, you mark where each section starts and ends
//   - Replay section plays the current section again and pauses at its end
//   - Next section moves on to the following section
// Sections are saved under 'dance-choreo/<video id>' as
// { sections: [{ id, start, end }] } (times in seconds).
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

App.dance.renderView['learn-choreo'] = function (container, videoKey) {
  return videoKey
    ? App.dance.renderLearnPlayer(container, videoKey)
    : App.dance.renderLearnPicker(container);
};

// ----- Choose a video -----

App.dance.renderLearnPicker = function (container) {
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
      note.textContent = 'Choose a video to learn.';
      items.forEach(function (item) {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'lc-pick';
        link.href = '#training-dance-learn-choreo-' + item.id;
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

// ----- Learn one video -----

App.dance.renderLearnPlayer = function (container, videoKey) {
  const START_SPEED = 0.3;
  const MAX_SPEED = 1;
  const SPEED_STEP = 0.1;
  const sectionsPath = 'dance-choreo/' + videoKey;

  let video = null;          // { id, name, url } from your saved list
  let player = null;         // YouTube's player
  let ready = false;         // true once the player can be controlled
  let destroyed = false;     // true once you've left this page
  let sections = [];         // sorted by start time
  let sectionsLoaded = false;
  let currentId = null;      // the section you're learning, or null for the whole video
  let stopAt = null;         // pause when the video reaches this time
  let lastTime = 0;          // video time at the previous check
  let seekTarget = null;     // time we just jumped to (waiting for the player to get there)
  let seekDeadline = 0;
  let markStart = null;      // start time marked, waiting for the end
  let desiredSpeed = START_SPEED; // the speed you chose
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
        <div class="lc-controls">
          <button type="button" id="lc-replay">Replay section</button>
          <button type="button" id="lc-play">Play</button>
          <button type="button" id="lc-next">Next section</button>
        </div>
        <div class="lc-speed">
          <button type="button" id="lc-slower">&minus; Slower</button>
          <p class="lc-speed-value">Speed <strong id="lc-speed">0.30&times;</strong></p>
          <button type="button" id="lc-faster">Faster +</button>
        </div>
        <p class="lc-speed-note" hidden></p>
        <div class="lc-mark">
          <button type="button" id="lc-mark-start">Mark section start</button>
          <button type="button" id="lc-mark-end">Mark section end</button>
        </div>
        <p class="lc-message" aria-live="polite"></p>
        <h4 class="lc-sections-title">Sections</h4>
        <p class="lc-sections-empty">No sections yet. While the video plays, tap
          &ldquo;Mark section start&rdquo; when a part begins and
          &ldquo;Mark section end&rdquo; when it ends.</p>
        <ol class="lc-sections"></ol>
      </div>
    </div>`;

  const q = function (selector) { return container.querySelector(selector); };
  const note = q('.lc-note');
  const area = q('.lc-area');
  const title = q('.lc-title');
  const errorBox = q('.lc-error');
  const ui = q('.lc-ui');
  const status = q('.lc-status');
  const replayButton = q('#lc-replay');
  const playButton = q('#lc-play');
  const nextButton = q('#lc-next');
  const slowerButton = q('#lc-slower');
  const fasterButton = q('#lc-faster');
  const speedValue = q('#lc-speed');
  const speedNote = q('.lc-speed-note');
  const markStartButton = q('#lc-mark-start');
  const markEndButton = q('#lc-mark-end');
  const message = q('.lc-message');
  const sectionsEmpty = q('.lc-sections-empty');
  const sectionList = q('.lc-sections');

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

  function currentIndex() {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === currentId) return i;
    }
    return -1;
  }

  function sectionName(index) {
    const s = sections[index];
    return 'Section ' + (index + 1) + ' (' + formatTime(s.start) + '–' + formatTime(s.end) + ')';
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
      if (direction < 0 && next < START_SPEED && target > START_SPEED) next = START_SPEED;
      if (next > MAX_SPEED + 1e-9 || next < START_SPEED - 1e-9) return null;
      target = next;
      if (closestRate(target) !== appliedRate) return target;
    }
  }

  function changeSpeed(direction) {
    const target = speedStep(direction);
    if (target !== null) setSpeed(target);
  }

  // ----- Playing sections -----

  function playSection(section) {
    currentId = section.id;
    stopAt = section.end;
    seekTarget = section.start;
    seekDeadline = Date.now() + 2000;
    player.seekTo(section.start, true);
    player.playVideo();
    say('');
    updateUI();
  }

  // Runs 10 times a second: pauses at the end of the section you're learning
  function check() {
    if (!ready) return;
    const time = player.getCurrentTime();

    // Just jumped to a section: wait until the player gets there
    if (seekTarget !== null) {
      if (Math.abs(time - seekTarget) < 1 || Date.now() > seekDeadline) {
        seekTarget = null;
        lastTime = time;
      }
      return;
    }

    if (stopAt !== null && isPlaying() && time >= stopAt) {
      // Reached the end by playing (not by jumping past it in the video)
      if (lastTime < stopAt && time - lastTime < 1.5) {
        player.pauseVideo();
        say('End of ' + sectionName(currentIndex()) +
          '. Tap Replay section to practise it again, or Next section to move on.');
      }
      stopAt = null;
    }
    lastTime = time;
  }

  // ----- Saving sections -----

  function saveSections() {
    App.storage.save(sectionsPath, sections.length ? { sections: sections } : null)
      .catch(function () { say(App.storage.saveFailedMessage); });
  }

  function sortSections(list) {
    return list.slice().sort(function (a, b) { return a.start - b.start || a.end - b.end; });
  }

  // ----- Drawing -----

  function updateUI() {
    const index = currentIndex();
    const canMark = ready && sectionsLoaded;

    playButton.textContent = isPlaying() ? 'Pause' : 'Play';
    playButton.disabled = !ready;
    replayButton.disabled = !ready || index < 0;
    nextButton.disabled = !ready || index >= sections.length - 1;
    markStartButton.disabled = !canMark;
    markEndButton.disabled = !canMark || markStart === null;

    status.textContent = index >= 0
      ? sectionName(index).replace('Section ' + (index + 1), 'Section ' + (index + 1) + ' of ' + sections.length)
      : 'Whole video';

    if (ready) {
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
    } else {
      slowerButton.disabled = true;
      fasterButton.disabled = true;
    }

    // Sections list: tap one to learn it
    sectionList.innerHTML = '';
    sections.forEach(function (section, i) {
      const row = document.createElement('li');
      row.className = 'lc-section';

      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'lc-section-play';
      choose.textContent = sectionName(i);
      choose.disabled = !ready;
      if (section.id === currentId) choose.setAttribute('aria-current', 'true');
      choose.addEventListener('click', function () { playSection(section); });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'lc-section-delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete ' + sectionName(i));
      remove.addEventListener('click', function () {
        if (section.id === currentId) {
          currentId = null;
          stopAt = null;
        }
        sections = sections.filter(function (s) { return s.id !== section.id; });
        saveSections();
        say('');
        updateUI();
      });

      row.append(choose, remove);
      sectionList.appendChild(row);
    });
    sectionsEmpty.hidden = sections.length > 0;
  }

  // ----- Buttons -----

  playButton.addEventListener('click', function () {
    if (isPlaying()) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  });

  replayButton.addEventListener('click', function () {
    const index = currentIndex();
    if (index >= 0) playSection(sections[index]);
  });

  nextButton.addEventListener('click', function () {
    const next = sections[currentIndex() + 1];
    if (next) playSection(next);
  });

  slowerButton.addEventListener('click', function () { changeSpeed(-1); });
  fasterButton.addEventListener('click', function () { changeSpeed(1); });

  markStartButton.addEventListener('click', function () {
    markStart = round(player.getCurrentTime(), 1);
    say('Section start marked at ' + formatTime(markStart) +
      '. Tap “Mark section end” when this part ends.');
    updateUI();
  });

  markEndButton.addEventListener('click', function () {
    const end = round(player.getCurrentTime(), 1);
    if (end <= markStart + 0.4) {
      say('The end has to come after the start (' + formatTime(markStart) +
        '). Let the video play a little longer, then tap “Mark section end”.');
      return;
    }
    const section = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      start: markStart,
      end: end
    };
    sections = sortSections(sections.concat(section));
    markStart = null;
    saveSections();
    updateUI();
    const index = sections.indexOf(section);
    say(sectionName(index) + ' saved. Tap it in the list below to learn it.');
  });

  // ----- Starting up -----

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
    updateUI();

    // Saved sections for this video
    cleanups.push(App.storage.watch(
      sectionsPath,
      function (data) {
        sections = sortSections(data && Array.isArray(data.sections) ? data.sections : []);
        sectionsLoaded = true;
        if (currentId && currentIndex() < 0) {
          currentId = null;
          stopAt = null;
        }
        updateUI();
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
              setSpeed(START_SPEED);
              pollTimer = setInterval(check, 100);
            },
            onStateChange: function (event) {
              // Some phones reset the speed when a video first starts
              if (event.data === YT.PlayerState.PLAYING && firstPlay) {
                firstPlay = false;
                if (player.getPlaybackRate() !== appliedRate) player.setPlaybackRate(appliedRate);
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
