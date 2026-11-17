import { C } from './config.js';
export function drawText(ctx, label, x, y, size = 12, color = C.palette.muted, align = 'left') {
  label = String(label).toUpperCase();
  ctx.save(); ctx.shadowColor = '#020612'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.fillStyle = color; ctx.font = `${size >= 26 ? '700' : '500'} ${size}px monospace`; ctx.textAlign = 'left';
  const spacing = size >= 26 ? 2 : .7, width = ctx.measureText(label).width + (label.length - 1) * spacing;
  let cursor = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  for (let i = 0; i < label.length; i++) { ctx.fillText(label[i], cursor, y); cursor += ctx.measureText(label[i]).width + spacing; }
  ctx.restore();
}
const text = drawText;
export function drawHUD(ctx, w, state, paused) {
  const p = C.palette;
  ctx.fillStyle = '#0b1426'; ctx.fillRect(0, 0, 960, 72);
  text(ctx, 'VAULT / 07', 30, 28, 11, p.cyan);
  text(ctx, `SEED ${C.seed}`, 930, 13, 8, p.muted, 'right');
  text(ctx, 'CINDER PROTOCOL', 30, 53, 18, p.white);
  text(ctx, 'SALVAGE', 335, 26); text(ctx, String(w.score).padStart(6, '0'), 335, 54, 25, p.white);
  text(ctx, 'WAVE', 535, 26); text(ctx, String(w.wave).padStart(2, '0'), 535, 54, 25, p.cyan);
  text(ctx, 'CHAIN', 650, 26); text(ctx, `×${w.combo}`, 650, 54, 25, p.amber);
  text(ctx, 'CORE INTEGRITY', 785, 26);
  for (let i = 0; i < C.lives; i++) { ctx.fillStyle = i < w.lives ? p.magenta : '#263147'; ctx.fillRect(786 + i * 34, 41, 25, 9); }
  ctx.fillStyle = '#17273a'; ctx.fillRect(30, 70, 900, 3); ctx.fillStyle = p.cyan;
  ctx.fillRect(30, 70, 900 * Math.max(0, 1 - (w.enemies.length + (w.spawnLeft || 0)) / (w.waveTotal || 1)), 3);
  ctx.fillStyle = p.amber; ctx.fillRect(650, 61, 90 * Math.max(0, w.comboTime / 3), 2);
  for (let i = 0; i < (state === 'START' || state === 'GAME_OVER' ? 0 : 4); i++) {
    const value = i === 0 ? w.overdrive : i === 1 ? w.aegis : i === 2 ? w.pierce : Math.max(0, 2.5 - w.player.dash);
    const color = i === 0 ? p.amber : i === 2 ? p.magenta : p.cyan, x = 47 + i * 146;
    ctx.fillStyle = '#081323e8'; ctx.fillRect(x - 18, 525, 137, 30);
    ctx.strokeStyle = value > 0 ? color : '#293d50'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 540, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, value / (i === 3 ? 2.5 : i === 1 ? 1 : 8))); ctx.stroke();
    text(ctx, i === 0 ? 'OVERDRIVE' : i === 1 ? 'AEGIS' : i === 2 ? 'PIERCE' : 'DASH / SHIFT', x + 16, 538, 9, value ? color : p.muted);
    text(ctx, i === 1 ? (value ? 'ARMED' : 'OFFLINE') : i === 3 ? (w.player.dash ? w.player.dash.toFixed(1) + 'S' : 'READY') : value.toFixed(1) + 'S', x + 16, 550, 8);
  }
  for (const e of w.enemies) if (e.type === 'boss') {
    ctx.fillStyle = '#0a0e1eef'; ctx.fillRect(285, 91, 390, 48);
    text(ctx, 'VAULT KEEPER / OMEGA SECURITY', 480, 108, 11, p.magenta, 'center');
    ctx.fillStyle = '#382034'; ctx.fillRect(300, 120, 360, 6); ctx.fillStyle = p.magenta; ctx.fillRect(300, 120, 360 * e.hp / e.maxHp, 6);
  }
  text(ctx, paused ? 'CONTAINMENT FIELD / STANDBY' : 'CONTAINMENT FIELD ACTIVE', 33, 589, 10);
  text(ctx, `HOSTILES ${w.enemies.length + (w.spawnLeft || 0)}  /  COLLECT THE AMBER SHARDS`, 926, 589, 10, p.muted, 'right');
  if (state === 'PLAY' && w.banner > 0) {
    text(ctx, `SECTOR ${String(w.wave).padStart(2, '0')} / BREACH DETECTED`, 480, 112, 15, p.amber, 'center');
  }
  if (state === 'WAVE_CLEAR') {
    panel(ctx, 'SECTOR SECURED', `+${w.cleared} CLEAR BONUS · NEXT BREACH INCOMING`, p.cyan);
  }
  if (state === 'START') {
    ctx.fillStyle = '#050b1938'; ctx.fillRect(31, 88, 898, 478);
    text(ctx, 'CINDER SYSTEMS   /   CONTAINMENT DIVISION', 480, 144, 11, p.white, 'center');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = p.cyan; ctx.shadowBlur = 22;
    text(ctx, 'C I N D E R', 480, 226, 69, p.cyan, 'center');
    text(ctx, 'P R O T O C O L', 480, 285, 44, p.cyan, 'center'); ctx.restore();
    ctx.strokeStyle = '#55f5ee88'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(254, 304); ctx.lineTo(706, 304); ctx.stroke();
    text(ctx, 'N E O N   V A U L T', 480, 335, 21, p.amber, 'center');
    ctx.fillStyle = '#071724ef'; ctx.fillRect(263, 451, 434, 43); ctx.strokeStyle = p.cyan; ctx.strokeRect(263, 451, 434, 43);
    text(ctx, 'PRESS ENTER / CLICK TO INITIALIZE', 480, 478, 15, p.cyan, 'center');
    text(ctx, 'WASD MOVE   /   MOUSE FIRE   /   SHIFT DASH   /   P PAUSE', 480, 516, 10, p.white, 'center');
    text(ctx, 'SURVIVE THE BREACH. CLAIM THE VAULT.', 480, 546, 9, p.amber, 'center');
  }
  if (state === 'GAME_OVER') {
    shade(ctx); text(ctx, 'SIGNAL LOST / CORE FAILURE', 480, 205, 13, p.magenta, 'center');
    text(ctx, 'CINDER PROTOCOL', 480, 155, 22, p.muted, 'center');
    text(ctx, 'VAULT BREACHED', 480, 267, 48, p.white, 'center');
    text(ctx, `${String(w.score).padStart(6, '0')} SALVAGE  /  ${w.wave} SECTORS REACHED`, 480, 316, 18, p.amber, 'center');
    text(ctx, `LONGEST CHAIN / ${w.bestChain || w.chain || 0}`, 480, 345, 13, p.white, 'center');
    ctx.globalAlpha = .65 + .35 * Math.cos((w.uiTime || w.time) * 3); text(ctx, 'PRESS R TO REBOOT', 480, 382, 17, p.cyan, 'center'); ctx.globalAlpha = 1;
    text(ctx, `PERSONAL BEST / ${String(Math.max(w.high, w.score)).padStart(6, '0')}`, 480, 417, 12, p.amber, 'center');
    text(ctx, 'NEON VAULT / WASD MOVE · MOUSE FIRE · SHIFT DASH', 480, 461, 10, p.muted, 'center');
  }
  if (paused) { shade(ctx); panel(ctx, 'PROTOCOL PAUSED', 'P TO RESUME', p.cyan); }
}
function shade(ctx) { ctx.fillStyle = '#050b19ad'; ctx.fillRect(31, 87, 898, 479); ctx.fillStyle = '#081221cf'; ctx.fillRect(168, 174, 624, 310); ctx.strokeStyle = '#44516b'; ctx.lineWidth = 1; ctx.strokeRect(168, 174, 624, 310); }
function panel(ctx, title, sub, color) {
  ctx.fillStyle = '#0a1429ed'; ctx.fillRect(220, 244, 520, 110);
  ctx.strokeStyle = color; ctx.strokeRect(220, 244, 520, 110);
  text(ctx, title, 480, 291, 30, color, 'center'); text(ctx, sub, 480, 324, 12, C.palette.white, 'center');
}
