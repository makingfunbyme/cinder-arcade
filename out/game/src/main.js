import { C } from './config.js';
import { createInput } from './input.js';
import { createWorld, nextWave, updateWorld, moveBody, blocked, burst } from './world.js';
import { fire, moveProjectiles } from './weapon.js';
import { render } from './render.js';

const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const input = createInput(canvas);
let w = createWorld(), state = 'START', paused = false, clearTime = 0;
function begin() { w = createWorld(); nextWave(w); state = 'PLAY'; paused = false; }
function touch(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }
function hurt() {
  if (w.player.invincible > 0) return;
  w.lives--; w.player.invincible = 1.6; w.shake = 9; w.combo = 1; w.chain = 0;
  burst(w, w.player.x, w.player.y, C.palette.cyan, 24);
  if (w.lives <= 0) { state = 'GAME_OVER'; burst(w, w.player.x, w.player.y, C.palette.magenta, 45); }
}
function update(dt) {
  if (input.restart) { begin(); input.restart = false; }
  if (input.start && state === 'START') begin();
  input.start = false;
  if (input.pause) { if (state === 'PLAY' || state === 'WAVE_CLEAR') paused = !paused; input.pause = false; }
  if (paused || state === 'START' || state === 'GAME_OVER') return;
  updateWorld(w, dt);
  const k = input.keys;
  let dx = Number(k.has('KeyD') || k.has('ArrowRight')) - Number(k.has('KeyA') || k.has('ArrowLeft'));
  let dy = Number(k.has('KeyS') || k.has('ArrowDown')) - Number(k.has('KeyW') || k.has('ArrowUp'));
  const length = Math.hypot(dx, dy) || 1;
  moveBody(w.player, dx / length * C.playerSpeed * dt, dy / length * C.playerSpeed * dt);
  fire(w, input.mouse, dt, input.mouse.down); moveProjectiles(w, dt);
  for (const b of w.bullets) {
    if (blocked(b)) b.life = 0;
    if (b.life <= 0) continue;
    for (const e of w.enemies) {
      if (e.hp <= 0 || !touch(b, e)) continue;
      b.life = 0; e.hp--; burst(w, b.x, b.y, C.palette.amber, 4);
      if (e.hp <= 0) {
        w.chain++; w.combo = Math.min(5, 1 + Math.floor(w.chain / 4)); w.comboTime = 3;
        w.score += (e.type === 'sentry' ? 180 : e.type === 'dasher' ? 130 : 100) * w.combo;
        w.shards.push({ x: e.x, y: e.y, r: 7, life: 12 }); burst(w, e.x, e.y, C.palette.magenta); w.shake = 2;
      }
      break;
    }
  }
  w.enemies = w.enemies.filter(e => e.hp > 0);
  for (const e of w.enemies) if (touch(e, w.player)) hurt();
  for (const b of w.orbs) {
    if (blocked(b)) b.life = 0;
    if (b.life > 0 && touch(b, w.player)) { b.life = 0; hurt(); }
  }
  for (const s of w.shards) if (touch(s, w.player)) { s.life = 0; w.score += 40 * w.combo; burst(w, s.x, s.y, C.palette.amber, 6); }
  w.shards = w.shards.filter(s => s.life > 0); w.bullets = w.bullets.filter(b => b.life > 0); w.orbs = w.orbs.filter(b => b.life > 0);
  if (state === 'PLAY' && w.spawnLeft === 0 && w.enemies.length === 0) {
    state = 'WAVE_CLEAR'; clearTime = 2.4; w.cleared = 500 * w.wave; w.score += w.cleared; w.orbs = [];
    if (w.wave % 3 === 0) w.lives = Math.min(C.lives, w.lives + 1);
  }
  if (state === 'WAVE_CLEAR') { clearTime -= dt; if (clearTime <= 0) { nextWave(w); state = 'PLAY'; } }
}

// Capture mode is a seeded, static tableau and never advances on wall-clock time.
const shot = new URLSearchParams(location.search).get('shot');
if (['start', 'play', 'gameover'].includes(shot)) {
  w = createWorld(); nextWave(w); w.wave = 4; w.spawnLeft = 8; w.time = 18.5; w.banner = 0;
  w.player.x = 468; w.player.y = 345; w.player.angle = -0.45; w.player.invincible = 0;
  w.score = 18420; w.combo = 3; w.lives = 3;
  w.enemies = [
    { x: 590, y: 292, r: 12, type: 'grunt', angle: 2.8, clock: 0, hp: 1 },
    { x: 753, y: 342, r: 15, type: 'sentry', angle: 0, clock: 1, hp: 3 },
    { x: 366, y: 179, r: 12, type: 'dasher', angle: 1, clock: 1.8, hp: 2 },
    { x: 171, y: 340, r: 12, type: 'grunt', angle: 0, clock: 0, hp: 1 },
    { x: 550, y: 491, r: 12, type: 'dasher', angle: -2, clock: 0, hp: 2 }
  ];
  w.shards = [{ x: 411, y: 284, r: 7, life: 8 }, { x: 527, y: 390, r: 7, life: 8 }, { x: 580, y: 430, r: 7, life: 8 }];
  w.bullets = [{ x: 527, y: 317, vx: 560, vy: -270, r: 3, life: 1 }, { x: 563, y: 300, vx: 560, vy: -270, r: 3, life: 1 }];
  w.orbs = [{ x: 670, y: 333, r: 6, life: 2 }]; burst(w, 580, 284, C.palette.magenta, 25);
  state = shot === 'start' ? 'START' : shot === 'gameover' ? 'GAME_OVER' : 'PLAY';
  if (state === 'GAME_OVER') w.lives = 0;
  render(ctx, w, state, false); window.__shotReady = true;
} else {
  let previous = performance.now(), accumulator = 0;
  function frame(now) {
    accumulator += Math.min(0.1, (now - previous) / 1000); previous = now;
    while (accumulator >= C.step) { update(C.step); accumulator -= C.step; }
    render(ctx, w, state, paused); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
