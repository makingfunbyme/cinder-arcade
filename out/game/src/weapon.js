import { C } from './config.js';
import { remember } from './world.js';
export function fire(world, aim, dt, trigger) {
  const p = world.player;
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
  if (!trigger || p.cooldown > 0) return;
  p.cooldown = C.fireRate / (world.overdrive > 0 ? 2 : 1);
  const dx = Math.cos(p.angle), dy = Math.sin(p.angle);
  world.bullets.push({ x: p.x + dx * 19, y: p.y + dy * 19, vx: dx * C.bulletSpeed, vy: dy * C.bulletSpeed, r: 3, life: 1.2, hits: world.pierce > 0 ? 3 : 1, hit: [], trail: new Float32Array(8) });
  world.muzzle = 0.075; // A brief flare keeps rapid shots readable against the vault grid.
}
export function moveProjectiles(world, dt) {
  moveList(world.bullets, dt); moveList(world.orbs, dt);
}
function moveList(list, dt) {
  for (const b of list) {
    remember(b);
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 26 || b.x > 934 || b.y < 78 || b.y > 570) b.life = 0;
  }
}
