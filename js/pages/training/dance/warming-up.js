// Training > Dance > Warming Up
// An original warm-up routine: one stretch at a time, each with a simple
// drawing, how to do it and how long to hold it. Next / Previous move
// between stretches. The routine goes from top to bottom: neck, shoulders,
// arms, back, hips, legs, then floor stretches.
App.dance = App.dance || {};
App.dance.renderView = App.dance.renderView || {};

// Each drawing is a stick figure: joint positions in a 200 x 200 box
// (floor at y = 185). h = head, n = neck, p = hips; e/a = elbow/hand,
// k/f = knee/foot; the "1" limbs are drawn darker (closer to you), the "2"
// limbs lighter (further away). face = which way the nose points, in
// degrees (0 = right, 90 = down, -90 = up), or omitted for facing you.
App.dance.warmUp = [
  {
    name: 'Neck side stretch',
    steps: [
      'Stand tall with your feet hip-width apart.',
      'Put one hand on top of your head and gently tilt your ear toward your shoulder.',
      'Keep the other shoulder relaxed and down.'
    ],
    hold: '20 seconds each side',
    pose: { h: [113, 40], n: [100, 56], p: [100, 112],
      e1: [126, 26], a1: [112, 26], e2: [86, 84], a2: [84, 110],
      k1: [90, 150], f1: [86, 185], k2: [110, 150], f2: [114, 185] }
  },
  {
    name: 'Neck forward stretch',
    steps: [
      'Stand tall and put both hands behind your head.',
      'Let the weight of your hands slowly bring your chin toward your chest.',
      'Don’t pull hard; just let your head hang.'
    ],
    hold: '20 seconds',
    pose: { h: [100, 52], n: [100, 66], p: [100, 118], face: 90,
      e1: [132, 44], a1: [108, 38], e2: [68, 44], a2: [92, 38],
      k1: [90, 152], f1: [86, 185], k2: [110, 152], f2: [114, 185] }
  },
  {
    name: 'Neck back stretch',
    steps: [
      'Stand tall and place your fingertips under your chin.',
      'Gently push your chin up and look at the ceiling.',
      'Keep your shoulders down and breathe slowly.'
    ],
    hold: '15 seconds',
    pose: { h: [94, 40], n: [100, 58], p: [100, 112], face: -70,
      e1: [118, 76], a1: [104, 48], e2: [114, 80], a2: [102, 50],
      k1: [101, 150], f1: [104, 185], k2: [99, 150], f2: [96, 185] }
  },
  {
    name: 'Look over your shoulder',
    steps: [
      'Stand with your feet a little wider than your hips, hands on your hips.',
      'Keep your hips facing forward and slowly turn your head to look over one shoulder.',
      'Come back to the middle, then turn to the other side.'
    ],
    hold: '15 seconds each side',
    pose: { h: [100, 38], n: [100, 56], p: [100, 112], face: 180,
      e1: [126, 86], a1: [110, 108], e2: [74, 86], a2: [90, 108],
      k1: [88, 150], f1: [80, 185], k2: [112, 150], f2: [120, 185] }
  },
  {
    name: 'Cross-body shoulder stretch',
    steps: [
      'Bring one straight arm across your chest.',
      'Hook the other arm under it, just above the elbow, and pull it closer to you.',
      'Keep the stretching shoulder down, away from your ear.'
    ],
    hold: '20 seconds each side',
    pose: { h: [100, 38], n: [100, 56], p: [100, 112],
      e1: [86, 64], a1: [62, 66], e2: [118, 82], a2: [84, 70],
      k1: [90, 150], f1: [86, 185], k2: [110, 150], f2: [114, 185] }
  },
  {
    name: 'Overhead reach',
    steps: [
      'Stand with your feet wide apart.',
      'Reach both arms straight up and stretch tall, as if someone is pulling your hands.',
      'Keep your ribs in and your feet flat on the floor.'
    ],
    hold: '15 seconds',
    pose: { h: [100, 44], n: [100, 62], p: [100, 116],
      e1: [94, 34], a1: [92, 10], e2: [106, 34], a2: [108, 10],
      k1: [84, 152], f1: [70, 185], k2: [116, 152], f2: [130, 185] }
  },
  {
    name: 'Side bend',
    steps: [
      'Stand with your feet wide apart.',
      'Rest one hand on your thigh and reach the other arm up and over your head.',
      'Bend sideways without leaning forward or back.'
    ],
    hold: '20 seconds each side',
    pose: { h: [76, 48], n: [86, 64], p: [100, 116],
      e1: [94, 32], a1: [62, 26], e2: [84, 92], a2: [88, 118],
      k1: [84, 152], f1: [70, 185], k2: [116, 152], f2: [130, 185] }
  },
  {
    name: 'Flat-back hinge',
    steps: [
      'Stand with your feet apart and reach your arms forward.',
      'Push your hips back and lower your chest until your back is flat like a table.',
      'Keep your knees soft and your neck long.'
    ],
    hold: '20 seconds',
    pose: { h: [156, 96], n: [140, 106], p: [86, 104], face: 10,
      e1: [162, 118], a1: [186, 122], e2: [160, 114], a2: [184, 116],
      k1: [92, 146], f1: [96, 185], k2: [80, 146], f2: [72, 185] }
  },
  {
    name: 'Wide forward fold',
    steps: [
      'Stand with your feet very wide apart.',
      'Fold forward from your hips and let your hands reach toward the floor.',
      'Let your head hang; bend your knees a little if you need to.'
    ],
    hold: '30 seconds',
    pose: { h: [100, 158], n: [100, 140], p: [100, 92], face: 90,
      e1: [88, 162], a1: [86, 184], e2: [112, 162], a2: [114, 184],
      k1: [78, 138], f1: [60, 185], k2: [122, 138], f2: [140, 185] }
  },
  {
    name: 'Chest opener',
    steps: [
      'Stand with your feet apart, knees slightly bent, hands on your thighs.',
      'Push your chest up and forward and gently look up.',
      'Squeeze your shoulder blades together.'
    ],
    hold: '15 seconds',
    pose: { h: [86, 46], n: [92, 64], p: [100, 114], face: -60,
      e1: [112, 92], a1: [108, 126], e2: [108, 94], a2: [104, 128],
      k1: [110, 150], f1: [102, 185], k2: [106, 150], f2: [96, 185] }
  },
  {
    name: 'Wide squat with shoulder dip',
    steps: [
      'Step your feet wide, turn your toes out and sink into a low squat.',
      'Put your hands on your knees and push them gently outward.',
      'Dip one shoulder toward the middle, then switch.'
    ],
    hold: '15 seconds each side',
    pose: { h: [94, 62], n: [96, 80], p: [100, 128],
      e1: [80, 104], a1: [70, 132], e2: [118, 102], a2: [130, 132],
      k1: [68, 134], f1: [64, 185], k2: [132, 134], f2: [136, 185] }
  },
  {
    name: 'Standing lunge',
    steps: [
      'Take a big step forward and bend your front knee over your ankle.',
      'Keep your back leg straight with the heel pressing down.',
      'Rest your hands on your front thigh and keep your chest up.'
    ],
    hold: '20 seconds each side',
    pose: { h: [108, 52], n: [104, 70], p: [96, 122], face: 0,
      e1: [124, 96], a1: [126, 124], e2: [120, 98], a2: [122, 126],
      k1: [130, 128], f1: [134, 185], k2: [68, 152], f2: [38, 185] }
  },
  {
    name: 'Low lunge with hands down',
    steps: [
      'From a lunge, put both hands on the floor inside your front foot.',
      'Stretch your back leg long behind you and let your hips sink.',
      'Keep your front heel on the floor if you can.'
    ],
    hold: '30 seconds each side',
    pose: { h: [156, 158], n: [140, 156], p: [92, 138], face: 60,
      e1: [146, 170], a1: [148, 184], e2: [144, 170], a2: [144, 184],
      k1: [56, 170], f1: [18, 180], k2: [118, 124], f2: [126, 185] }
  },
  {
    name: 'Kneeling thigh stretch',
    steps: [
      'Kneel on one knee with the other foot in front of you.',
      'Reach back with one hand and hold your back foot.',
      'Gently pull your heel toward you and push your hips forward.'
    ],
    hold: '20 seconds each side',
    pose: { h: [108, 70], n: [104, 88], p: [96, 138], face: 0,
      e1: [80, 112], a1: [62, 128], e2: [118, 112], a2: [124, 136],
      k1: [130, 140], f1: [132, 185], k2: [74, 182], f2: [56, 132] }
  }
];

