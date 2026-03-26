// ─────────────────────────────────────────────────────────────
//  FLOWER AND MOON  ·  Chapter 1
//  "She ran away in the forest. He followed."
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  CANVAS SETUP
// ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = 640, H = 480, TS = 32;

// ─────────────────────────────────────────────────────────────
//  SEEDED RNG
// ─────────────────────────────────────────────────────────────
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─────────────────────────────────────────────────────────────
//  MAP  (60 × 32 tiles)  —  Sunlit Meadow seed
//  0 = treeline (solid)  1 = grass (walkable)
//  2 = path (walkable)   4 = flowers (walkable)
//  5 = moonlit clearing  6 = meadow centre
// ─────────────────────────────────────────────────────────────
const MW = 60, MH = 32;
const map = Array.from({ length: MH }, () => new Uint8Array(MW));

// Waypoints: wide, open meadow — fewer turns, more open ground
const WAYPOINTS = [
  [2, 16], [8, 14], [14, 17], [20, 13], [26, 15],
  [32, 12], [38, 15], [44, 13], [50, 15], [55, 13],
];

// Tease positions — the girl dashes to these in order
const TEASE_SPOTS = [
  { x: 18 * TS + TS / 2, y: 13 * TS + TS / 2 },
  { x: 32 * TS + TS / 2, y: 14 * TS + TS / 2 },
  { x: 46 * TS + TS / 2, y: 12 * TS + TS / 2 },
  { x: 54 * TS + TS / 2, y: 14 * TS + TS / 2 }, // final: near moon clearing
];

function buildMap() {
  const rng = makeRng(42); // different seed for meadow feel

  // Carve wide open meadow along waypoints
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const [x1, y1] = WAYPOINTS[i], [x2, y2] = WAYPOINTS[i + 1];
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let t = 0; t <= steps; t++) {
      const x = Math.round(x1 + (x2 - x1) * t / steps);
      const y = Math.round(y1 + (y2 - y1) * t / steps);
      // Very wide grass band — open meadow feel
      for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < MW - 1 && ny > 0 && ny < MH - 1 && map[ny][nx] === 0) map[ny][nx] = 1;
      }
      // Soft dirt path centre
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < MW - 1 && ny > 0 && ny < MH - 1) map[ny][nx] = 2;
      }
    }
  }

  // Heavy flower scattering — this is a flower meadow
  for (let i = 0; i < 200; i++) {
    const x = 1 + Math.floor(rng() * (MW - 2));
    const y = 1 + Math.floor(rng() * (MH - 2));
    if (map[y][x] === 1) map[y][x] = 4;
  }

  // Moon clearing near end — large open area
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    const nx = 54 + dx, ny = 14 + dy;
    if (nx > 0 && nx < MW - 1 && ny > 0 && ny < MH - 1) map[ny][nx] = 5;
  }

  // Central meadow patch
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const nx = 32 + dx, ny = 15 + dy;
    if (nx > 0 && nx < MW - 1 && ny > 0 && ny < MH - 1) map[ny][nx] = 6;
  }
}
buildMap();

function tileAt(wx, wy) {
  const c = Math.floor(wx / TS), r = Math.floor(wy / TS);
  if (c < 0 || c >= MW || r < 0 || r >= MH) return 0;
  return map[r][c];
}
function isSolid(wx, wy) { return tileAt(wx, wy) === 0; }

// ─────────────────────────────────────────────────────────────
//  PRE-RENDER TILE TEXTURES
// ─────────────────────────────────────────────────────────────
function makeTileCanvas(drawFn) {
  const oc = document.createElement('canvas');
  oc.width = oc.height = TS;
  drawFn(oc.getContext('2d'));
  return oc;
}

const TREE_OFFSETS = (() => {
  const rng = makeRng(99);
  return Array.from({ length: MW * MH }, () => ({
    dx: (rng() - 0.5) * 4, dy: (rng() - 0.5) * 4,
    size: 0.75 + rng() * 0.45, shade: Math.floor(rng() * 3),
  }));
})();

