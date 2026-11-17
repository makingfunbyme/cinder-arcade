import { C, pillars } from './config.js';
import { mulberry32 } from './random.js';
export function circleRect(c, rect) {
  const x = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
  const y = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
  return (c.x - x) ** 2 + (c.y - y) ** 2 < c.r ** 2;
}
export function blocked(c) { for (let i = 0; i < pillars.length; i++) if (circleRect(c, pillars[i])) return true; return false; }
export function moveBody(body, dx, dy) {
  const x = body.x; body.x = Math.max(30 + body.r, Math.min(930 - body.r, body.x + dx));
  if (blocked(body)) body.x = x;
  const y = body.y; body.y = Math.max(88 + body.r, Math.min(566 - body.r, body.y + dy));
  if (blocked(body)) body.y = y;
}
export function createWorld() {
  let high = 0; try { high = Number(localStorage.getItem('cinder-best')) || 0; } catch {}
  return { rng: mulberry32(C.seed), player: { x: 480, y: 330, r: 12, angle: -Math.PI / 2, cooldown: 0, invincible: 1.5, dash: 0, dashTime: 0, trail: new Float32Array(12) }, high, overdrive: 0, pierce: 0, aegis: 0, pickups: [], rings: [], enemies: [], bullets: [], orbs: [], shards: [], particles: [], wave: 0, score: 0, lives: C.lives, combo: 1, chain: 0, comboTime: 0, time: 0, shake: 0, muzzle: 0, banner: 0, cleared: 0 };
}
export function remember(e) {
  if (!e.trail) return;
  for (let i = e.trail.length - 1; i >= 2; i--) e.trail[i] = e.trail[i - 2];
  e.trail[0] = e.x; e.trail[1] = e.y;
}
export function enemy(w, type, x, y) {
  const hp = type === 'boss' ? 100 + w.wave * 8 : type === 'warden' ? 7 : type === 'sentry' ? 3 : type === 'dasher' ? 2 : 1;
  const e = { x, y, type, hp, maxHp: hp, r: type === 'boss' ? 42 : type === 'warden' ? 21 : type === 'spark' ? 7 : 14, clock: 0, angle: 0, flash: 0, phase: 0, dashAngle: 0, trail: new Float32Array(12) };
  e.trail.fill(0); w.enemies.push(e); return e;
}
export function compact(a) { let n = 0; for (let i = 0; i < a.length; i++) if (a[i].life > 0) a[n++] = a[i]; a.length = n; }
function orb(w, e, a, speed = 155) { if (w.orbs.length < 240) w.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 5, life: 6, trail: new Float32Array(8) }); }
export function nextWave(w) {
  w.wave++; w.banner = 2.5; w.spawnLeft = C.waveBase + w.wave * C.waveGrowth; w.spawnClock = 0.3;
  if (w.wave % 5 === 0) { w.spawnLeft = 0; enemy(w, 'boss', 480, 180); }
  w.waveTotal = w.spawnLeft || 1;
}
export function burst(w, x, y, color, count = 15) {
  if (count >= 15) w.rings.push({ x, y, life: 0.65, color });
  for (let i = 0; i < count && w.particles.length < C.particleCap; i++) {
    const a = w.rng() * Math.PI * 2, speed = 35 + w.rng() * 150;
    w.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.3 + w.rng() * 0.5, color });
  }
}
export function updateWorld(w, dt) {
  w.time += dt; w.banner = Math.max(0, w.banner - dt); w.shake = Math.max(0, w.shake - dt * 24); w.muzzle = Math.max(0, w.muzzle - dt);
  w.player.invincible = Math.max(0, w.player.invincible - dt);
  w.player.dash = Math.max(0, w.player.dash - dt); w.player.dashTime = Math.max(0, w.player.dashTime - dt);
  w.overdrive = Math.max(0, w.overdrive - dt); w.pierce = Math.max(0, w.pierce - dt);
  remember(w.player);
  for (const r of w.rings) r.life -= dt; compact(w.rings);
  for (const p of w.pickups) p.life -= dt; compact(w.pickups);
  w.comboTime -= dt;
  if (w.comboTime <= 0) { w.combo = 1; w.chain = 0; }
  if (w.spawnLeft > 0) {
    w.spawnClock -= dt;
    if (w.spawnClock <= 0) {
      const side = Math.floor(w.rng() * 4), t = w.rng();
      const roll = w.rng(), type = roll < .22 ? 'spark' : roll < .38 ? 'warden' : roll < .58 ? 'sentry' : roll < .78 ? 'dasher' : 'grunt';
      const x = side < 2 ? (side === 0 ? 48 : 912) : 60 + t * 840, y = side >= 2 ? (side === 2 ? 108 : 546) : 110 + t * 430;
      enemy(w, type, x, y);
      if (type === 'spark') for (let i = 1; i < 4; i++) enemy(w, type, Math.min(915, x + i * 13), Math.min(548, y + i * 9));
      w.spawnLeft--; w.spawnClock = Math.max(0.22, 0.8 - w.wave * 0.035);
    }
  }
  for (const e of w.enemies) {
    remember(e); e.flash = Math.max(0, (e.flash || 0) - dt);
    e.clock += dt;
    const dx = w.player.x - e.x, dy = w.player.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    let vx = dx / d, vy = dy / d, speed = 65 * (1 + w.wave * C.difficultyRamp);
    if (e.type === 'spark') speed *= 2.1;
    if (e.type === 'warden') { speed *= .42; if (e.clock > 2.5) { e.clock = 0; for (let i = -1; i <= 1; i++) orb(w, e, e.angle + i * .22); } }
    if (e.type === 'boss') {
      speed = 28; const phase = e.clock % 6;
      if (phase < 3 && Math.floor(e.clock * 2) !== e.phase) { e.phase = Math.floor(e.clock * 2); for (let i = 0; i < 12; i++) orb(w, e, i * Math.PI / 6 + e.clock * .35, 125); }
      if (phase >= 3 && phase < 4.2) { speed = 0; e.dashAngle = e.angle; }
      if (phase >= 4.2 && phase < 4.8) { speed = 510; vx = Math.cos(e.dashAngle); vy = Math.sin(e.dashAngle); }
    }
    if (e.type === 'dasher') { const phase = e.clock % 2.4; speed *= phase > 1.7 ? 3.8 : 0.6; }
    if (e.type === 'sentry') {
      const radial = d > 250 ? 0.65 : d < 180 ? -0.65 : 0;
      vx = dx / d * radial - dy / d * 0.7; vy = dy / d * radial + dx / d * 0.7;
      if (e.clock > 2.2) { e.clock = 0; w.orbs.push({ x: e.x, y: e.y, vx: dx / d * 145, vy: dy / d * 145, r: 6, life: 5 }); }
    }
    moveBody(e, vx * speed * dt, vy * speed * dt);
  }
  for (const p of w.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  compact(w.particles);
  for (const s of w.shards) {
    s.life -= dt; const dx = w.player.x - s.x, dy = w.player.y - s.y, d = Math.hypot(dx, dy);
    if (d < 105 && d > 0) { s.x += dx / d * 220 * dt; s.y += dy / d * 220 * dt; }
  }
}
