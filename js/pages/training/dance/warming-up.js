// Training > Dance > Warming Up
// A warm-up routine in two parts: "Get moving" (kind: 'move', light
// movement that warms the body up) and then the stretches. Shown one at a
// time: a drawing, how to do it and how long to do it. Next / Previous move between stretches.
// Start runs the routine by itself: a short "Get ready" countdown, the hold
// (seconds = per side; sides = 2 adds "Switch sides!" halfway), then the
// next stretch. A beep marks each change and the screen is kept awake. The order
// goes from top to bottom: neck, shoulders, arms, back, hips, legs, then
// the floor. Drawings are in images/warm-up/ (provided for the app).
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

App.dance.warmUp = [
  // ----- Part 1: Get moving -----
  {
    kind: 'move',
    name: 'Ankle rolls',
    image: 'ankle-rolls',
    steps: [
      'Stand tall and lift one heel, keeping your toes on the floor.',
      'Roll the ankle in slow circles, then change direction.',
      'Hold onto something if you need help with balance.'
    ],
    time: '15 seconds each foot',
    seconds: 15,
    sides: 2
  },
  {
    kind: 'move',
    name: 'Jog with heel kicks',
    image: 'jog-heel-kicks',
    steps: [
      'Jog lightly on the spot.',
      'Kick your heels up behind you toward your bottom.',
      'Swing your arms and stay light on your feet.'
    ],
    time: '45 seconds',
    seconds: 45,
    sides: 1
  },
  {
    kind: 'move',
    name: 'Jumping jacks',
    image: 'jumping-jacks',
    steps: [
      'Jump your feet out wide while your arms swing up over your head.',
      'Jump back with feet together and arms down.',
      'Land softly with bent knees.'
    ],
    time: '30 seconds',
    seconds: 30,
    sides: 1
  },
  {
    kind: 'move',
    name: 'Arm circles',
    image: 'arm-circles',
    steps: [
      'Stretch your arms out to the sides at shoulder height.',
      'Draw small circles, making them bigger and bigger.',
      'Halfway through, circle the other way.'
    ],
    time: '30 seconds (15 forward, 15 back)',
    seconds: 30,
    sides: 1
  },
  {
    kind: 'move',
    name: 'Torso twists',
    image: 'torso-twists',
    steps: [
      'Stand with your feet apart and fold your arms in front of your chest.',
      'Twist your upper body from side to side.',
      'Keep your hips facing forward.'
    ],
    time: '30 seconds',
    seconds: 30,
    sides: 1
  },
  {
    kind: 'move',
    name: 'Knee hugs',
    image: 'knee-hugs',
    steps: [
      'Lift one knee and hug it to your chest for a moment.',
      'Put it down and lift the other knee.',
      'Keep switching legs and stand tall.'
    ],
    time: '30 seconds',
    seconds: 30,
    sides: 1
  },
  {
    kind: 'move',
    name: 'Leg swings',
    image: 'leg-swings',
    steps: [
      'Stand on one leg (hold onto a wall if you need to).',
      'Swing the other leg forward and back, keeping it straight.',
      'Start small and let the swings get bigger.'
    ],
    time: '20 seconds each leg',
    seconds: 20,
    sides: 2
  },
  {
    kind: 'move',
    name: 'Side lunges',
    image: 'side-lunges',
    steps: [
      'Stand with your feet very wide and your hands together in front of you.',
      'Bend one knee and shift your weight over it, keeping the other leg straight.',
      'Move slowly from side to side.'
    ],
    time: '30 seconds',
    seconds: 30,
    sides: 1
  },

  // ----- Part 2: Stretch -----
  {
    name: 'Neck side stretch',
    image: 'neck-side',
    steps: [
      'Stand tall and relax your shoulders.',
      'Put one hand on your head and gently tilt your ear toward your shoulder.',
      'Keep the other shoulder down.'
    ],
    time: 'Hold 20 seconds each side',
    seconds: 20,
    sides: 2
  },
  {
    name: 'Neck forward stretch',
    image: 'neck-forward',
    steps: [
      'Put both hands on the back of your head.',
      'Let the weight of your hands slowly bring your chin toward your chest.',
      'Don’t pull; just let your head hang.'
    ],
    time: 'Hold 20 seconds',
    seconds: 20,
    sides: 1
  },
  {
    name: 'Neck back stretch',
    image: 'neck-back',
    steps: [
      'Put your hands together with your thumbs under your chin.',
      'Gently push your chin up and look at the ceiling.',
      'Keep your shoulders down and breathe slowly.'
    ],
    time: 'Hold 15 seconds',
    seconds: 15,
    sides: 1
  },
  {
    name: 'Neck circles',
    image: 'neck-circles',
    steps: [
      'Stand tall with your arms relaxed.',
      'Slowly roll your head around in a big circle.',
      'Then change direction.'
    ],
    time: '5 slow circles each way (about 30 seconds)',
    seconds: 30,
    sides: 1
  },
  {
    name: 'Shoulder rolls',
    image: 'shoulder-rolls',
    steps: [
      'Let your arms hang loosely by your sides.',
      'Lift your shoulders up to your ears, roll them back and let them drop.',
      'Then roll them forward.'
    ],
    time: '10 rolls back, 10 forward (about 30 seconds)',
    seconds: 30,
    sides: 1
  },
  {
    name: 'Cross-body shoulder stretch',
    image: 'cross-body',
    steps: [
      'Bring one straight arm across your chest.',
      'Hook the other arm around it, just above the elbow, and pull it closer.',
      'Keep the stretching shoulder down, away from your ear.'
    ],
    time: 'Hold 20 seconds each side',
    seconds: 20,
    sides: 2
  },
  {
    name: 'Overhead reach',
    image: 'overhead-reach',
    steps: [
      'Stand with your feet wide apart.',
      'Reach both arms straight up and stretch as tall as you can.',
      'Keep your feet flat on the floor.'
    ],
    time: 'Hold 15 seconds',
    seconds: 15,
    sides: 1
  },
  {
    name: 'Side bend',
    image: 'side-bend',
    steps: [
      'Stand with your feet wide apart.',
      'Reach one arm up and over your head while the other hand slides down your leg.',
      'Bend sideways without twisting.'
    ],
    time: 'Hold 20 seconds each side',
    seconds: 20,
    sides: 2
  },
  {
    name: 'Flat-back hinge',
    image: 'flat-back',
    steps: [
      'Stand with your feet apart and reach your arms forward.',
      'Push your hips back and lower your chest until your back is flat like a table.',
      'Keep your neck long, in line with your back.'
    ],
    time: 'Hold 20 seconds',
    seconds: 20,
    sides: 1
  },
  {
    name: 'Wide forward fold',
    image: 'wide-fold',
    steps: [
      'Stand with your feet very wide apart.',
      'Fold forward from your hips and put your hands on the floor.',
      'Let your head hang; bend your knees a little if you need to.'
    ],
    time: 'Hold 30 seconds',
    seconds: 30,
    sides: 1
  },
  {
    name: 'Chest opener',
    image: 'chest-opener',
    steps: [
      'Stand with your feet apart and put your hands on your thighs.',
      'Push your chest forward and up, and look up.',
      'Squeeze your shoulder blades together.'
    ],
    time: 'Hold 15 seconds',
    seconds: 15,
    sides: 1
  },
  {
    name: 'Wide squat with shoulder dip',
    image: 'wide-squat',
    steps: [
      'Step your feet wide, turn your toes out and sink into a low squat.',
      'Put your hands on your knees and gently push them outward.',
      'Dip one shoulder toward the middle, then switch.'
    ],
    time: 'Hold 15 seconds each side',
    seconds: 15,
    sides: 2
  },
  {
    name: 'Standing lunge',
    image: 'standing-lunge',
    steps: [
      'Take a big step forward and bend your front knee over your ankle.',
      'Keep your back leg long and straight.',
      'Rest your hands on your front knee and sink your hips down.'
    ],
    time: 'Hold 20 seconds each side',
    seconds: 20,
    sides: 2
  },
  {
    name: 'Low lunge with hands down',
    image: 'low-lunge',
    steps: [
      'From the lunge, put both hands on the floor inside your front foot.',
      'Stretch your back leg long behind you and let your hips sink.',
      'Keep your front heel on the floor if you can.'
    ],
    time: 'Hold 30 seconds each side',
    seconds: 30,
    sides: 2
  },
  {
    name: 'Kneeling thigh stretch',
    image: 'kneeling-thigh',
    steps: [
      'Kneel on one knee with the other foot in front of you.',
      'Reach back with one hand and hold your back foot.',
      'Gently pull your heel toward you and keep your chest up.'
    ],
    time: 'Hold 20 seconds each side',
    seconds: 20,
    sides: 2
  },
  {
    name: 'Seated leg fold',
    image: 'seated-fold',
    steps: [
      'Sit with one leg straight out in front and the other bent.',
      'Fold forward over your straight leg and hold your foot or shin.',
      'Keep the straight knee pointing up.'
    ],
    time: 'Hold 30 seconds each side',
    seconds: 30,
    sides: 2
  }
];