function drawTreelineTile(cx, sx, sy, idx) {
  // Slightly lighter treeline — daytime meadow edge
  cx.fillStyle = '#0f1e10'; cx.fillRect(sx, sy, TS, TS);
  const o = TREE_OFFSETS[idx % (MW * MH)];
  const tx = sx + TS / 2 + o.dx, ty = sy + TS / 2 + o.dy;
  const sz = (TS / 2 - 3) * o.size;
  cx.fillStyle = '#3a2a15'; cx.fillRect(tx - 2, ty, 4, TS / 2);
  const cols = ['#1a3018', '#24421e', '#2e5824'];
  cx.fillStyle = cols[o.shade];
  cx.beginPath(); cx.arc(tx, ty - 2, sz, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = cols[Math.min(2, o.shade + 1)];
  cx.beginPath(); cx.arc(tx - 2, ty - sz * 0.4, sz * 0.7, 0, Math.PI * 2); cx.fill();
}

// Sunlit grass — warmer green
const grassTile = makeTileCanvas(cx => {
  cx.fillStyle = '#3a6e2a'; cx.fillRect(0, 0, TS, TS);
  cx.fillStyle = '#4a8830';
  [[4, 8], [12, 4], [20, 14], [8, 20], [16, 24], [26, 10], [28, 20], [3, 16], [22, 3]].forEach(([x, y]) => {
    cx.fillRect(x, y, 1, 5); cx.fillRect(x + 2, y + 2, 1, 3);
  });
  // Occasional bright highlight
  cx.fillStyle = '#5a9840';
  cx.fillRect(10, 10, 2, 3); cx.fillRect(24, 18, 2, 3);
});

// Soft dirt path
const pathTile = makeTileCanvas(cx => {
  cx.fillStyle = '#8a7450'; cx.fillRect(0, 0, TS, TS);
  cx.fillStyle = '#7a6440';
  [[2, 2, 14, 10], [18, 6, 10, 10], [4, 18, 13, 10]].forEach(([x, y, w, h]) => cx.fillRect(x, y, w, h));
  cx.fillStyle = '#9a8460';
  [[3, 3, 4, 2], [19, 7, 3, 2], [5, 19, 4, 2]].forEach(([x, y, w, h]) => cx.fillRect(x, y, w, h));
});

// Rich flower tile — pinks, whites, yellows
const flowerTile = makeTileCanvas(cx => {
  cx.fillStyle = '#3a6e2a'; cx.fillRect(0, 0, TS, TS);
  cx.fillStyle = '#4a8830';
  [[6, 12], [20, 6], [14, 22], [4, 2], [26, 18]].forEach(([x, y]) => { cx.fillRect(x, y, 1, 4); cx.fillRect(x + 2, y + 2, 1, 3); });
  [
    ['#f0a0c0', 6, 10], ['#ffffc0', 20, 5], ['#c8e8ff', 13, 22],
    ['#f0c0a0', 4, 0],  ['#e8a8e0', 26, 16],
  ].forEach(([col, x, y]) => {
    cx.fillStyle = col; cx.fillRect(x, y, 5, 5);
    cx.fillStyle = '#fff8'; cx.fillRect(x + 1, y + 1, 3, 3);
    cx.fillStyle = '#ffe000'; cx.fillRect(x + 2, y + 2, 1, 1);
  });
});

// Moonlit clearing — soft silver grass
const moonClearTile = makeTileCanvas(cx => {
  cx.fillStyle = '#2a3e4a'; cx.fillRect(0, 0, TS, TS);
  cx.fillStyle = '#3a5060';
  [[4, 8], [14, 4], [22, 16], [8, 22], [18, 28]].forEach(([x, y]) => {
    cx.fillRect(x, y, 1, 5); cx.fillRect(x + 2, y + 2, 1, 3);
  });
  cx.fillStyle = 'rgba(200,220,255,0.15)'; cx.fillRect(0, 0, TS, TS);
});

// Meadow centre — bright lush patch
const meadowTile = makeTileCanvas(cx => {
  cx.fillStyle = '#4a7e30'; cx.fillRect(0, 0, TS, TS);
  cx.fillStyle = '#5a9038';
  [[6, 6, 10, 10], [18, 14, 8, 8]].forEach(([x, y, w, h]) => cx.fillRect(x, y, w, h));
  cx.fillStyle = '#70a848'; cx.fillRect(8, 8, 4, 4);
  // Small flowers
  cx.fillStyle = '#f8c0d8'; cx.fillRect(5, 5, 3, 3);
  cx.fillStyle = '#c8f0a0'; cx.fillRect(20, 20, 3, 3);
});

function getTileCanvas(type) {
  switch (type) {
    case 1: return grassTile;
    case 2: return pathTile;
    case 4: return flowerTile;
    case 5: return moonClearTile;
    case 6: return meadowTile;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  ENTITIES
// ─────────────────────────────────────────────────────────────
const player = {
  x: WAYPOINTS[0][0] * TS + TS / 2,
  y: WAYPOINTS[0][1] * TS + TS / 2,
  dir: 'right', moving: false, speed: 2.4,
};

// Girl starts at first tease spot, just off-screen to the right
const girl = {
  x: TEASE_SPOTS[0].x,
  y: TEASE_SPOTS[0].y,
  visible: true,
  running: false,
  gone: false,
  dir: 'left',
  runSpeed: 0,
  appearTick: 0,
  teaseIdx: 0,      // which TEASE_SPOT she's at
  targetX: 0,
  targetY: 0,
  dashTimer: 0,
  isDashing: false,
};

// ─────────────────────────────────────────────────────────────
//  CAMERA
// ─────────────────────────────────────────────────────────────
const cam = { x: 0, y: 0 };

function snapCamera() {
  cam.x = Math.max(0, Math.min(MW * TS - W, player.x - W / 2));
  cam.y = Math.max(0, Math.min(MH * TS - H, player.y - H / 2));
}

function lerpCamera() {
  const tx = Math.max(0, Math.min(MW * TS - W, player.x - W / 2));
  const ty = Math.max(0, Math.min(MH * TS - H, player.y - H / 2));
  cam.x += (tx - cam.x) * 0.08;
  cam.y += (ty - cam.y) * 0.08;
}
snapCamera();

// ─────────────────────────────────────────────────────────────
//  BUTTERFLIES  (replaces fireflies for daytime meadow)
// ─────────────────────────────────────────────────────────────
const rngB = makeRng(77);
const butterflies = Array.from({ length: 20 }, () => ({
  x: rngB() * MW * TS,
  y: 4 * TS + rngB() * 24 * TS,
  angle: rngB() * Math.PI * 2,
  speed: 0.3 + rngB() * 0.5,
  phase: rngB() * Math.PI * 2,
  wingPhase: rngB() * Math.PI * 2,
  col: ['#f0a0c0', '#a0c8f0', '#f8e080', '#c8f0a0'][Math.floor(rngB() * 4)],
}));

function updateButterflies() {
  for (const b of butterflies) {
    b.x += Math.cos(b.angle) * b.speed * 0.4;
    b.y += Math.sin(b.angle) * b.speed * 0.2 + Math.sin(b.phase * 0.03) * 0.15;
    b.angle += (Math.random() - 0.5) * 0.08;
    b.wingPhase += 0.18;
    b.phase++;
    if (b.x < 0) b.x = MW * TS;
    if (b.x > MW * TS) b.x = 0;
    if (b.y < TS) b.y = MH * TS - TS;
    if (b.y > MH * TS - TS) b.y = TS;
  }
}

function drawButterflies() {
  for (const b of butterflies) {
    const sx = b.x - cam.x, sy = b.y - cam.y;
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
    const wFlap = Math.abs(Math.sin(b.wingPhase)) * 4 + 1;
    ctx.fillStyle = b.col;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(sx - wFlap - 1, sy - 2, wFlap, 3);
    ctx.fillRect(sx + 1,         sy - 2, wFlap, 3);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(sx - wFlap,     sy - 1, 1, 1);
    ctx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────────────
//  PETAL PARTICLES  (ambient floating petals)
// ─────────────────────────────────────────────────────────────
const rngP = makeRng(63);
const petals = Array.from({ length: 40 }, () => ({
  x: rngP() * W,
  y: rngP() * H,
  vy: 0.3 + rngP() * 0.4,
  vx: (rngP() - 0.5) * 0.5,
  rot: rngP() * Math.PI * 2,
  rotSpeed: (rngP() - 0.5) * 0.08,
  size: 2 + rngP() * 3,
  col: ['#f8b8d0', '#ffd8e8', '#ffe0f0', '#f0c8e0'][Math.floor(rngP() * 4)],
  alpha: 0.4 + rngP() * 0.5,
}));

function drawPetals() {
  for (const p of petals) {
    p.x += p.vx + Math.sin(tick * 0.02 + p.rot) * 0.3;
    p.y += p.vy;
    p.rot += p.rotSpeed;
    if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    ctx.save();
    ctx.globalAlpha = p.alpha * (STATE === 'CONFESSION' ? 1.5 : 0.7);
    ctx.fillStyle = p.col;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────────
const keys = {};
const _pressedFinal = new Set();

window.addEventListener('keydown', e => {
  _pressedFinal.add(e.code);
  keys[e.code] = true;
  e.preventDefault();
}, { capture: true });

window.addEventListener('keyup', e => {
  keys[e.code] = false;
}, { capture: true });

function confirmPress() {
  for (const k of ['Space', 'Enter', 'KeyZ', 'KeyX']) {
    if (_pressedFinal.has(k)) { _pressedFinal.delete(k); return true; }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
//  DIALOGUE SYSTEM
// ─────────────────────────────────────────────────────────────
const DLG = {
  active: false, lines: [], idx: 0,
  speaker: '', portrait: '',
  charIdx: 0, charTimer: 0, charSpeed: 2, done: false,
  callback: null,
};

function showDlg(lines, speaker, portrait, cb) {
  DLG.active = true;
  DLG.lines = lines; DLG.idx = 0;
  DLG.speaker = speaker; DLG.portrait = portrait;
  DLG.charIdx = 0; DLG.charTimer = 0; DLG.done = false;
  DLG.callback = cb || null;
  STATE = 'DIALOGUE';
}

function advanceDlg() {
  if (!DLG.done) {
    DLG.charIdx = DLG.lines[DLG.idx].length;
    DLG.done = true;
  } else {
    DLG.idx++;
    if (DLG.idx >= DLG.lines.length) {
      DLG.active = false;
      const cb = DLG.callback;
      DLG.callback = null;
      if (cb) cb(); else STATE = 'PLAYING';
    } else {
      DLG.charIdx = 0; DLG.charTimer = 0; DLG.done = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────────────────────────
// States: FADE_IN | PLAYING | DIALOGUE | MONTAGE | CONFESSION | ENDING
let STATE = 'FADE_IN';
let tick = 0;
let fadeInTimer = 0;

// Montage state
let montagePhase = 0;       // 0 = waiting for approach, 1 = dashing, 2 = tease dlg
let teaseTriggered = [false, false, false, false];

// Confession state
let confessionPhase = 0;
let confessionTimer = 0;
let confessionTriggered = false;
let fadeToPink = 0;         // 0→1 during the final fade
let moonAlpha = 0;          // moon fade in

// ─────────────────────────────────────────────────────────────
//  DRAW – PLAYER
// ─────────────────────────────────────────────────────────────
function drawPlayer(sx, sy) {
  const bob = player.moving ? Math.sin(tick * 0.22) * 2 : 0;
  const legA = player.moving ? Math.sin(tick * 0.22) * 3 : 0;
  sx = Math.round(sx); sy = Math.round(sy + bob);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#232d5a';
  ctx.fillRect(sx - 5, sy - 2, 5, 8 + Math.max(0, legA));
  ctx.fillRect(sx + 1, sy - 2, 5, 8 - Math.max(0, -legA));

  ctx.fillStyle = '#5a3820';
  const lb = legA > 0 ? 2 : 0, rb = legA < 0 ? 2 : 0;
  ctx.fillRect(sx - 6, sy + 5 + lb, 7, 4);
  ctx.fillRect(sx, sy + 5 + rb, 7, 4);

  ctx.fillStyle = '#2a3d7a'; ctx.fillRect(sx - 7, sy - 16, 14, 16);
  ctx.fillStyle = '#1e2d60'; ctx.fillRect(sx - 8, sy - 14, 16, 14);

  const armSwing = player.moving ? Math.sin(tick * 0.22 + Math.PI) * 3 : 0;
  ctx.fillStyle = '#3a4d8a';
  if (player.dir !== 'left')  ctx.fillRect(sx + 6,  sy - 14 + armSwing, 4, 10);
  if (player.dir !== 'right') ctx.fillRect(sx - 10, sy - 14 - armSwing, 4, 10);

  ctx.fillStyle = '#8090e0'; ctx.fillRect(sx - 7, sy - 17, 14, 4);
  ctx.fillStyle = '#f0c8a0'; ctx.fillRect(sx - 6, sy - 26, 12, 11);

  ctx.fillStyle = '#2a1808';
  ctx.fillRect(sx - 7, sy - 30, 14, 6);
  ctx.fillRect(sx - 8, sy - 26, 3, 8);
  if (player.dir === 'right') ctx.fillRect(sx + 5, sy - 26, 3, 6);

  ctx.fillStyle = '#1a1208';
  if (player.dir !== 'up') {
    if (player.dir === 'left')       ctx.fillRect(sx - 4, sy - 22, 3, 3);
    else if (player.dir === 'right') ctx.fillRect(sx + 2, sy - 22, 3, 3);
    else { ctx.fillRect(sx - 4, sy - 22, 3, 3); ctx.fillRect(sx + 2, sy - 22, 3, 3); }
  }
}

// ─────────────────────────────────────────────────────────────
//  DRAW – GIRL
// ─────────────────────────────────────────────────────────────
function drawGirl(sx, sy) {
  if (!girl.visible || girl.gone) return;
  const bob = (girl.running || girl.isDashing) ? Math.sin(tick * 0.35) * 3 : Math.sin(tick * 0.08) * 1.5;
  const legA = (girl.running || girl.isDashing) ? Math.sin(tick * 0.35) * 6 : 0;
  sx = Math.round(sx); sy = Math.round(sy + bob);

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Dress — slightly more saturated pink for daytime
  ctx.fillStyle = '#e090c0';
  ctx.beginPath();
  ctx.moveTo(sx - 10, sy - 2); ctx.lineTo(sx + 11, sy - 2);
  ctx.lineTo(sx + 14, sy + 10); ctx.lineTo(sx - 13, sy + 10);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#f0d0c0';
  ctx.fillRect(sx - 4, sy + 2, 4, 8 + Math.max(0, legA));
  ctx.fillRect(sx + 1, sy + 2, 4, 8 - Math.max(0, -legA));

  ctx.fillStyle = '#7a5888';
  const la = legA > 0 ? 2 : 0, ra = legA < 0 ? 2 : 0;
  ctx.fillRect(sx - 5, sy + 9 + la, 6, 4);
  ctx.fillRect(sx + 1, sy + 9 + ra, 6, 4);

  ctx.fillStyle = '#f0d8ff'; ctx.fillRect(sx - 6, sy - 18, 12, 18);

  const armS = (girl.running || girl.isDashing) ? Math.sin(tick * 0.35 + Math.PI) * 5 : 0;
  ctx.fillStyle = '#f0d0c0';
  ctx.fillRect(sx - 10, sy - 16 + armS, 4, 10);
  ctx.fillRect(sx + 7,  sy - 16 - armS, 4, 10);

  ctx.fillStyle = '#c090d8'; ctx.fillRect(sx - 6, sy - 20, 12, 4);
  ctx.fillStyle = '#f0d0c0'; ctx.fillRect(sx - 7, sy - 32, 14, 13);

  // Hair
  ctx.fillStyle = '#d0c8e8';
  ctx.fillRect(sx - 8, sy - 36, 16, 8);
  ctx.fillRect(sx - 9, sy - 30, 3, 20);
  ctx.fillRect(sx + 7, sy - 30, 3, 18);
  ctx.fillRect(sx - 9, sy - 14, 3, 8);
  ctx.fillStyle = '#e8e0f8'; ctx.fillRect(sx - 4, sy - 36, 6, 4);

  // Eyes
  ctx.fillStyle = '#4060a0';
  if (girl.running || girl.isDashing) {
    if (girl.dir === 'right') ctx.fillRect(sx + 1, sy - 26, 4, 3);
    else                      ctx.fillRect(sx - 5, sy - 26, 4, 3);
  } else {
    ctx.fillRect(sx - 4, sy - 26, 4, 3);
    ctx.fillRect(sx + 1, sy - 26, 4, 3);
  }

  // Blush
  ctx.fillStyle = 'rgba(255,130,130,0.5)';
  ctx.fillRect(sx - 7, sy - 22, 4, 3);
  ctx.fillRect(sx + 4, sy - 22, 4, 3);

  // Flower accessory — only when standing
  if (!girl.running && !girl.isDashing) {
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(sx + 11, sy - 34, 3, 44);
    // Sunflower (different from the forest wand)
    ctx.fillStyle = '#e8c030';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.fillRect(sx + 12 + Math.cos(a) * 7 - 2, sy - 36 + Math.sin(a) * 7 - 2, 4, 4);
    }
    ctx.fillStyle = '#804020';
    ctx.beginPath(); ctx.arc(sx + 12, sy - 36, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,0,0.3)';
    ctx.beginPath(); ctx.arc(sx + 12, sy - 36, 10, 0, Math.PI * 2); ctx.fill();
  }

  // Appear sparkle
  if (!girl.running && !girl.isDashing && tick < girl.appearTick + 80) {
    const p = (tick - girl.appearTick) / 80;
    const a = Math.sin(p * Math.PI);
    ctx.fillStyle = `rgba(255,200,80,${a})`;
    ctx.shadowColor = 'rgba(255,160,0,0.8)'; ctx.shadowBlur = 8;
    ctx.font = 'bold 12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, sy - 48);
    ctx.shadowBlur = 0; ctx.textAlign = 'left';
  }
}

// ─────────────────────────────────────────────────────────────
//  DRAW – WORLD TILES
// ─────────────────────────────────────────────────────────────
function drawWorld(moonOverlay) {
  // Sky — warm daytime transitioning to night during confession
  const nightBlend = moonOverlay || 0;
  const skyTop    = lerpColor('#1a3060', '#050820', nightBlend);
  const skyBottom = lerpColor('#2a6030', '#0d1e30', nightBlend);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, skyTop); sky.addColorStop(1, skyBottom);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Draw sun (fades out during confession)
  if (nightBlend < 0.8) {
    const sunAlpha = 1 - nightBlend * 1.25;
    ctx.globalAlpha = Math.max(0, sunAlpha);
    const sunG = ctx.createRadialGradient(W * 0.75, 50, 5, W * 0.75, 50, 55);
    sunG.addColorStop(0, 'rgba(255,240,180,1)');
    sunG.addColorStop(0.4, 'rgba(255,200,100,0.6)');
    sunG.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = sunG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath(); ctx.arc(W * 0.75, 50, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw moon (rises during confession)
  if (moonAlpha > 0) {
    const mx = W * 0.5, my = 55;
    ctx.globalAlpha = moonAlpha;
    const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 60);
    mg.addColorStop(0, 'rgba(220,230,255,0.6)');
    mg.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
    // Moon disc
    ctx.fillStyle = '#e8eeff';
    ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,215,255,0.9)';
    ctx.beginPath(); ctx.arc(mx, my, 26, 0, Math.PI * 2); ctx.fill();
    // Subtle craters
    ctx.fillStyle = 'rgba(180,195,240,0.4)';
    ctx.beginPath(); ctx.arc(mx - 8, my + 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 10, my - 8, 4, 0, Math.PI * 2); ctx.fill();
    // Glow ring
    ctx.strokeStyle = 'rgba(200,220,255,0.3)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const c0 = Math.floor(cam.x / TS), c1 = Math.min(MW, c0 + Math.ceil(W / TS) + 2);
  const r0 = Math.floor(cam.y / TS), r1 = Math.min(MH, r0 + Math.ceil(H / TS) + 2);

  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const tile = map[r][c];
      const sx = Math.floor(c * TS - cam.x), sy = Math.floor(r * TS - cam.y);
      if (tile === 0) {
        drawTreelineTile(ctx, sx, sy, r * MW + c);
      } else {
        const tc = getTileCanvas(tile);
        if (tc) ctx.drawImage(tc, sx, sy);
      }
    }
  }
}

function lerpColor(hex1, hex2, t) {
  const p = s => parseInt(s, 16);
  const r1 = p(hex1.slice(1, 3)), g1 = p(hex1.slice(3, 5)), b1 = p(hex1.slice(5, 7));
  const r2 = p(hex2.slice(1, 3)), g2 = p(hex2.slice(3, 5)), b2 = p(hex2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────────────────────
//  DRAW – ATMOSPHERIC
// ─────────────────────────────────────────────────────────────
function drawMeadowHaze() {
  // Warm golden haze (daytime) vs cool blue (confession)
  const isNight = STATE === 'CONFESSION';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (!isNight) {
    g.addColorStop(0,   'rgba(255,220,120,0.08)');
    g.addColorStop(0.5, 'rgba(255,200,80,0.04)');
    g.addColorStop(1,   'rgba(180,220,100,0.1)');
  } else {
    g.addColorStop(0,   'rgba(100,120,200,0.18)');
    g.addColorStop(0.5, 'rgba(80,100,180,0.08)');
    g.addColorStop(1,   'rgba(60,80,160,0.22)');
  }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawVignette() {
  const col = STATE === 'CONFESSION' ? 'rgba(0,0,20,0.7)' : 'rgba(0,10,0,0.55)';
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ─────────────────────────────────────────────────────────────
//  DRAW – DIALOGUE BOX  (pink-toned for this chapter)
// ─────────────────────────────────────────────────────────────
function drawDialogueBox() {
  if (!DLG.active) return;

  DLG.charTimer++;
  if (!DLG.done && DLG.charTimer >= DLG.charSpeed) {
    DLG.charTimer = 0;
    if (DLG.charIdx < DLG.lines[DLG.idx].length) DLG.charIdx++;
    else DLG.done = true;
  }

  const BX = 10, BY = H - 130, BW = W - 20, BH = 120;
  ctx.fillStyle = 'rgba(8,4,14,0.96)'; ctx.fillRect(BX, BY, BW, BH);
  ctx.strokeStyle = '#703060'; ctx.lineWidth = 2; ctx.strokeRect(BX, BY, BW, BH);
  ctx.strokeStyle = '#4a1840'; ctx.lineWidth = 1; ctx.strokeRect(BX + 4, BY + 4, BW - 8, BH - 8);
  ctx.fillStyle = 'rgba(200,80,140,0.12)'; ctx.fillRect(BX + 6, BY + 6, BW - 12, 2);

  if (DLG.speaker) {
    const nw = ctx.measureText(DLG.speaker).width * 0.5 + 20;
    ctx.fillStyle = 'rgba(8,4,14,0.96)'; ctx.fillRect(BX + 16, BY - 18, nw, 20);
    ctx.strokeStyle = '#703060'; ctx.lineWidth = 2; ctx.strokeRect(BX + 16, BY - 18, nw, 20);
    const spkCol = DLG.portrait === 'girl' ? '#f090c0' : '#a0b0ff';
    ctx.fillStyle = spkCol; ctx.font = '8px "Press Start 2P"';
    ctx.fillText(DLG.speaker, BX + 24, BY - 4);
  }

  const hasPortrait = DLG.portrait === 'girl' || DLG.portrait === 'player';
  if (DLG.portrait === 'girl')   drawPortraitGirl(BX + BW - 72, BY + 12, 58, 58);
  if (DLG.portrait === 'player') drawPortraitPlayer(BX + BW - 72, BY + 12, 58, 58);

  const text = DLG.lines[DLG.idx].substring(0, DLG.charIdx);
  ctx.fillStyle = '#f0e0ff'; ctx.font = '9px "Press Start 2P"';
  const maxW = hasPortrait ? BW - 105 : BW - 40;
  const words = text.split(' ');
  let line = '', lineY = BY + 34;
  for (const w of words) {
    const test = line + (line ? ' ' : '') + w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, BX + 20, lineY); line = w; lineY += 20;
    } else line = test;
  }
  if (line) ctx.fillText(line, BX + 20, lineY);

  if (DLG.done && Math.floor(tick / 18) % 2 === 0) {
    ctx.fillStyle = '#c060a0'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('▼', BX + BW - 30, BY + BH - 14);
  }
}

function drawPortraitPlayer(x, y, w, h) {
  ctx.fillStyle = '#0e1830'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a2850'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#f0c8a0'; ctx.fillRect(x + 19, y + 14, 20, 18);
  ctx.fillStyle = '#2a1808'; ctx.fillRect(x + 17, y + 11, 24, 8);
  ctx.fillRect(x + 17, y + 13, 4, 10);
  ctx.fillStyle = '#1a1208'; ctx.fillRect(x + 22, y + 20, 5, 5); ctx.fillRect(x + 31, y + 20, 5, 5);
  ctx.fillStyle = '#2a3d7a'; ctx.fillRect(x + 16, y + 30, 26, 18);
  ctx.fillStyle = '#8090e0'; ctx.fillRect(x + 16, y + 28, 26, 5);
}

function drawPortraitGirl(x, y, w, h) {
  ctx.fillStyle = '#140818'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5a2050'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#f0d0c0'; ctx.fillRect(x + 18, y + 14, 22, 18);
  ctx.fillStyle = '#d8d0f0';
  ctx.fillRect(x + 16, y + 10, 26, 8);
  ctx.fillRect(x + 16, y + 12, 5, 24);
  ctx.fillRect(x + 37, y + 12, 5, 22);
  ctx.fillStyle = '#4060a0'; ctx.fillRect(x + 22, y + 20, 5, 5); ctx.fillRect(x + 31, y + 20, 5, 5);
  ctx.fillStyle = 'rgba(255,130,130,0.6)'; ctx.fillRect(x + 17, y + 27, 6, 3); ctx.fillRect(x + 35, y + 27, 6, 3);
  ctx.fillStyle = '#f0d0f8'; ctx.fillRect(x + 15, y + 30, 28, 16);
  ctx.fillStyle = '#c090d0'; ctx.fillRect(x + 15, y + 28, 28, 5);
}

// ─────────────────────────────────────────────────────────────
//  DRAW – TITLE CARD  (fade in for chapter start)
// ─────────────────────────────────────────────────────────────
function drawFadeIn() {
  drawWorld(0);
  fadeInTimer++;

  if (fadeInTimer < 80) {
    // Black → world
    ctx.fillStyle = `rgba(5,3,10,${1 - fadeInTimer / 80})`;
    ctx.fillRect(0, 0, W, H);
  } else if (fadeInTimer < 200) {
    // Show chapter title
    const a = Math.min(1, (fadeInTimer - 80) / 40);
    ctx.fillStyle = `rgba(5,3,10,${0.88 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(208,112,160,0.8)'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#f0c0e0'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('Chapter 1', W / 2, H / 2 - 28);
    ctx.fillStyle = '#ffe0f0'; ctx.font = '16px "Press Start 2P"';
    ctx.fillText('Flower and Moon', W / 2, H / 2 + 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a06080'; ctx.font = '7px "Press Start 2P"';
    ctx.fillText('"She ran, but left a trail of petals."', W / 2, H / 2 + 32);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  } else {
    // Fade to playing
    const a = Math.max(0, 1 - (fadeInTimer - 200) / 50);
    drawWorld(0);
    drawButterflies();
    drawMeadowHaze(); drawPetals(); drawVignette();
    if (a > 0) {
      ctx.fillStyle = `rgba(5,3,10,${0.88 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0c0e0'; ctx.font = '10px "Press Start 2P"';
      ctx.fillText('Chapter 1', W / 2, H / 2 - 28);
      ctx.fillStyle = '#ffe0f0'; ctx.font = '16px "Press Start 2P"';
      ctx.fillText('Flower and Moon', W / 2, H / 2 + 2);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    if (fadeInTimer > 260) {
      STATE = 'PLAYING';
      showDlg(
        ['...', 'I followed her here somehow.', 'A sunlit meadow, full of flowers.', 'And she\'s still here.', 'Just... standing there.'],
        '', 'player', () => { STATE = 'PLAYING'; }
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  MONTAGE – TEASE MECHANIC
// ─────────────────────────────────────────────────────────────
// Tease dialogues for each spot
const TEASE_DIALOGUES = [
  {
    approach: ["You're still following me?", "You really are like a persistent seedling."],
    speaker: '???', portrait: 'girl',
  },
  {
    approach: ["Wait up! I found something...", "Oh, nevermind, you're too slow!"],
    speaker: '???', portrait: 'girl',
  },
  {
    approach: ["You actually made it this far?", "Hmph. Maybe you're not so slow after all."],
    speaker: '???', portrait: 'girl',
  },
];

function checkTeaseProximity() {
  if (confessionTriggered) return;
  const idx = girl.teaseIdx;
  if (idx >= TEASE_SPOTS.length - 1) return; // last spot = confession
  if (teaseTriggered[idx]) return;

  const dist = Math.hypot(player.x - girl.x, player.y - girl.y);
  if (dist < 5 * TS) {
    teaseTriggered[idx] = true;
    const dlg = TEASE_DIALOGUES[Math.min(idx, TEASE_DIALOGUES.length - 1)];

    // Show tease dialogue then dash away
    showDlg(dlg.approach, dlg.speaker, dlg.portrait, () => {
      // Dash to next spot
      girl.teaseIdx++;
      const next = TEASE_SPOTS[girl.teaseIdx];
      girl.isDashing = true;
      girl.dir = next.x > girl.x ? 'right' : 'left';
      girl.targetX = next.x;
      girl.targetY = next.y;
      girl.runSpeed = 0;
      girl.appearTick = tick + 80; // re-trigger sparkle at new spot
      STATE = 'MONTAGE';
    });
  }
}

function checkConfessionTrigger() {
  if (confessionTriggered) return;
  if (girl.teaseIdx < TEASE_SPOTS.length - 1) return; // must have done all teases
  const dist = Math.hypot(player.x - girl.x, player.y - girl.y);
  if (dist < 4 * TS) {
    confessionTriggered = true;
    STATE = 'CONFESSION';
    confessionPhase = 0;
    confessionTimer = 0;
    girl.isDashing = false;
    girl.running = false;
    player.moving = false;
    // Face each other
    girl.dir = 'left';
  }
}

function updateGirlDash() {
  if (!girl.isDashing) return;
  const dx = girl.targetX - girl.x;
  const dy = girl.targetY - girl.y;
  const dist = Math.hypot(dx, dy);
  girl.runSpeed = Math.min(5.5, girl.runSpeed + 0.3);
  if (dist < girl.runSpeed + 1) {
    girl.x = girl.targetX;
    girl.y = girl.targetY;
    girl.isDashing = false;
    girl.running = false;
    girl.runSpeed = 0;
    girl.appearTick = tick;
    if (STATE === 'MONTAGE') STATE = 'PLAYING';
  } else {
    girl.x += (dx / dist) * girl.runSpeed;
    girl.y += (dy / dist) * girl.runSpeed;
  }
}

// ─────────────────────────────────────────────────────────────
//  DRAW – CONFESSION SCENE
// ─────────────────────────────────────────────────────────────
function drawConfession() {
  confessionTimer++;

  // Gradually blend to night
  const nightT = Math.min(1, confessionTimer / 180);
  moonAlpha = Math.min(1, confessionTimer / 220);

  drawWorld(nightT);

  // Blue overlay intensifies
  const blueA = nightT * 0.45;
  ctx.fillStyle = `rgba(20,30,80,${blueA})`; ctx.fillRect(0, 0, W, H);

  // Draw characters (stationary)
  const gsx = Math.floor(girl.x - cam.x), gsy = Math.floor(girl.y - cam.y);
  const psx = Math.floor(player.x - cam.x), psy = Math.floor(player.y - cam.y);
  drawGirl(gsx, gsy);
  drawPlayer(psx, psy);
  drawMeadowHaze();
  drawPetals();
  drawVignette();
  drawButterflies();

  // Confession phases
  if (confessionPhase === 0 && confessionTimer > 160) {
    confessionPhase = 1;
    // Short ambient pause
    showDlg(
      ['...', 'She stopped running.', 'She\'s just standing there, under the rising moon.'],
      '', 'player', () => {
        confessionPhase = 2;
        STATE = 'CONFESSION';
      }
    );
  }

  if (confessionPhase === 3 && confessionTimer > 0) {
    // Fade to pink
    fadeToPink = Math.min(1, fadeToPink + 0.005);
    if (fadeToPink > 0) {
      ctx.fillStyle = `rgba(208,112,160,${fadeToPink * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }
    // End card
    if (fadeToPink > 0.5) {
      const textA = Math.min(1, (fadeToPink - 0.5) * 4);
      ctx.globalAlpha = textA;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,200,220,0.9)'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff0f8'; ctx.font = '11px "Press Start 2P"';
      ctx.fillText('...', W / 2, H / 2 - 20);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffe8f0'; ctx.font = '7px "Press Start 2P"';
      ctx.fillText('Her silence was its own answer.', W / 2, H / 2 + 20);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    if (fadeToPink >= 1 && Math.floor(tick / 30) % 2 === 0) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffd0e8'; ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('— end of chapter 1 —', W / 2, H - 30);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }

  if (DLG.active) drawDialogueBox();
}

// ─────────────────────────────────────────────────────────────
//  UPDATE – PLAYER MOVEMENT
// ─────────────────────────────────────────────────────────────
function updatePlayer() {
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['KeyA']) { dx = -1; player.dir = 'left'; }
  if (keys['ArrowRight'] || keys['KeyD']) { dx =  1; player.dir = 'right'; }
  if (keys['ArrowUp']    || keys['KeyW']) { dy = -1; player.dir = 'up'; }
  if (keys['ArrowDown']  || keys['KeyS']) { dy =  1; player.dir = 'down'; }
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }
  player.moving = !!(dx || dy);

  const spd = player.speed, m = 12;
  const nx = player.x + dx * spd;
  if (!isSolid(nx + m, player.y) && !isSolid(nx - m, player.y)) player.x = nx;
  const ny = player.y + dy * spd;
  if (!isSolid(player.x + m, ny) && !isSolid(player.x - m, ny)) player.y = ny;
}

// ─────────────────────────────────────────────────────────────
//  MAIN GAME LOOP
// ─────────────────────────────────────────────────────────────
function loop() {
  const confirm = confirmPress();
  tick++;

  switch (STATE) {

    case 'FADE_IN':
      updateButterflies();
      break;

    case 'PLAYING':
      updatePlayer(); lerpCamera();
      updateButterflies(); updateGirlDash();
      checkTeaseProximity();
      checkConfessionTrigger();
      break;

    case 'DIALOGUE':
      if (confirm) advanceDlg();
      lerpCamera(); updateButterflies(); updateGirlDash();
      break;

    case 'MONTAGE':
      lerpCamera(); updateButterflies(); updateGirlDash();
      if (!girl.isDashing) STATE = 'PLAYING';
      break;

    case 'CONFESSION':
      lerpCamera(); updateButterflies();
      // Phase 2: player speaks
      if (confessionPhase === 2) {
        confessionPhase = 2.5; // guard
        showDlg(
          ["Be the sun to my sunflower...", "The one that makes my life shine eternally."],
          'Boy', 'player',
          () => {
            confessionPhase = 2.9;
            STATE = 'CONFESSION';
            // Brief pause then girl responds
            setTimeout(() => {
              showDlg(
                ['...'],
                '???', 'girl',
                () => {
                  confessionPhase = 3;
                  STATE = 'CONFESSION';
                }
              );
            }, 800);
          }
        );
      }
      if (DLG.active && confirm) advanceDlg();
      break;
  }

  // ── RENDER ──────────────────────────────────────────────────
  ctx.clearRect(0, 0, W, H);

  if (STATE === 'FADE_IN') {
    drawFadeIn();
  } else if (STATE === 'CONFESSION' || (STATE === 'DIALOGUE' && confessionTriggered)) {
    drawConfession();
  } else {
    drawWorld(0);
    if (girl.visible && !girl.gone) drawGirl(Math.floor(girl.x - cam.x), Math.floor(girl.y - cam.y));
    drawPlayer(Math.floor(player.x - cam.x), Math.floor(player.y - cam.y));
    drawMeadowHaze();
    drawPetals();
    drawVignette();
    drawButterflies();
    drawHUD();
    if (DLG.active) drawDialogueBox();
  }

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────────────────────────
function drawHUD() {
  if (STATE !== 'PLAYING' || confessionTriggered) return;
  // Proximity hint to girl
  const dist = Math.hypot(player.x - girl.x, player.y - girl.y);
  if (dist < 9 * TS && dist > 4 * TS && !girl.isDashing) {
    const a = Math.max(0, (9 * TS - dist) / (9 * TS)) * 0.8;
    ctx.fillStyle = `rgba(240,160,200,${a * (0.6 + Math.sin(tick * 0.07) * 0.4)})`;
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('she\'s close by...', W / 2, 22);
    ctx.textAlign = 'left';
  }
}

loop();