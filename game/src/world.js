import { C, pillars } from './config.js';
import { mulberry32 } from './random.js';
export function circleRect(c, rect) {
  const x = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
  const y = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
  return (c.x - x) ** 2 + (c.y - y) ** 2 < c.r ** 2;
}
export function blocked(c) { return pillars.some(rect => circleRect(c, rect)); }
export function moveBody(body, dx, dy) {
  const x = body.x; body.x = Math.max(30 + body.r, Math.min(930 - body.r, body.x + dx));
  if (blocked(body)) body.x = x;
  const y = body.y; body.y = Math.max(88 + body.r, Math.min(566 - body.r, body.y + dy));
  if (blocked(body)) body.y = y;
}
export function createWorld() {
  return { rng: mulberry32(C.seed), player: { x: 480, y: 330, r: 12, angle: -Math.PI / 2, cooldown: 0, invincible: 1.5 }, enemies: [], bullets: [], orbs: [], shards: [], particles: [], wave: 0, score: 0, lives: C.lives, combo: 1, chain: 0, comboTime: 0, time: 0, shake: 0, muzzle: 0, banner: 0, cleared: 0 };
}
export function nextWave(w) {
  w.wave++; w.banner = 2.5; w.spawnLeft = C.waveBase + w.wave * C.waveGrowth; w.spawnClock = 0.3;
}
export function burst(w, x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const a = w.rng() * Math.PI * 2, speed = 35 + w.rng() * 150;
    w.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.3 + w.rng() * 0.5, color });
  }
}
export function updateWorld(w, dt) {
  w.time += dt; w.banner = Math.max(0, w.banner - dt); w.shake = Math.max(0, w.shake - dt * 24); w.muzzle = Math.max(0, w.muzzle - dt);
  w.player.invincible = Math.max(0, w.player.invincible - dt);
  w.comboTime -= dt;
  if (w.comboTime <= 0) { w.combo = 1; w.chain = 0; }
  if (w.spawnLeft > 0) {
    w.spawnClock -= dt;
    if (w.spawnClock <= 0) {
      const side = Math.floor(w.rng() * 4), t = w.rng();
      const type = w.wave >= 2 && w.rng() < 0.3 ? 'sentry' : w.rng() < 0.35 ? 'dasher' : 'grunt';
      w.enemies.push({ x: side < 2 ? (side === 0 ? 48 : 912) : 60 + t * 840, y: side >= 2 ? (side === 2 ? 108 : 546) : 110 + t * 430, r: type === 'sentry' ? 15 : 12, type, hp: type === 'sentry' ? 3 : type === 'dasher' ? 2 : 1, clock: w.rng() * 2, angle: 0 });
      w.spawnLeft--; w.spawnClock = Math.max(0.22, 0.8 - w.wave * 0.035);
    }
  }
  for (const e of w.enemies) {
    e.clock += dt;
    const dx = w.player.x - e.x, dy = w.player.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    let vx = dx / d, vy = dy / d, speed = 65 * (1 + w.wave * C.difficultyRamp);
    if (e.type === 'dasher') { const phase = e.clock % 2.4; speed *= phase > 1.7 ? 3.8 : 0.6; }
    if (e.type === 'sentry') {
      const radial = d > 250 ? 0.65 : d < 180 ? -0.65 : 0;
      vx = dx / d * radial - dy / d * 0.7; vy = dy / d * radial + dx / d * 0.7;
      if (e.clock > 2.2) { e.clock = 0; w.orbs.push({ x: e.x, y: e.y, vx: dx / d * 145, vy: dy / d * 145, r: 6, life: 5 }); }
    }
    moveBody(e, vx * speed * dt, vy * speed * dt);
  }
  for (const p of w.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  w.particles = w.particles.filter(p => p.life > 0);
  for (const s of w.shards) {
    s.life -= dt; const dx = w.player.x - s.x, dy = w.player.y - s.y, d = Math.hypot(dx, dy);
    if (d < 105 && d > 0) { s.x += dx / d * 220 * dt; s.y += dy / d * 220 * dt; }
  }
}
