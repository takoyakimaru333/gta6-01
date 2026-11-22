// Renderer: sun-soaked top-down Solara Bay, entities, effects, and all screens.
// Camera follows the player (or car), world is drawn in layers: ground, roads, props,
// shadows, cars, people, particles, then screen-space panels for title/pause/over.
import { WORLD_W, WORLD_H, ROAD_W } from './config.js';
import { V_ROADS, H_ROADS } from './world.js';
import { drawHud } from './hud.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  function drawBuilding(b) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof; ctx.fillRect(b.x + 7, b.y + 7, b.w - 14, b.h - 14);
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    const cols = Math.max(2, Math.floor(b.w / 26)); const rows = Math.max(2, Math.floor(b.h / 24));
    for (let i = 0; i < cols; i += 1) for (let j = 0; j < rows; j += 1) {
      if (((i * 7 + j * 13 + Math.floor(b.seed * 40)) % 5) < 3) ctx.fillRect(b.x + 12 + i * 24, b.y + 12 + j * 22, 11, 9);
    }
    if (b.name) { ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(b.name, b.x + b.w / 2, b.y - 6); }
  }
  function drawCar(c, time) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(-20, -9 + 4, 44, 22);
    ctx.fillStyle = c.health < 35 ? '#555' : c.color; roundRect(ctx, -23, -11, 46, 22, 6); ctx.fill();
    ctx.fillStyle = 'rgba(20,30,45,0.9)'; roundRect(ctx, -6, -8, 17, 16, 4); ctx.fill();
    ctx.fillStyle = 'rgba(180,230,255,0.85)'; ctx.fillRect(9, -7, 5, 14);
    ctx.fillStyle = '#222'; ctx.fillRect(-18, -13, 9, 4); ctx.fillRect(-18, 9, 9, 4); ctx.fillRect(11, -13, 9, 4); ctx.fillRect(11, 9, 9, 4);
    if (c.police) {
      ctx.fillStyle = '#24406e'; ctx.fillRect(-8, -11, 18, 22);
      ctx.fillStyle = Math.floor(time * 4) % 2 ? '#ff4040' : '#4080ff'; ctx.fillRect(-2, -3, 7, 6);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SBPD', 1, -14);
    }
    if (c.mission) { ctx.fillStyle = '#ff5d73'; ctx.beginPath(); ctx.arc(0, -20, 5 + Math.sin(time * 6) * 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (c.health < 55) { ctx.fillStyle = 'rgba(60,60,60,0.5)'; ctx.beginPath(); ctx.arc(c.x, c.y - 8, 6 + (55 - c.health) / 8, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawPerson(p, isPlayer, time) {
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 4, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(p.angle);
    const step = p.moving ? Math.sin(time * 14 + p.id) * 4 : 0;
    ctx.fillStyle = '#2b2f38'; ctx.fillRect(2, -7 + step * 0.4, 7, 4); ctx.fillRect(2, 3 - step * 0.4, 7, 4);
    ctx.fillStyle = p.dead ? '#7a2020' : (isPlayer ? '#ffcf4d' : p.shirt); ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c49b'; ctx.beginPath(); ctx.arc(3, 0, 4.6, 0, Math.PI * 2); ctx.fill();
    if (p.police) { ctx.fillStyle = '#ffd21f'; ctx.fillRect(1, -4, 4, 8); }
    if (p.guard) { ctx.fillStyle = '#222'; ctx.fillRect(6, -2, 9, 4); }
    ctx.restore();
    if (p.dead) { ctx.fillStyle = 'rgba(160,20,20,0.55)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 15, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawWorld(state, camX, camY, w, h) {
    // Ground: sand, grass districts, beach and water to the south.
    ctx.fillStyle = '#cbb99b'; ctx.fillRect(camX - 20, camY - 20, w + 40, h + 40);
    ctx.fillStyle = '#79bd74'; ctx.fillRect(2520, 60, 980, 620);
    ctx.fillStyle = '#e8c98a'; ctx.fillRect(0, 2280, WORLD_W, 130);
    const grad = ctx.createLinearGradient(0, 2400, 0, WORLD_H);
    grad.addColorStop(0, '#54c2cf'); grad.addColorStop(1, '#1d7f9e');
    ctx.fillStyle = grad; ctx.fillRect(0, 2400, WORLD_W, WORLD_H - 2400);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 24; i += 1) ctx.fillRect((i * 173 + Math.sin(state.time + i) * 20 + WORLD_W) % WORLD_W, 2440 + (i * 37) % 130, 44, 3);
    // Roads.
    ctx.fillStyle = '#3d4148';
    for (const rx of V_ROADS) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, WORLD_H - 190);
    for (const ry of H_ROADS) ctx.fillRect(0, ry - ROAD_W / 2, WORLD_W, ROAD_W);
    ctx.strokeStyle = '#f7d774'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
    for (const rx of V_ROADS) { ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, WORLD_H - 200); ctx.stroke(); }
    for (const ry of H_ROADS) { ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(WORLD_W, ry); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = '#8fd0e8'; ctx.fillRect(60, 1850, 150, 420); // canal pool west
    for (const t of state.world.trees) {
      if (t.x < camX - 40 || t.x > camX + w + 40 || t.y < camY - 40 || t.y > camY + h + 40) continue;
      ctx.fillStyle = '#7a5a34'; ctx.fillRect(t.x - 2, t.y, 4, 9);
      ctx.fillStyle = t.palm ? '#3fae5a' : '#2f8f46'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(t.x - 3, t.y - 3, t.r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    for (const b of state.world.buildings) {
      if (b.x + b.w < camX - 30 || b.x > camX + w + 30 || b.y + b.h < camY - 30 || b.y > camY + h + 30) continue;
      drawBuilding(b);
    }
    // Objective marker column of light.
    if (state.objective) {
      const o = state.objective; const pulse = 0.55 + Math.sin(state.time * 5) * 0.25;
      ctx.fillStyle = `rgba(255,210,31,${pulse * 0.35})`; ctx.fillRect(o.x - 16, o.y - 130, 32, 130);
      ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.arc(o.x, o.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('!', o.x, o.y + 5);
    }
    for (const chip of state.chips) if (!chip.taken) {
      ctx.fillStyle = '#37d6e0'; ctx.save(); ctx.translate(chip.x, chip.y + Math.sin(state.time * 4 + chip.x) * 3); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore();
    }
    for (const pk of state.pickups) if (!pk.taken) {
      ctx.fillStyle = pk.kind === 'health' ? '#ff5d73' : '#ffd21f'; ctx.beginPath(); ctx.arc(pk.x, pk.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(pk.kind === 'health' ? '+' : '$', pk.x, pk.y + 4);
    }
    for (const c of state.cars) if (!c.dead) drawCar(c, state.time);
    for (const c of state.copCars) if (!c.dead) drawCar(c, state.time);
    for (const ped of state.peds) drawPerson(ped, false, state.time);
    for (const cop of state.copPeds) drawPerson(cop, false, state.time);
    if (!state.player.car) drawPerson(state.player, true, state.time);
    // Bullets, particles, skid marks.
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    for (const s of state.skids) ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2;
    for (const b of state.bullets) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(b.angle) * 12, b.y - Math.sin(b.angle) * 12); ctx.stroke(); }
    for (const pt of state.particles) { ctx.fillStyle = pt.color; ctx.globalAlpha = Math.max(0, pt.life); ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    if (state.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${state.flash})`; ctx.fillRect(camX, camY, w, h); }
  }
  function panel(title, lines, prompt, accent) {
    const w = canvas.width; const h = canvas.height;
    ctx.fillStyle = 'rgba(8,12,22,0.72)'; ctx.fillRect(0, 0, w, h);
    const pw = Math.min(680, w - 40); const ph = 150 + lines.length * 27 + 70;
    const x = (w - pw) / 2; const y = (h - ph) / 2;
    ctx.fillStyle = '#14202e'; roundRect(ctx, x, y, pw, ph, 16); ctx.fill();
    ctx.fillStyle = accent || '#ff5d73'; ctx.fillRect(x, y, pw, 7);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 42px system-ui'; ctx.fillText(title, w / 2, y + 62);
    ctx.font = '17px system-ui'; ctx.fillStyle = '#cfe3ee';
    lines.forEach((ln, i) => ctx.fillText(ln, w / 2, y + 104 + i * 27));
    ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 19px system-ui'; ctx.fillText(prompt, w / 2, y + ph - 28);
  }
  function draw(state, screen) {
    const w = canvas.width; const h = canvas.height;
    const focus = state.player.car || state.player;
    const camX = Math.max(0, Math.min(WORLD_W - w, focus.x - w / 2));
    const camY = Math.max(0, Math.min(WORLD_H - h, focus.y - h / 2));
    ctx.save(); ctx.translate(-camX, -camY);
    drawWorld(state, camX, camY, w, h);
    ctx.restore();
    // Warm sun vignette.
    const vg = ctx.createRadialGradient(w / 2, h / 2, h / 3, w / 2, h / 2, h);
    vg.addColorStop(0, 'rgba(255,180,60,0)'); vg.addColorStop(1, 'rgba(120,40,0,0.16)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    if (state.player.health < 30 && screen === SCREEN_PLAY) { ctx.fillStyle = `rgba(200,0,0,${0.18 + Math.sin(state.time * 6) * 0.07})`; ctx.fillRect(0, 0, w, h); }
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, state, w, h);
    if (screen === SCREEN_TITLE) panel('SOLARA BAY', [
      'An original open-world crime story in a sun-soaked bay city.',
      'Kai Mercer owes the Rios family. Lena Voss has work that pays.',
      '', 'WASD move · Mouse aim · Click/F attack · E enter car · Shift sprint/run',
      'In car: WASD drive · Space brake · 1/2/3 weapons · P pause',
      state.hasSave ? 'Saved game found - your story, cash and chips are kept.' : 'Steal cars, dodge SBPD, finish 6 story missions, find 10 chips.',
    ], state.hasSave ? 'Click / Enter: CONTINUE    ·    N: NEW GAME' : 'Click or press Enter to start', '#ffd21f');
    else if (screen === SCREEN_PAUSED) panel('PAUSED', ['Solara Bay waits for no one - except now.', 'Progress is saved automatically.'], 'P / Esc to resume', '#37d6e0');
    else if (screen === SCREEN_OVER) panel(state.overTitle || 'WASTED', [state.overText || 'The bay claims another dreamer.', `Cash kept: $${state.money} · Missions done: ${state.missionIndex}/6 · Chips: ${state.chipsFound}/10`], 'Click or press Enter to wake at Bay Clinic', '#ff4040');
    else if (screen === SCREEN_WIN) panel('STORY COMPLETE', ['Kai sails out of Solara Bay debt-free.', 'Free roam is yours: garage deliveries, chips and chaos remain.', `Final cash: $${state.money}`], 'Click to keep roaming', '#7dff8a');
  }
  return { draw, get width() { return canvas.width; }, get height() { return canvas.height; } };
}
