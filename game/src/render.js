import { C, pillars } from './config.js';
import { drawHUD } from './hud.js';
const P = C.palette;
export function render(ctx, w, state, paused) {
  ctx.clearRect(0, 0, 960, 600); ctx.fillStyle = P.navy; ctx.fillRect(0, 0, 960, 600);
  ctx.save();
  ctx.translate(Math.sin(w.time * 113) * w.shake, Math.cos(w.time * 97) * w.shake);
  ctx.strokeStyle = '#142238'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 960; x += 40) { ctx.moveTo(x, 80); ctx.lineTo(x, 570); }
  for (let y = 90; y <= 570; y += 40) { ctx.moveTo(30, y); ctx.lineTo(930, y); }
  ctx.stroke();
  ctx.strokeStyle = '#245468'; ctx.strokeRect(29, 86, 902, 481);
  for (const [i, r] of pillars.entries()) {
    ctx.fillStyle = '#0d1a2c'; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#30445d'; ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#192c42'; ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
    ctx.shadowColor = P.cyan; ctx.shadowBlur = 10; ctx.fillStyle = P.cyan;
    ctx.fillRect(r.x + 14, r.y, r.w - 28, 2); ctx.shadowBlur = 0;
    ctx.fillStyle = '#668399'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(`0${i + 1}`, r.x + r.w / 2, r.y + 44);
  }
  for (const s of w.shards) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(w.time * 2); glow(ctx, P.amber, 12); polygon(ctx, 4, 6, Math.PI / 4); ctx.fill(); ctx.restore();
  }
  for (const b of w.bullets) {
    glow(ctx, P.cyan, 13); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); ctx.stroke();
  }
  for (const b of w.orbs) { glow(ctx, P.magenta, 14); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
  for (const e of w.enemies) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.type === 'sentry' ? w.time : e.angle);
    glow(ctx, e.type === 'dasher' ? P.amber : P.magenta, 12); ctx.lineWidth = 2;
    polygon(ctx, e.type === 'sentry' ? 6 : e.type === 'dasher' ? 3 : 4, e.r, 0);
    ctx.fillStyle = '#241527'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = e.type === 'dasher' ? P.amber : P.magenta; ctx.fillRect(-3, -3, 6, 6);
    if (e.type === 'dasher' && e.clock % 2.4 > 1.35) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(85, 0); ctx.stroke(); }
    ctx.restore();
  }
  const p = w.player;
  if (w.lives > 0) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = p.invincible > 0 ? 0.65 + 0.35 * Math.sin(w.time * 30) : 1;
    glow(ctx, P.cyan, 18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(-12, -12); ctx.lineTo(-7, 0); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fillStyle = '#123648'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.white; ctx.fillRect(0, -2, 8, 4);
    if (w.muzzle > 0) { ctx.fillStyle = P.white; ctx.beginPath(); ctx.arc(24, 0, 6, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  for (const p of w.particles) { ctx.globalAlpha = Math.min(1, p.life * 2); glow(ctx, p.color, 8); ctx.fillRect(p.x, p.y, 3, 3); }
  ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  const vignette = ctx.createRadialGradient(480, 320, 180, 480, 320, 550); vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#020610bb'); ctx.fillStyle = vignette; ctx.fillRect(0, 73, 960, 500);
  drawHUD(ctx, w, state, paused);
}
function glow(ctx, color, blur) { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; }
function polygon(ctx, sides, r, offset) { ctx.beginPath(); for (let i = 0; i < sides; i++) { const a = i * Math.PI * 2 / sides + offset; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); }
