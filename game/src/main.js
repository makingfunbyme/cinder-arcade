import { C } from './config.js';
import { createInput } from './input.js';
import { createWorld, nextWave, updateWorld, moveBody, blocked, burst, compact, enemy } from './world.js';
import { fire, moveProjectiles } from './weapon.js';
import { render } from './render.js';

const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const input = createInput(canvas);
let w = createWorld(), state = 'START', paused = false, clearTime = 0;
function begin() { w = createWorld(); nextWave(w); state = 'PLAY'; paused = false; }
function touch(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r; }
function hurt() {
  if (w.player.invincible > 0) return;
  if (w.aegis) { w.aegis = 0; w.player.invincible = 1; burst(w, w.player.x, w.player.y, C.palette.cyan, 30); return; }
  w.lives--; w.player.invincible = 1.6; w.shake = 9; w.combo = 1; w.chain = 0;
  burst(w, w.player.x, w.player.y, C.palette.cyan, 24);
  if (w.lives <= 0) { state = 'GAME_OVER'; w.high = Math.max(w.high, w.score); try { localStorage.setItem('cinder-best', String(w.high)); } catch {} burst(w, w.player.x, w.player.y, C.palette.magenta, 45); }
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
  const p = w.player;
  if ((k.has('ShiftLeft') || k.has('ShiftRight') || k.has('Space')) && p.dash <= 0) {
    p.dash = C.dashCooldown; p.dashTime = C.dashDuration; p.invincible = .3;
    p.dashX = dx ? dx / length : dy ? 0 : Math.cos(p.angle); p.dashY = dy ? dy / length : dx ? 0 : Math.sin(p.angle);
  }
  moveBody(p, (p.dashTime > 0 ? p.dashX * 900 : dx / length * C.playerSpeed) * dt, (p.dashTime > 0 ? p.dashY * 900 : dy / length * C.playerSpeed) * dt);
  fire(w, input.mouse, dt, input.mouse.down); moveProjectiles(w, dt);
  for (const b of w.bullets) {
    if (blocked(b)) b.life = 0;
    if (b.life <= 0) continue;
    for (const e of w.enemies) {
      if (e.hp <= 0 || !touch(b, e) || (b.hit && b.hit.includes(e))) continue;
      if (b.hit) b.hit.push(e);
      b.hits = (b.hits || 1) - 1; if (b.hits <= 0) b.life = 0;
      e.hp--; e.flash = .09; burst(w, b.x, b.y, C.palette.amber, 4);
      if (e.hp <= 0) {
        w.chain++; w.bestChain = Math.max(w.bestChain || 0, w.chain); w.combo = Math.min(5, 1 + Math.floor(w.chain / 4)); w.comboTime = 3;
        w.score += (e.type === 'sentry' ? 180 : e.type === 'dasher' ? 130 : 100) * w.combo;
        w.shards.push({ x: e.x, y: e.y, r: 7, life: 12 }); burst(w, e.x, e.y, C.palette.magenta); w.shake = 2;
        if (w.rng() < .25) w.pickups.push({ x: e.x, y: e.y, r: 14, life: 16, type: Math.floor(w.rng() * 3) });
        if (e.type === 'boss') { w.score += 10000 * w.combo; w.lives = C.lives; w.shake = 12; burst(w, e.x, e.y, C.palette.amber, 90); }
      }
      break;
    }
  }
  let living = 0; for (const e of w.enemies) if (e.hp > 0) w.enemies[living++] = e; w.enemies.length = living;
  for (const e of w.enemies) if (touch(e, w.player)) hurt();
  for (const b of w.orbs) {
    if (blocked(b)) b.life = 0;
    if (b.life > 0 && touch(b, w.player)) { b.life = 0; hurt(); }
  }
  for (const s of w.shards) if (touch(s, w.player)) { s.life = 0; w.score += 40 * w.combo; burst(w, s.x, s.y, C.palette.amber, 6); }
  for (const p of w.pickups) if (p.life > 0 && touch(p, w.player)) { p.life = 0; if (p.type === 0) w.overdrive = 8; else if (p.type === 1) w.aegis = 1; else w.pierce = 8; burst(w, p.x, p.y, C.palette.cyan, 20); }
  compact(w.shards); compact(w.bullets); compact(w.orbs); compact(w.pickups);
  if (state === 'PLAY' && w.spawnLeft === 0 && w.enemies.length === 0) {
    state = 'WAVE_CLEAR'; clearTime = 2.4; w.cleared = 500 * w.wave * w.combo; w.score += w.cleared; w.orbs.length = 0;
    if (w.wave % 3 === 0) w.lives = Math.min(C.lives, w.lives + 1);
  }
  if (state === 'WAVE_CLEAR') { clearTime -= dt; if (clearTime <= 0) { nextWave(w); state = 'PLAY'; } }
}