App.dance.renderView['warming-up'] = function (container) {
  const moves = App.dance.warmUp;
  const GET_READY = 5;   // seconds before each hold, and before switching sides
  let index = 0;
  let done = false;

  // Timer state. phase: 'idle' (not started), 'ready', 'hold', 'switch'
  let running = false;   // the routine is playing by itself
  let paused = false;
  let phase = 'idle';
  let side = 1;
  let endsAt = 0;        // when the current countdown ends (ms)
  let leftWhenPaused = 0;
  let tick = null;
  let wakeLock = null;
  let audio = null;

  const totalSeconds = moves.reduce(function (sum, m) {
    return sum + (m.seconds * m.sides) + GET_READY * m.sides;
  }, 0);

  container.innerHTML = `
    <p class="wu-intro">Your warm-up before you dance (about
      ${Math.round(totalSeconds / 60)} minutes): first get moving to warm up your body,
      then stretch. Breathe, and never stretch into pain.</p>
    <div class="wu-card">
      <p class="wu-count"></p>
      <div class="wu-picture"></div>
      <div class="wu-timer">
        <p class="wu-timer-label" aria-live="polite"></p>
        <p class="wu-timer-time"></p>
        <button type="button" id="wu-start" class="wu-main"></button>
      </div>
      <h3 class="wu-name"></h3>
      <ol class="wu-steps"></ol>
      <p class="wu-hold"></p>
    </div>
    <div class="wu-done" hidden>
      <h3>Warm-up done!</h3>
      <p>Your body is ready. Time to dance.</p>
    </div>
    <div class="wu-buttons">
      <button type="button" id="wu-prev">&larr; Previous</button>
      <button type="button" id="wu-next" class="wu-main">Next &rarr;</button>
    </div>`;

  const q = function (selector) { return container.querySelector(selector); };
  const card = q('.wu-card');
  const doneBox = q('.wu-done');
  const count = q('.wu-count');
  const picture = q('.wu-picture');
  const name = q('.wu-name');
  const steps = q('.wu-steps');
  const hold = q('.wu-hold');
  const timerLabel = q('.wu-timer-label');
  const timerTime = q('.wu-timer-time');
  const startButton = q('#wu-start');
  const prevButton = q('#wu-prev');
  const nextButton = q('#wu-next');

  // ----- Sound and screen -----

  // A short beep (high = start holding, low = switch / get ready)
  function beep(high) {
    try {
      if (!audio) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = high ? 880 : 520;
      gain.gain.setValueAtTime(0.2, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.35);
    } catch (e) { /* no sound on this phone: the timer still works */ }
    if (navigator.vibrate) navigator.vibrate(150);
  }

  function keepScreenOn(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) {
        navigator.wakeLock.request('screen').then(function (lock) {
          wakeLock = lock;
          lock.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () {});
      } else if (!on && wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    } catch (e) { /* not supported: fine */ }
  }

  // The phone lets go of "screen on" when you switch apps; ask again on return
  function onVisible() {
    if (document.visibilityState === 'visible' && running && !paused) keepScreenOn(true);
  }
  document.addEventListener('visibilitychange', onVisible);

  // ----- Timer -----

  function startCountdown(newPhase, seconds) {
    phase = newPhase;
    endsAt = Date.now() + seconds * 1000;
    if (newPhase === 'hold') beep(true);
    else if (newPhase === 'switch') beep(false);
  }

  function secondsLeft() {
    if (paused) return Math.ceil(leftWhenPaused / 1000);
    return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  }

  // Runs 4 times a second while the routine is playing
  function onTick() {
    if (!running || paused) return;
    if (Date.now() < endsAt) {
      showTimer();
      return;
    }
    const move = moves[index];
    if (phase === 'ready') {
      startCountdown('hold', move.seconds);
    } else if (phase === 'hold' && side < move.sides) {
      side++;
      startCountdown('switch', GET_READY);
    } else if (phase === 'switch') {
      startCountdown('hold', move.seconds);
    } else {
      // This stretch is finished: on to the next one
      goTo(index + 1);
      return;
    }
    showTimer();
  }

  function startStretch() {
    side = 1;
    startCountdown('ready', GET_READY);
    beep(false);
  }

  function stopRoutine() {
    running = false;
    paused = false;
    phase = 'idle';
    clearInterval(tick);
    tick = null;
    keepScreenOn(false);
  }

  function showTimer() {
    const move = moves[index];
    const twoSides = move.sides === 2;
    let label;
    if (!running) {
      label = twoSides ? 'Each side' : 'Time';
    } else if (phase === 'ready') {
      label = 'Get ready…';
    } else if (phase === 'switch') {
      label = 'Switch sides!';
    } else {
      const action = move.kind === 'move' ? 'Move' : 'Hold';
      label = twoSides ? action + ' · side ' + side + ' of 2' : action;
    }
    if (paused) label = 'Paused';
    timerLabel.textContent = label;
    const secs = running ? secondsLeft() : move.seconds;
    timerTime.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    timerTime.classList.toggle('wu-timer-active', running && !paused && phase === 'hold');
    startButton.textContent = !running ? 'Start' : paused ? 'Continue' : 'Pause';
  }

  startButton.addEventListener('click', function () {
    // The first tap also unlocks sound (phones only allow it after a tap)
    if (!audio) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audio = new Ctx();
      } catch (e) { audio = null; }
    }
    if (audio && audio.state === 'suspended') audio.resume();

    if (!running) {
      running = true;
      paused = false;
      startStretch();
      tick = setInterval(onTick, 250);
      keepScreenOn(true);
    } else if (!paused) {
      paused = true;
      leftWhenPaused = Math.max(0, endsAt - Date.now());
      keepScreenOn(false);
    } else {
      paused = false;
      endsAt = Date.now() + leftWhenPaused;
      keepScreenOn(true);
    }
    showTimer();
  });

  // ----- Moving between stretches -----

  function goTo(newIndex) {
    if (newIndex >= moves.length) {
      done = true;
      stopRoutine();
      beep(true);
    } else {
      done = false;
      index = Math.max(0, newIndex);
      if (running) {
        paused = false;
        startStretch();
      }
    }
    show();
    window.scrollTo(0, 0);
  }

  function show() {
    card.hidden = done;
    doneBox.hidden = !done;
    if (!done) {
      const move = moves[index];
      count.textContent = (move.kind === 'move' ? 'Get moving' : 'Stretch') + ' · ' +
        (index + 1) + ' of ' + moves.length;
      picture.innerHTML = '';
      const img = document.createElement('img');
      img.src = 'images/warm-up/' + move.image + '.webp';
      img.alt = move.name;
      img.className = 'wu-image';
      picture.appendChild(img);
      name.textContent = move.name;
      steps.innerHTML = '';
      move.steps.forEach(function (text) {
        const item = document.createElement('li');
        item.textContent = text;
        steps.appendChild(item);
      });
      hold.textContent = move.time;
      showTimer();
    }
    prevButton.hidden = !done && index === 0;
    prevButton.textContent = done ? '← Back' : '← Previous';
    nextButton.textContent = done
      ? 'Start again'
      : index === moves.length - 1 ? 'Finish' : 'Next →';
  }

  prevButton.addEventListener('click', function () {
    if (done) {
      done = false;
      index = moves.length - 1;
      show();
    } else {
      goTo(index - 1);
    }
  });

  nextButton.addEventListener('click', function () {
    if (done) {
      done = false;
      index = 0;
      show();
      window.scrollTo(0, 0);
    } else {
      goTo(index + 1);
    }
  });

  // Load all drawings ahead, so Next shows the next one straight away
  moves.forEach(function (move) {
    new Image().src = 'images/warm-up/' + move.image + '.webp';
  });

  show();

  // When you leave this page: stop the timer, sound and screen-on
  return function leave() {
    stopRoutine();
    document.removeEventListener('visibilitychange', onVisible);
    if (audio && audio.close) audio.close().catch(function () {});
  };
};