// Draws one stick figure as an SVG picture
App.dance.drawPose = function (pose) {
  function line(a, b, cls) {
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}"/>`;
  }
  function limb(from, mid, end, cls) {
    return line(from, mid, cls) + line(mid, end, cls);
  }
  const p = pose;
  let nose = '';
  if (typeof p.face === 'number') {
    const angle = p.face * Math.PI / 180;
    nose = line([p.h[0] + Math.cos(angle) * 11, p.h[1] + Math.sin(angle) * 11],
      [p.h[0] + Math.cos(angle) * 17, p.h[1] + Math.sin(angle) * 17], 'wu-near');
  }
  return `<svg viewBox="0 0 200 200" class="wu-figure" aria-hidden="true">
    <line x1="4" y1="188" x2="196" y2="188" class="wu-floor"/>
    ${limb(p.n, p.e2, p.a2, 'wu-far')}
    ${limb(p.p, p.k2, p.f2, 'wu-far')}
    ${line(p.n, p.p, 'wu-near')}
    ${limb(p.p, p.k1, p.f1, 'wu-near')}
    ${limb(p.n, p.e1, p.a1, 'wu-near')}
    ${line(p.n, [p.h[0] + (p.n[0] - p.h[0]) * 0.3, p.h[1] + (p.n[1] - p.h[1]) * 0.3], 'wu-near')}
    <circle cx="${p.h[0]}" cy="${p.h[1]}" r="11" class="wu-head"/>
    ${nose}
  </svg>`;
};

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
      picture.innerHTML = App.dance.drawPose(move.pose);
      name.textContent = move.name;
      steps.innerHTML = '';
      move.steps.forEach(function (text) {
        const item = document.createElement('li');
        item.textContent = text;
        steps.appendChild(item);
      });
      hold.textContent = 'Hold: ' + move.hold;
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

  show();
};