// Capture mode is a seeded, static tableau and never advances on wall-clock time.
const shot = new URLSearchParams(location.search).get('shot');
if (['start', 'play', 'gameover', 'wave', 'boss'].includes(shot)) {
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
  w.waveTotal = 24; w.comboTime = 2.4; w.overdrive = 6.2; w.pierce = 4.8; w.aegis = 1; w.high = 32750;
  enemy(w, 'warden', 690, 442); enemy(w, 'spark', 365, 419); enemy(w, 'spark', 345, 438); enemy(w, 'spark', 327, 419);
  w.pickups.push({ x: 615, y: 385, r: 14, type: 0, life: 12 }, { x: 206, y: 278, r: 14, type: 1, life: 12 }, { x: 778, y: 222, r: 14, type: 2, life: 12 });
  w.muzzle = .1; w.player.dashTime = .12; w.player.dash = 1.8; w.bestChain = 24;
  for (let i = 0; i < 12; i += 2) { w.player.trail[i] = w.player.x - i * 9; w.player.trail[i + 1] = w.player.y + i * 3; }
  w.rings[0].life = .32;
  for (const p of w.particles) { p.x += p.vx * .24; p.y += p.vy * .24; }
  if (shot === 'start') {
    w.player.x = 480; w.player.y = 407; w.player.angle = -.55;
    w.enemies[0].x = 803; w.enemies[0].y = 166;
    w.enemies[2].x = 169; w.enemies[2].y = 195;
    w.enemies[3].x = 141; w.enemies[3].y = 430;
    w.enemies[4].x = 795; w.enemies[4].y = 480;
    w.enemies[5].x = 816; w.enemies[5].y = 393;
    w.enemies.length = 6;
    w.pickups.length = 0;
    for (let i = 0; i < 12; i += 2) { w.player.trail[i] = 480 - i * 8; w.player.trail[i + 1] = 407 + i * 2; }
    for (let i = 0; i < 14; i++) w.shards.push({ x: 120 + i * 53, y: 361 + Math.sin(i * 2) * 61, r: 7, life: 8 });
  }
  if (shot === 'wave') {
    state = 'WAVE_CLEAR'; w.cleared = 6000; w.enemies.length = 0; w.spawnLeft = 0; w.orbs.length = 0;
    w.rings.push({ x: 468, y: 345, life: .13, color: C.palette.cyan });
    for (let i = 0; i < 22; i++) { const a = i * 2.4, d = 70 + i * 9; w.shards.push({ x: 468 + Math.cos(a) * d, y: 345 + Math.sin(a) * d * .62, r: 7, life: 8 }); }
  }
  if (shot === 'gameover') {
    w.score = 32750; w.wave = 8; w.bestChain = 32; w.pickups.length = 0;
    burst(w, 480, 390, C.palette.amber, 65);
    for (const p of w.particles) { p.x += p.vx * 1.5; p.y += p.vy * .9; }
  }
  if (shot === 'boss') { w.wave = 5; w.spawnLeft = 0; const boss = enemy(w, 'boss', 530, 236); boss.hp = 104; boss.clock = 3.8; boss.dashAngle = 1.8; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; w.orbs.push({ x: 530 + Math.cos(a) * 125, y: 236 + Math.sin(a) * 125, vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, r: 5, life: 3 }); } }
  for (const e of w.enemies) { if (!e.trail) e.trail = new Float32Array(12); for (let i = 0; i < 12; i += 2) { e.trail[i] = e.x - Math.cos(e.angle) * i * 3; e.trail[i + 1] = e.y - Math.sin(e.angle) * i * 3; } }
  for (const b of w.bullets) { b.trail = new Float32Array(8); for (let i = 0; i < 8; i += 2) { b.trail[i] = b.x - b.vx * i * .009; b.trail[i + 1] = b.y - b.vy * i * .009; } }
  render(ctx, w, state, false); window.__shotReady = true;
} else {
  let previous = performance.now(), accumulator = 0;
  function frame(now) {
    w.uiTime = now / 1000;
    accumulator += Math.min(0.1, (now - previous) / 1000); previous = now;
    while (accumulator >= C.step) { update(C.step); accumulator -= C.step; }
    render(ctx, w, state, paused); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
