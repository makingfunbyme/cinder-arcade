import { C } from './config.js';
export function text(ctx, label, x, y, size = 12, color = C.palette.muted, align = 'left') {
  ctx.fillStyle = color; ctx.font = `${size >= 26 ? '700' : '500'} ${size}px monospace`; ctx.textAlign = align; ctx.fillText(label, x, y);
}
export function drawHUD(ctx, w, state, paused) {
  const p = C.palette;
  ctx.fillStyle = '#0b1426'; ctx.fillRect(0, 0, 960, 72);
  text(ctx, 'VAULT / 07', 30, 28, 11, p.cyan);
  text(ctx, 'CINDER PROTOCOL', 30, 53, 18, p.white);
  text(ctx, 'SALVAGE', 335, 26); text(ctx, String(w.score).padStart(6, '0'), 335, 54, 25, p.white);
  text(ctx, 'WAVE', 535, 26); text(ctx, String(w.wave).padStart(2, '0'), 535, 54, 25, p.cyan);
  text(ctx, 'CHAIN', 650, 26); text(ctx, `×${w.combo}`, 650, 54, 25, p.amber);
  text(ctx, 'CORE INTEGRITY', 785, 26);
  for (let i = 0; i < C.lives; i++) { ctx.fillStyle = i < w.lives ? p.magenta : '#263147'; ctx.fillRect(786 + i * 34, 41, 25, 9); }
  text(ctx, paused ? 'CONTAINMENT FIELD / STANDBY' : 'CONTAINMENT FIELD ACTIVE', 33, 589, 10);
  text(ctx, `HOSTILES ${w.enemies.length + (w.spawnLeft || 0)}  /  COLLECT THE AMBER SHARDS`, 926, 589, 10, p.muted, 'right');
  if (state === 'PLAY' && w.banner > 0) {
    text(ctx, `SECTOR ${String(w.wave).padStart(2, '0')} / BREACH DETECTED`, 480, 112, 15, p.amber, 'center');
  }
  if (state === 'WAVE_CLEAR') {
    panel(ctx, 'SECTOR SECURED', `+${w.cleared} CLEAR BONUS · NEXT BREACH INCOMING`, p.cyan);
  }
  if (state === 'START') {
    shade(ctx); text(ctx, 'A CINDER SYSTEMS SURVIVAL EXPERIMENT', 480, 194, 12, p.cyan, 'center');
    text(ctx, 'NEON VAULT', 480, 262, 64, p.white, 'center');
    text(ctx, 'Break the breach. Collect the energy. Stay alive.', 480, 302, 15, p.muted, 'center');
    ctx.strokeStyle = p.cyan; ctx.strokeRect(338, 338, 284, 48);
    text(ctx, 'ENTER / CLICK TO INITIALIZE', 480, 368, 14, p.cyan, 'center');
    text(ctx, 'MOVE  WASD     AIM  MOUSE     FIRE  HOLD CLICK', 480, 428, 12, p.white, 'center');
    text(ctx, 'CHAIN KILLS FOR MULTIPLIERS · PILLARS BLOCK PROJECTILES', 480, 454, 11, p.muted, 'center');
  }
  if (state === 'GAME_OVER') {
    shade(ctx); text(ctx, 'SIGNAL LOST / CORE FAILURE', 480, 205, 13, p.magenta, 'center');
    text(ctx, 'VAULT SEALED', 480, 267, 52, p.white, 'center');
    text(ctx, `${String(w.score).padStart(6, '0')} SALVAGE  /  ${w.wave} SECTORS REACHED`, 480, 316, 18, p.amber, 'center');
    text(ctx, 'PRESS R TO REBOOT', 480, 382, 17, p.cyan, 'center');
    text(ctx, 'SAME SEED. A NEW CHANCE.', 480, 417, 11, p.muted, 'center');
  }
  if (paused) { shade(ctx); panel(ctx, 'PROTOCOL PAUSED', 'P TO RESUME', p.cyan); }
}
function shade(ctx) { ctx.fillStyle = '#050b19de'; ctx.fillRect(0, 73, 960, 500); }
function panel(ctx, title, sub, color) {
  ctx.fillStyle = '#0a1429ed'; ctx.fillRect(220, 244, 520, 110);
  ctx.strokeStyle = color; ctx.strokeRect(220, 244, 520, 110);
  text(ctx, title, 480, 291, 30, color, 'center'); text(ctx, sub, 480, 324, 12, C.palette.white, 'center');
}
