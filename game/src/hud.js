// HUD and minimap: health, cash, wanted stars, weapon, objective banner and radar.
// Drawn in screen space after the world, so it stays readable at any camera position.
import { WORLD_W, WORLD_H } from './config.js';
import { V_ROADS, H_ROADS } from './world.js';

export function drawMinimap(ctx, state, x, y, size) {
  const s = size / WORLD_W; const sy = size / WORLD_H;
  ctx.save();
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#274b3a'; ctx.fillRect(x, y, size, size * (WORLD_H / WORLD_W));
  ctx.fillStyle = '#2aa7b8'; ctx.fillRect(x, y + 2320 * sy, size, 280 * sy);
  ctx.strokeStyle = '#565b63'; ctx.lineWidth = 5;
  for (const rx of V_ROADS) { ctx.beginPath(); ctx.moveTo(x + rx * s, y); ctx.lineTo(x + rx * s, y + size); ctx.stroke(); }
  for (const ry of H_ROADS) { ctx.beginPath(); ctx.moveTo(x, y + ry * sy); ctx.lineTo(x + size, y + ry * sy); ctx.stroke(); }
  // Objective blip pulses gold.
  if (state.objective) {
    ctx.fillStyle = '#ffd21f';
    ctx.beginPath(); ctx.arc(x + state.objective.x * s, y + state.objective.y * sy, 4 + Math.sin(state.time * 6) * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const c of state.cars) {
    if (c.police) { ctx.fillStyle = (Math.floor(state.time * 3) % 2) ? '#ff4040' : '#4080ff'; ctx.fillRect(x + c.x * s - 2, y + c.y * sy - 2, 4, 4); }
    else if (c.mission) { ctx.fillStyle = '#ff5d73'; ctx.fillRect(x + c.x * s - 2, y + c.y * sy - 2, 4, 4); }
  }
  for (const chip of state.chips) if (!chip.taken) { ctx.fillStyle = '#37d6e0'; ctx.fillRect(x + chip.x * s - 1.5, y + chip.y * sy - 1.5, 3, 3); }
  // Player arrow.
  const px = x + state.player.x * s; const py = y + state.player.y * sy;
  ctx.translate(px, py); ctx.rotate(state.player.angle + Math.PI / 2);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.stroke();
}
export function drawHud(ctx, state, w, h) {
  const p = state.player;
  // Top-left: cash and health.
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(10,14,20,0.55)'; ctx.fillRect(14, 12, 232, 64);
  ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('$' + state.money.toLocaleString(), 24, 18);
  ctx.fillStyle = '#3a3f47'; ctx.fillRect(24, 50, 180, 13);
  ctx.fillStyle = p.health > 30 ? '#ff5d73' : '#ff2222'; ctx.fillRect(24, 50, 180 * Math.max(0, p.health) / 100, 13);
  ctx.fillStyle = '#fff'; ctx.font = '12px system-ui, sans-serif'; ctx.fillText('HEALTH', 24, 51);
  if (p.car) { ctx.fillStyle = '#3a3f47'; ctx.fillRect(24, 66 - 16 + 16, 1, 1); }
  // Top-right: wanted stars.
  ctx.textAlign = 'right'; ctx.font = '30px system-ui, sans-serif';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < state.wanted ? (Math.floor(state.time * 4) % 2 && state.wanted >= 4 ? '#ff4040' : '#ffd21f') : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', w - 18 - (4 - i) * 30, 14);
  }
  ctx.font = '14px system-ui, sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText(p.weaponName + (p.ammo === Infinity ? '' : '  ' + p.ammo), w - 18, 52);
  ctx.fillText(state.chipsFound + ' / 10 chips', w - 18, 72);
  // Bottom centre: objective banner.
  if (state.objectiveText) {
    ctx.textAlign = 'center'; ctx.font = 'bold 17px system-ui, sans-serif';
    const tw = ctx.measureText(state.objectiveText).width + 36;
    ctx.fillStyle = 'rgba(10,14,20,0.62)'; ctx.fillRect(w / 2 - tw / 2, h - 96, tw, 34);
    ctx.fillStyle = '#ffd94d'; ctx.fillText(state.objectiveText, w / 2, h - 88);
    if (state.objectiveDist) { ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(state.objectiveDist + 'm', w / 2, h - 56); }
  }
  if (state.toast && state.toastT > 0) {
    ctx.textAlign = 'center'; ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(10,14,20,0.6)'; const tw = ctx.measureText(state.toast).width + 40; ctx.fillRect(w / 2 - tw / 2, 86, tw, 38);
    ctx.fillStyle = '#fff'; ctx.fillText(state.toast, w / 2, 94);
  }
  if (state.controlsHint) {
    ctx.textAlign = 'left'; ctx.font = '13px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(state.controlsHint, 16, h - 24);
  }
  drawMinimap(ctx, state, w - 168, h - 168, 148);
}
