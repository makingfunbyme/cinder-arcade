import { C, pillars } from './config.js';
import { drawHUD, drawText } from './hud.js';
const P = C.palette;
const crt = document.createElement('canvas'); crt.width = 960; crt.height = 600;
const scan = crt.getContext('2d'); scan.fillStyle = '#00000024';
for (let y = 0; y < 600; y += 3) scan.fillRect(0, y, 960, 1);
let vignette, horizon, titleGlow;
const enemyColors = { grunt: '#c5fbff', dasher: '#ff528c', sentry: '#ffc46b', spark: '#c1ffad', warden: '#b497ff', boss: '#b497ff' };
function trail(ctx, e, color, width = 2) {
  if (!e.trail) return;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  for (let i = 0; i < e.trail.length - 2; i += 2) {
    if (!e.trail[i + 2]) continue;
    ctx.globalAlpha = .35 * (1 - i / e.trail.length); ctx.beginPath(); ctx.moveTo(e.trail[i], e.trail[i + 1]); ctx.lineTo(e.trail[i + 2], e.trail[i + 3]); ctx.stroke();
  } ctx.globalAlpha = 1;
}
export function render(ctx, w, state, paused) {
  ctx.clearRect(0, 0, 960, 600); ctx.fillStyle = P.navy; ctx.fillRect(0, 0, 960, 600);
  if (!horizon) {
    horizon = ctx.createLinearGradient(0, 85, 0, 568); horizon.addColorStop(0, '#101830'); horizon.addColorStop(.5, '#112936'); horizon.addColorStop(1, '#070d1d');
    titleGlow = ctx.createRadialGradient(480, 245, 20, 480, 245, 310); titleGlow.addColorStop(0, '#29cbc426'); titleGlow.addColorStop(1, '#29cbc400');
  }
  ctx.fillStyle = horizon; ctx.fillRect(30, 86, 900, 481);
  for (let i = 0; i < 80; i++) {
    const layer = i % 3 + 1, x = 36 + (i * 137.37 + w.time * layer * 1.4) % 884, y = 95 + (i * 73.91) % 460;
    ctx.fillStyle = i % 5 === 0 ? '#ffc46b66' : '#97c7dd26'; ctx.fillRect(x, y, layer === 3 ? 2 : 1, layer === 3 ? 2 : 1);
  }
  if (state === 'START') {
    ctx.fillStyle = titleGlow; ctx.fillRect(100, 88, 760, 470);
    ctx.save(); ctx.translate(480, 182); ctx.globalAlpha = .25; ctx.strokeStyle = '#b497ff'; ctx.fillStyle = '#34284b'; ctx.lineWidth = 4;
    polygon(ctx, 6, 110, Math.PI / 6); ctx.fill(); ctx.stroke(); polygon(ctx, 6, 76, 0); ctx.stroke();
    ctx.fillStyle = P.amber; ctx.fillRect(-44, -5, 88, 10); ctx.restore();
  }
  ctx.save();
  ctx.translate(Math.sin(w.time * 113) * w.shake, Math.cos(w.time * 97) * w.shake);
  ctx.strokeStyle = '#142238'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 960; x += 40) { ctx.moveTo(x, 80); ctx.lineTo(x, 570); }
  for (let y = 90 + w.time * 5 % 40; y <= 570; y += 40) { ctx.moveTo(30, y); ctx.lineTo(930, y); }
  ctx.stroke();
  ctx.strokeStyle = '#245468'; ctx.strokeRect(29, 86, 902, 481);
  for (let i = 0; i < 4; i++) {
    const x = i % 2 ? 930 : 30, y = i < 2 ? 87 : 566, sx = i % 2 ? -1 : 1, sy = i < 2 ? 1 : -1;
    ctx.strokeStyle = i % 2 ? P.magenta : P.cyan; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + sy * 48); ctx.lineTo(x, y); ctx.lineTo(x + sx * 90, y); ctx.stroke();
    drawText(ctx, '/// CONTAINMENT / 07', x + sx * 111, y + sy * 18, 8, '#588396', 'center');
  }
  for (const [i, r] of pillars.entries()) {
    ctx.fillStyle = '#0d1a2c'; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#30445d'; ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#192c42'; ctx.fillRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
    ctx.shadowColor = P.cyan; ctx.shadowBlur = 10; ctx.fillStyle = P.cyan;
    ctx.fillRect(r.x + 14, r.y, r.w - 28, 2); ctx.shadowBlur = 0;
    drawText(ctx, `0${i + 1}`, r.x + r.w / 2, r.y + 44, 10, '#668399', 'center');
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const r of w.rings) { ctx.globalAlpha = r.life / .65; ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, 12 + (1 - r.life / .65) * 85, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
  for (const s of w.shards) {
    if (state === 'WAVE_CLEAR') { ctx.strokeStyle = '#ffc46b66'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + (s.x - w.player.x) * .16, s.y + (s.y - w.player.y) * .16); ctx.stroke(); }
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(w.time * 2); glow(ctx, P.amber, 12); polygon(ctx, 4, 6, Math.PI / 4); ctx.fill(); ctx.restore();
  }
  for (const b of w.bullets) {
    trail(ctx, b, P.cyan, 3);
    glow(ctx, P.cyan, 13); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); ctx.stroke();
  }
  for (const b of w.orbs) { trail(ctx, b, P.magenta); glow(ctx, P.magenta, 14); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  for (const item of w.pickups) {
    ctx.save(); ctx.translate(item.x, item.y); const color = item.type === 0 ? P.amber : item.type === 1 ? P.cyan : P.magenta;
    glow(ctx, color, 14); ctx.lineWidth = 1.5; polygon(ctx, 6, 16, Math.PI / 6); ctx.fillStyle = '#0b1829'; ctx.fill(); ctx.stroke();
    drawText(ctx, item.type === 0 ? 'ϟ' : item.type === 1 ? '◇' : '»', 0, 6, 17, color, 'center'); ctx.restore();
  }
  for (const e of w.enemies) {
    ctx.shadowBlur = 0; trail(ctx, e, enemyColors[e.type], e.r * .7);
    if (e.type === 'boss' && e.clock % 6 >= 3 && e.clock % 6 < 4.2) { ctx.save(); ctx.strokeStyle = '#ff526477'; ctx.lineWidth = 34; ctx.setLineDash([8, 12]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dashAngle) * 650, e.y + Math.sin(e.dashAngle) * 650); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.type === 'sentry' ? w.time : e.angle);
    ctx.shadowBlur = 0; ctx.strokeStyle = enemyColors[e.type]; ctx.lineWidth = e.type === 'warden' ? 3 : 2;
    polygon(ctx, e.type === 'boss' || e.type === 'sentry' ? 6 : e.type === 'dasher' || e.type === 'spark' ? 3 : 4, e.r, e.type === 'boss' ? w.time * .4 : 0);
    ctx.fillStyle = e.type === 'warden' ? '#352353' : '#101e2c'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = enemyColors[e.type]; ctx.fillRect(-3, -3, 6, 6);
    if (e.type === 'warden' || e.type === 'boss') { polygon(ctx, 6, e.r * .65, -w.time * .8); ctx.stroke(); ctx.fillStyle = P.amber; ctx.fillRect(-8, -2, 16, 4); }
    if (e.flash > 0) { ctx.fillStyle = '#ffffff'; polygon(ctx, 6, e.r, 0); ctx.fill(); }
    if (e.type === 'dasher' && e.clock % 2.4 > 1.35) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(85, 0); ctx.stroke(); }
    ctx.restore();
  }
  const p = w.player;
  if (w.lives > 0) {
    trail(ctx, p, P.cyan, p.dashTime > 0 ? 21 : 3);
    if (w.aegis) { glow(ctx, P.cyan, 12); ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.stroke(); }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = p.invincible > 0 ? 0.65 + 0.35 * Math.sin(w.time * 30) : 1;
    glow(ctx, P.cyan, 18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(-12, -12); ctx.lineTo(-7, 0); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fillStyle = '#123648'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.white; ctx.fillRect(0, -2, 8, 4);
    if (w.muzzle > 0) { ctx.fillStyle = P.white; ctx.beginPath(); ctx.arc(24, 0, 6, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const p of w.particles) { ctx.globalAlpha = Math.min(1, p.life * 2); glow(ctx, p.color, 8); ctx.fillRect(p.x, p.y, 3, 3); }
  ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  if (!vignette) { vignette = ctx.createRadialGradient(480, 320, 100, 480, 320, 560); vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#020610cc'); } ctx.fillStyle = vignette; ctx.fillRect(0, 73, 960, 500);
  drawHUD(ctx, w, state, paused);
  ctx.drawImage(crt, 0, 0); ctx.fillStyle = '#55f5ee05'; ctx.fillRect(0, w.time * 22 % 650 - 50, 960, 50);
}
function glow(ctx, color, blur) { ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; }
function polygon(ctx, sides, r, offset) { ctx.beginPath(); for (let i = 0; i < sides; i++) { const a = i * Math.PI * 2 / sides + offset; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); }
