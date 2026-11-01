// Training > Dance > Warming Up
// A warm-up routine shown one stretch at a time: a drawing, how to do it
// and how long to do it. Next / Previous move between stretches. The order
// goes from top to bottom: neck, shoulders, arms, back, hips, legs, then
// the floor. Drawings are in images/warm-up/ (provided for the app).
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

App.dance.warmUp = [
  {
    name: 'Neck side stretch',
    image: 'neck-side',
    steps: [
      'Stand tall and relax your shoulders.',
      'Put one hand on your head and gently tilt your ear toward your shoulder.',
      'Keep the other shoulder down.'
    ],
    time: 'Hold 20 seconds each side'
  },
  {
    name: 'Neck forward stretch',
    image: 'neck-forward',
    steps: [
      'Put both hands on the back of your head.',
      'Let the weight of your hands slowly bring your chin toward your chest.',
      'Don’t pull; just let your head hang.'
    ],
    time: 'Hold 20 seconds'
  },
  {
    name: 'Neck back stretch',
    image: 'neck-back',
    steps: [
      'Put your hands together with your thumbs under your chin.',
      'Gently push your chin up and look at the ceiling.',
      'Keep your shoulders down and breathe slowly.'
    ],
    time: 'Hold 15 seconds'
  },
  {
    name: 'Neck circles',
    image: 'neck-circles',
    steps: [
      'Stand tall with your arms relaxed.',
      'Slowly roll your head around in a big circle.',
      'Then change direction.'
    ],
    time: '5 slow circles each way'
  },
  {
    name: 'Shoulder rolls',
    image: 'shoulder-rolls',
    steps: [
      'Let your arms hang loosely by your sides.',
      'Lift your shoulders up to your ears, roll them back and let them drop.',
      'Then roll them forward.'
    ],
    time: '10 rolls back, 10 forward'
  },
  {
    name: 'Cross-body shoulder stretch',
    image: 'cross-body',
    steps: [
      'Bring one straight arm across your chest.',
      'Hook the other arm around it, just above the elbow, and pull it closer.',
      'Keep the stretching shoulder down, away from your ear.'
    ],
    time: 'Hold 20 seconds each side'
  },
  {
    name: 'Overhead reach',
    image: 'overhead-reach',
    steps: [
      'Stand with your feet wide apart.',
      'Reach both arms straight up and stretch as tall as you can.',
      'Keep your feet flat on the floor.'
    ],
    time: 'Hold 15 seconds'
  },
  {
    name: 'Side bend',
    image: 'side-bend',
    steps: [
      'Stand with your feet wide apart.',
      'Reach one arm up and over your head while the other hand slides down your leg.',
      'Bend sideways without twisting.'
    ],
    time: 'Hold 20 seconds each side'
  },
  {
    name: 'Flat-back hinge',
    image: 'flat-back',
    steps: [
      'Stand with your feet apart and reach your arms forward.',
      'Push your hips back and lower your chest until your back is flat like a table.',
      'Keep your neck long, in line with your back.'
    ],
    time: 'Hold 20 seconds'
  },
  {
    name: 'Wide forward fold',
    image: 'wide-fold',
    steps: [
      'Stand with your feet very wide apart.',
      'Fold forward from your hips and put your hands on the floor.',
      'Let your head hang; bend your knees a little if you need to.'
    ],
    time: 'Hold 30 seconds'
  },
  {
    name: 'Chest opener',
    image: 'chest-opener',
    steps: [
      'Stand with your feet apart and put your hands on your thighs.',
      'Push your chest forward and up, and look up.',
      'Squeeze your shoulder blades together.'
    ],
    time: 'Hold 15 seconds'
  },
  {
    name: 'Wide squat with shoulder dip',
    image: 'wide-squat',
    steps: [
      'Step your feet wide, turn your toes out and sink into a low squat.',
      'Put your hands on your knees and gently push them outward.',
      'Dip one shoulder toward the middle, then switch.'
    ],
    time: 'Hold 15 seconds each side'
  },
  {
    name: 'Standing lunge',
    image: 'standing-lunge',
    steps: [
      'Take a big step forward and bend your front knee over your ankle.',
      'Keep your back leg long and straight.',
      'Rest your hands on your front knee and sink your hips down.'
    ],
    time: 'Hold 20 seconds each side'
  },
  {
    name: 'Low lunge with hands down',
    image: 'low-lunge',
    steps: [
      'From the lunge, put both hands on the floor inside your front foot.',
      'Stretch your back leg long behind you and let your hips sink.',
      'Keep your front heel on the floor if you can.'
    ],
    time: 'Hold 30 seconds each side'
  },
  {
    name: 'Kneeling thigh stretch',
    image: 'kneeling-thigh',
    steps: [
      'Kneel on one knee with the other foot in front of you.',
      'Reach back with one hand and hold your back foot.',
      'Gently pull your heel toward you and keep your chest up.'
    ],
    time: 'Hold 20 seconds each side'
  },
  {
    name: 'Seated leg fold',
    image: 'seated-fold',
    steps: [
      'Sit with one leg straight out in front and the other bent.',
      'Fold forward over your straight leg and hold your foot or shin.',
      'Keep the straight knee pointing up.'
    ],
    time: 'Hold 30 seconds each side'
  }
];

App.dance.renderView['warming-up'] = function (container) {
  const moves = App.dance.warmUp;
  let index = 0;
  let done = false;

  container.innerHTML = `
    <p class="wu-intro">A gentle warm-up before you dance. Move slowly, breathe, and never
      stretch into pain.</p>
    <div class="wu-card">
      <p class="wu-count"></p>
      <div class="wu-picture"></div>
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
  const prevButton = q('#wu-prev');
  const nextButton = q('#wu-next');

  function show() {
    card.hidden = done;
    doneBox.hidden = !done;
    if (!done) {
      const move = moves[index];
      count.textContent = 'Stretch ' + (index + 1) + ' of ' + moves.length;
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
    } else if (index > 0) {
      index--;
    }
    show();
  });

  nextButton.addEventListener('click', function () {
    if (done) {
      done = false;
      index = 0;
    } else if (index < moves.length - 1) {
      index++;
    } else {
      done = true;
    }
    show();
    window.scrollTo(0, 0);
  });

  // Load all drawings ahead, so Next shows the next one straight away
  moves.forEach(function (move) {
    new Image().src = 'images/warm-up/' + move.image + '.webp';
  });

  show();
};
