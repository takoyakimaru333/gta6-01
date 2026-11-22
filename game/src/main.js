// Solara Bay - main loop and game rules: player on foot and in cars, traffic and
// pedestrian life, police and wanted heat, combat, the six-mission story, side income,
// collectibles, save/load, and the title / pause / busted / wasted / win screens.
import { STEP, SAVE_KEY, WORLD_W, WORLD_H, PLAYER_SPEED, PLAYER_SPRINT, CAR_ACCEL, CAR_MAX_SPEED, CAR_MAX_REVERSE, CAR_TURN, MAX_COPS_BY_STARS, COP_SPAWN_INTERVAL, WEAPONS } from './config.js';
import { createRandom, range } from './random.js';
import { createWorld } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_WEAPON } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WIN } from './render.js';
import { createAudio } from './audio.js';
import { makeCar, makePed, makeCop, spawnTraffic, spawnPeds, updateTrafficCar, updatePed, CAR_MODELS } from './entities.js';
import { MISSIONS, sideJobText } from './missions.js';
import { shotScene } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '7', 10) || 7;
const random = createRandom(seed);
const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const world = createWorld(createRandom(1234));
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

let screen = SCREEN_TITLE;
let state = null;

function toast(msg, t = 3.2) { state.toast = msg; state.toastT = t; }
function burst(x, y, color, n = 10, speed = 130) {
  for (let i = 0; i < n; i += 1) { const a = Math.random() * 6.28; state.particles.push({ x, y, vx: Math.cos(a) * speed * Math.random(), vy: Math.sin(a) * speed * Math.random(), life: range(Math.random, 0.3, 0.8), color }); }
}
function addWanted(amount) {
  state.heat = Math.min(5, state.heat + amount);
  state.wanted = Math.max(state.wanted, Math.floor(state.heat));
  state.crimeTimer = 0;
}
function saveGame() {
  if (!state) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ money: state.money, missionIndex: state.missionIndex, chips: state.chips.map((c) => c.taken), chipsFound: state.chipsFound, weapons: state.player.weapons, storyDone: state.storyDone })); } catch { /* private mode */ }
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && typeof s.money === 'number' ? s : null; } catch { return null; } }

function freshState(saved) {
  const cars = spawnTraffic(createRandom(99), world);
  const peds = spawnPeds(createRandom(55));
  const chips = [];
  const chipSpots = [[830, 300], [300, 1280], [1930, 780], [3030, 300], [560, 2280], [2480, 1780], [1380, 2280], [3220, 900], [900, 900], [2200, 1500]];
  for (const [x, y] of chipSpots) chips.push({ x, y, taken: false });
  if (saved && saved.chips) saved.chips.forEach((t, i) => { if (chips[i]) chips[i].taken = !!t; });
  const s = {
    world, time: 0, money: saved ? saved.money : 120, missionIndex: saved ? saved.missionIndex : 0, missionStep: 0,
    storyDone: saved ? !!saved.storyDone : false, hasSave: !!saved,
    player: { x: 620, y: 560, angle: 0, health: 100, car: null, weapon: 'fists', weaponName: 'Fists', ammo: Infinity, weapons: saved ? saved.weapons : ['fists'], moving: false, id: 999, attackCd: 0, hurtCd: 0 },
    cars, peds, copCars: [], copPeds: [], bullets: [], particles: [], skids: [],
    chips, chipsFound: saved ? saved.chipsFound : 0,
    pickups: [ { x: 2660, y: 1540, kind: 'health', taken: false }, { x: 1080, y: 2300, kind: 'ammo', taken: false }, { x: 1620, y: 1100, kind: 'cash', taken: false }, { x: 430, y: 2060, kind: 'ammo', taken: false } ],
    wanted: 0, heat: 0, crimeTimer: 99, coolTimer: 0, copTimer: 1, bustTimer: 0,
    objective: null, objectiveText: '', objectiveDist: 0, toast: '', toastT: 0, controlsHint: 'E: enter car · Click: attack · Shift: sprint · P: pause',
    missionCar: null, guards: [], guardKills: 0, stepTimer: null, flash: 0, overTitle: '', overText: '', missionBannerT: 0,
  };
  return s;
}
function currentMission() { return MISSIONS[state.missionIndex] || null; }
function currentStep() { const m = currentMission(); return m ? m.steps[state.missionStep] : null; }

function startMissionSetup() {
  const m = currentMission(); if (!m) { state.objectiveText = sideJobText(); state.objective = null; return; }
  state.guards = []; state.guardKills = 0; state.missionCar = null;
  const step = currentStep();
  if (step && step.type === 'stealModel') spawnMissionCar(step.model);
  if (step && step.type === 'eliminate') spawnGuards(step);
  if (step && step.type === 'escape') { state.heat = Math.max(state.heat, 3); state.wanted = 3; }
  if (step && (step.type === 'gotoTimed' || step.type === 'gotoCarTimed')) state.stepTimer = step.time;
  updateObjectiveText();
  if (state.missionStep === 0) toast(m.title + ' - ' + m.giver, 4);
}
function spawnMissionCar(modelName) {
  const model = CAR_MODELS.find((mm) => mm.name === modelName) || CAR_MODELS[0];
  const spot = modelName === 'Aurelia GT' ? { x: 2200, y: 640 } : { x: 2240, y: 500 };
  const c = makeCar(random, spot.x, spot.y, Math.PI / 2, { parked: true, model, mission: true });
  state.cars.push(c); state.missionCar = c;
}
function spawnGuards(step) {
  state.guards = [];
  for (let i = 0; i < step.count; i += 1) {
    const g = makePed(random, step.x + (i - 1) * 55, step.y + 60 + i * 22);
    g.guard = true; g.shirt = '#20242c'; g.health = 70; g.name = "Varga guard";
    state.guards.push(g); state.peds.push(g);
  }
}
function updateObjectiveText() {
  const step = currentStep(); const m = currentMission();
  if (!m) { state.objectiveText = sideJobText(); state.objective = null; return; }
  if (!step) { state.objectiveText = ''; state.objective = null; return; }
  let label = step.label;
  if (step.type === 'eliminate') label = `Eliminate Varga's guards (${state.guardKills}/${step.count})`;
  if (state.stepTimer !== null && state.stepTimer !== undefined) label += `  ⏱ ${Math.ceil(state.stepTimer)}s`;
  state.objectiveText = (m.title + ': ' + label);
  if (step.type === 'stealModel' && state.missionCar) state.objective = { x: state.missionCar.x, y: state.missionCar.y };
  else if (step.x !== undefined) state.objective = { x: step.x, y: step.y };
  else state.objective = null;
  if (state.objective) { const t = state.player.car || state.player; state.objectiveDist = Math.round(Math.hypot(state.objective.x - t.x, state.objective.y - t.y) / 4); }
}
function completeStep() {
  audio.cash();
  state.missionStep += 1; state.stepTimer = null;
  const m = currentMission();
  if (state.missionStep >= m.steps.length) completeMission();
  else { toast('Objective done!', 2.2); startMissionSetup(); }
}
function completeMission() {
  const m = currentMission();
  state.money += m.payout;
  if (m.id === 'meet' && !state.player.weapons.includes('pistol')) { state.player.weapons.push('pistol'); state.player.weapon = 'pistol'; syncWeapon(); }
  if (m.id === 'guards' && !state.player.weapons.includes('smg')) { state.player.weapons.push('smg'); state.player.weapon = 'smg'; syncWeapon(); }
  toast(`MISSION COMPLETE: ${m.title}  +$${m.payout}`, 5); audio.mission();
  state.missionIndex += 1; state.missionStep = 0;
  state.heat = Math.max(0, state.heat - 1); 
  if (state.missionIndex >= MISSIONS.length) { state.storyDone = true; screen = SCREEN_WIN; }
  saveGame(); startMissionSetup();
}
function failTimedStep() {
  audio.fail(); toast('Too slow! The objective resets - try again.', 4);
  const step = currentStep(); if (step) state.stepTimer = step.time;
  state.heat = Math.max(0, state.heat - 0.5);
}
function syncWeapon() {
  const w = WEAPONS[state.player.weapon]; state.player.weaponName = w.name;
  if (state.player.weapon === 'fists') state.player.ammo = Infinity;
  else if (typeof state.player.ammo !== 'number' || state.player.ammo === Infinity) state.player.ammo = state.player.weapon === 'pistol' ? 48 : 90;
}
function giveAmmo(n) { if (state.player.ammo !== Infinity) state.player.ammo += n; }

// ---------------- combat ----------------
function playerAttack() {
  const p = state.player; if (p.attackCd > 0 || p.car) return;
  const w = WEAPONS[p.weapon]; p.attackCd = w.cooldown;
  const aim = Math.atan2(input.mouseY - renderer.height / 2, input.mouseX - renderer.width / 2);
  p.angle = aim;
  if (p.weapon === 'fists') {
    audio.punch();
    const tx = p.x + Math.cos(aim) * 30; const ty = p.y + Math.sin(aim) * 30;
    for (const target of [...state.peds, ...state.copPeds]) {
      if (!target.dead && Math.hypot(target.x - tx, target.y - ty) < 26) hurtPerson(target, w.damage, aim);
    }
    return;
  }
  if (p.ammo <= 0) { toast('Out of ammo - find an ammo pickup (orange $ shops / warehouse).', 3); return; }
  p.ammo -= 1; audio.shot(); state.flash = 0.12;
  const a = aim + range(Math.random, -w.spread, w.spread);
  state.bullets.push({ x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, angle: a, speed: 880, life: w.range / 880, from: 'player', damage: w.damage });
  burst(p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20, '#ffd94d', 3, 60);
  if (nearPolice(420)) addWanted(0.4);
}
function hurtPerson(target, damage, angle) {
  target.health -= damage; burst(target.x, target.y, '#c02020', 6, 90);
  if (target.health <= 0 && !target.dead) {
    target.dead = true; target.health = 0; audio.hit();
    if (target.guard) { state.guardKills += 1; addWanted(0.7); updateObjectiveText(); }
    else if (target.police) addWanted(1.2);
    else addWanted(0.8);
  } else if (!target.guard && !target.police) { target.state = 'flee'; }
}
function hurtPlayer(damage) {
  const p = state.player; if (p.hurtCd > 0 || screen !== SCREEN_PLAY) return;
  p.hurtCd = 0.18; p.health -= damage; audio.hit(); burst(p.x, p.y, '#ff5d73', 5, 80);
  if (p.health <= 0) gameOver('WASTED', p.car ? 'Your ride burns out on a Solara Bay boulevard.' : 'You collapse on the warm pavement of Solara Bay.');
}
function nearPolice(dist) {
  const p = state.player;
  return state.copCars.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < dist) || state.copPeds.some((c) => !c.dead && Math.hypot(c.x - p.x, c.y - p.y) < dist);
}
function gameOver(title, text) {
  state.overTitle = title; state.overText = text; screen = SCREEN_OVER; audio.fail(); saveGame();
}
function respawnAtClinic() {
  const p = state.player; p.health = 100; p.car = null; p.x = 2660; p.y = 1560;
  state.money = Math.max(0, state.money - 100); state.wanted = 0; state.heat = 0;
  state.copCars = []; state.copPeds = []; state.bullets = [];
  screen = SCREEN_PLAY; toast('Bay Clinic patches you up. -$100', 3.5);
}

// ---------------- vehicles ----------------
function nearestCarForEntry() {
  const p = state.player; let best = null; let bd = 52;
  for (const c of state.cars) { if (c.dead) continue; const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = c; } }
  return best;
}
function enterCar(car) {
  const p = state.player; audio.door();
  if (car.driver === 'citizen') { // yank the driver out
    const d = makePed(random, car.x + 20, car.y + 14); d.state = 'flee'; state.peds.push(d); addWanted(1);
    toast('Carjacked! The driver runs screaming.', 2.5);
  } else if (car.parked) {
    if (nearPolice(360)) { addWanted(1); toast('Stolen - and the SBPD saw it!', 2.5); } else { state.heat = Math.min(5, state.heat + 0.4); state.crimeTimer = 0; }
  }
  car.driver = 'player'; car.parked = false; p.car = car;
  if (state.missionCar === car) { const step = currentStep(); if (step && step.type === 'stealModel') { toast('Got the ' + car.model.name + '! Now deliver it.', 3); completeStep(); } }
}
function exitCar() {
  const p = state.player; const car = p.car; if (!car) return; audio.door();
  car.driver = null; car.speed = 0; p.car = null;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 26; p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 26;
  if (world.collides(p.x, p.y, 12)) { p.x = car.x - Math.cos(car.angle) * 30; p.y = car.y - Math.sin(car.angle) * 30; }
}
function driveCar(dt) {
  const p = state.player; const car = p.car; const ax = input.axis();
  const fwd = -ax.y; // W = up = forward
  if (fwd !== 0) car.speed += fwd * CAR_ACCEL * dt * (car.speed * fwd < 0 ? 2.2 : 1);
  else car.speed -= car.speed * Math.min(1, dt * 1.4);
  if (input.brake()) car.speed -= car.speed * Math.min(1, dt * 6);
  car.speed = Math.max(-CAR_MAX_REVERSE, Math.min(CAR_MAX_SPEED * (car.model ? car.model.speed : 1), car.speed));
  if (Math.abs(car.speed) > 4 && ax.x !== 0) car.angle += ax.x * CAR_TURN * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 160);
  p.angle = car.angle;
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (!world.carCollides(nx, ny, 17)) { car.x = nx; car.y = ny; } else { if (Math.abs(car.speed) > 120) { car.health -= 14; burst(car.x, car.y, '#ffb02e', 10, 120); audio.hit(); } car.speed *= -0.25; }
  p.x = car.x; p.y = car.y;
  if (Math.abs(car.speed) > 200 && Math.random() < 0.5) state.skids.push({ x: car.x - Math.cos(car.angle) * 16, y: car.y - Math.sin(car.angle) * 16 });
  if (state.skids.length > 260) state.skids.splice(0, 40);
  // Run over / crash checks.
  for (const ped of state.peds) {
    if (ped.dead) continue;
    if (Math.abs(car.speed) > 60 && Math.hypot(ped.x - car.x, ped.y - car.y) < 24) { hurtPerson(ped, 70, car.angle); if (Math.abs(car.speed) > 140) addWanted(0.6); car.speed *= 0.82; }
  }
  for (const o of state.cars) {
    if (o === car || o.dead) continue;
    if (Math.hypot(o.x - car.x, o.y - car.y) < 36) { o.health -= Math.abs(car.speed) * 0.06; car.health -= Math.abs(car.speed) * 0.04; car.speed *= 0.55; burst(car.x, car.y, '#cccccc', 6, 90); if (nearPolice(420)) addWanted(0.35); }
  }
  for (const o of state.copCars) if (Math.hypot(o.x - car.x, o.y - car.y) < 38) { car.speed *= 0.6; o.speed *= 0.5; }
  if (car.health <= 0) { car.dead = true; burst(car.x, car.y, '#ff7b2e', 26, 190); exitCar(); hurtPlayer(18); toast('Your car is wrecked!', 3); }
  audio.engine(Math.abs(car.speed) / CAR_MAX_SPEED, true);
}

// ---------------- police ----------------
function spawnCop() {
  const p = state.player; const a = Math.random() * 6.28; const d = 560;
  const x = Math.max(60, Math.min(WORLD_W - 60, p.x + Math.cos(a) * d)); const y = Math.max(60, Math.min(WORLD_H - 260, p.y + Math.sin(a) * d));
  if (state.wanted >= 2 || state.copCars.length === 0) { const c = makeCop(random, x, y, true); c.targetSpeed = 330; state.copCars.push(c); }
  else { const c = makeCop(random, x, y, false); state.copPeds.push(c); }
}
function updatePolice(dt) {
  const p = state.player; const target = p.car || p;
  state.copTimer -= dt;
  const want = MAX_COPS_BY_STARS[state.wanted] || 0;
  if (state.wanted > 0 && state.copTimer <= 0 && state.copCars.length + state.copPeds.length < want) { spawnCop(); state.copTimer = COP_SPAWN_INTERVAL; }
  for (const c of state.copCars) {
    const dx = target.x - c.x; const dy = target.y - c.y; const dist = Math.hypot(dx, dy);
    const desired = Math.atan2(dy, dx);
    let diff = desired - c.angle; while (diff > Math.PI) diff -= 6.283; while (diff < -Math.PI) diff += 6.283;
    c.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const sp = dist > 60 ? Math.min(360, 190 + state.wanted * 32) : 60;
    c.speed += (sp - c.speed) * Math.min(1, dt * 1.8);
    const nx = c.x + Math.cos(c.angle) * c.speed * dt; const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (!world.carCollides(nx, ny, 17)) { c.x = nx; c.y = ny; } else { c.angle += 1.4 * dt; c.speed *= 0.4; }
    if (dist < 40 && p.car) { p.car.speed *= 0.94; }
    if (dist < 34 && !p.car) { /* foot cop exits handled by bust in ped update */ }
    if (dist > 1500) { c.x = target.x + Math.cos(Math.random() * 6.28) * 620; c.y = target.y + Math.sin(Math.random() * 6.28) * 620; }
  }
  for (const cop of state.copPeds) {
    if (cop.dead) continue;
    const dx = p.x - cop.x; const dy = p.y - cop.y; const dist = Math.hypot(dx, dy);
    cop.angle = Math.atan2(dy, dx); cop.moving = dist > 30;
    if (dist > 30) world.slideMove(cop, Math.cos(cop.angle) * 172 * dt, Math.sin(cop.angle) * 172 * dt, 10);
    if (!p.car && dist < 30) { state.bustTimer += dt; if (state.bustTimer > 1.6) { gameOver('BUSTED', 'SBPD cuffs you on a Solara Bay sidewalk. Bail is not cheap.'); state.bustTimer = 0; } }
    else if (dist < 300 && state.wanted >= 3 && Math.random() < dt * 1.4) { state.bullets.push({ x: cop.x, y: cop.y, angle: cop.angle + range(Math.random, -0.14, 0.14), speed: 760, life: 0.4, from: 'cop', damage: 7 }); audio.shot(); }
  }
  if (!state.copPeds.some((c) => !c.dead && Math.hypot(c.x - p.x, c.y - p.y) < 34)) state.bustTimer = Math.max(0, state.bustTimer - dt * 2);
  const anyNear = nearPolice(430);
  audio.sirenLevel(state.wanted > 0 && anyNear ? 1 : 0);
  // Cool-down: out of sight, no fresh crime.
  state.crimeTimer += dt;
  if (state.wanted > 0 && !anyNear && state.crimeTimer > 5) {
    state.coolTimer += dt;
    if (state.coolTimer > 7) { state.coolTimer = 0; state.heat = Math.max(0, Math.floor(state.heat) - 1); state.wanted = Math.floor(state.heat); toast(state.wanted === 0 ? 'Heat lost. You are clear.' : 'Heat cooling...', 2); if (state.wanted === 0) { state.copCars = []; state.copPeds = []; } }
  } else state.coolTimer = 0;
}

// ---------------- per-step update ----------------
function update(dt) {
  state.time += dt; const p = state.player;
  if (state.toastT > 0) state.toastT -= dt;
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);
  if (p.attackCd > 0) p.attackCd -= dt; if (p.hurtCd > 0) p.hurtCd -= dt;
  const danger = (input.mouseDown || p.car) ? p : null;
  for (const ped of state.peds) updatePed(ped, dt, world, danger && Math.hypot(ped.x - p.x, ped.y - p.y) < 140 ? p : null);
  for (const ped of state.peds) { // guards hold ground and shoot
    if (!ped.guard || ped.dead) continue;
    const d = Math.hypot(ped.x - p.x, ped.y - p.y); ped.angle = Math.atan2(p.y - ped.y, p.x - ped.x);
    if (d < 330 && Math.random() < dt * 1.1) { state.bullets.push({ x: ped.x, y: ped.y, angle: ped.angle + range(Math.random, -0.12, 0.12), speed: 720, life: 0.45, from: 'guard', damage: 8 }); audio.shot(); }
  }
  for (const car of state.cars) updateTrafficCar(car, dt, world, state.cars);
  state.cars = state.cars.filter((c) => !c.dead || c === p.car);
  if (!p.car) {
    const ax = input.axis(); const len = Math.hypot(ax.x, ax.y) || 1;
    const sp = input.sprint() ? PLAYER_SPRINT : PLAYER_SPEED;
    p.moving = ax.x !== 0 || ax.y !== 0;
    if (p.moving) { p.angle = Math.atan2(ax.y, ax.x); world.slideMove(p, (ax.x / len) * sp * dt, (ax.y / len) * sp * dt, 12); }
    else p.angle = Math.atan2(input.mouseY - renderer.height / 2, input.mouseX - renderer.width / 2);
    audio.engine(0, false);
  } else driveCar(dt);
  updatePolice(dt);
  // Bullets.
  for (const b of state.bullets) {
    b.x += Math.cos(b.angle) * b.speed * dt; b.y += Math.sin(b.angle) * b.speed * dt; b.life -= dt;
    if (world.collides(b.x, b.y, 2)) b.life = 0;
    if (b.from === 'player') {
      for (const t of [...state.peds, ...state.copPeds]) if (!t.dead && Math.hypot(t.x - b.x, t.y - b.y) < 13) { hurtPerson(t, b.damage, b.angle); b.life = 0; break; }
      if (b.life > 0) for (const c of [...state.cars, ...state.copCars]) if (!c.dead && Math.hypot(c.x - b.x, c.y - b.y) < 22) { c.health -= b.damage; burst(b.x, b.y, '#ffb02e', 4, 80); b.life = 0; break; }
    } else if (Math.hypot(p.x - b.x, p.y - b.y) < (p.car ? 24 : 13)) { hurtPlayer(b.damage); b.life = 0; }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
  for (const pt of state.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
  state.particles = state.particles.filter((pt) => pt.life > 0);
  // Chips & pickups.
  for (const chip of state.chips) if (!chip.taken && Math.hypot(chip.x - p.x, chip.y - p.y) < 24) { chip.taken = true; state.chipsFound += 1; state.money += 150; audio.cash(); toast(`Data chip ${state.chipsFound}/10  +$150`, 2.5); saveGame(); }
  for (const pk of state.pickups) if (!pk.taken && Math.hypot(pk.x - p.x, pk.y - p.y) < 24) {
    pk.taken = true; setTimeout(() => { pk.taken = false; }, 45000);
    if (pk.kind === 'health') { p.health = Math.min(100, p.health + 45); toast('+45 health', 2); }
    if (pk.kind === 'ammo') { if (!state.player.weapons.includes('pistol')) state.player.weapons.push('pistol'); giveAmmo(40); toast('+40 ammo', 2); }
    if (pk.kind === 'cash') { state.money += 120; audio.cash(); toast('+$120 found cash', 2); }
  }
  updateMission(dt);
  updateObjectiveText();
}
function updateMission(dt) {
  const step = currentStep(); if (!step) return;
  const focus = state.player.car || state.player;
  if (state.stepTimer !== null && state.stepTimer !== undefined) { state.stepTimer -= dt; if (state.stepTimer <= 0) { failTimedStep(); return; } }
  const d = step.x !== undefined ? Math.hypot(step.x - focus.x, step.y - focus.y) : Infinity;
  switch (step.type) {
    case 'goto': if (d < step.radius) completeStep(); break;
    case 'gotoTimed': if (d < step.radius) completeStep(); break;
    case 'gotoCar': if (state.player.car && d < step.radius) { const delivered = state.player.car; exitCar(); delivered.dead = true; completeStep(); } break;
    case 'gotoCarTimed': if (state.player.car && d < step.radius) completeStep(); break;
    case 'eliminate': if (state.guardKills >= step.count) completeStep(); break;
    case 'escape': if (state.wanted === 0 && d < step.radius) completeStep(); break;
    default: break;
  }
  // Free-roam garage sales (only when no garage mission step is active).
  if (state.player.car && step.type !== 'gotoCar' && Math.hypot(1620 - focus.x, 1020 - focus.y) < 78) {
    const car = state.player.car; const pay = Math.round((car.model ? car.model.value : 200) / 2);
    exitCar(); car.dead = true; state.money += pay; audio.cash(); toast(`Rios Garage buys the ${car.model.name} for $${pay}`, 3); saveGame();
  }
}

// ---------------- screens & loop ----------------
function newGame(useSave) {
  state = freshState(useSave ? loadSave() : null);
  window.__gameState = state;
  syncWeapon(); startMissionSetup(); screen = SCREEN_PLAY;
  statusEl.textContent = 'Solara Bay started. Mission: ' + (currentMission() ? currentMission().title : 'free roam');
}
function handleActions() {
  const a = input.takeActions();
  if (a & ACTION_PAUSE) { if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED; else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY; }
  if (screen === SCREEN_TITLE && (a & ACTION_CONFIRM)) { audio.unlock(); if (input.keys.has('KeyN')) newGame(false); else newGame(true); }
  else if (screen === SCREEN_OVER && (a & ACTION_CONFIRM)) respawnAtClinic();
  else if (screen === SCREEN_WIN && (a & ACTION_CONFIRM)) screen = SCREEN_PLAY;
  else if (screen === SCREEN_PLAY) {
    if (a & ACTION_WEAPON) { const owned = state.player.weapons; const i = owned.indexOf(state.player.weapon); state.player.weapon = owned[(i + 1) % owned.length]; const keep = state.player.ammo; syncWeapon(); if (state.player.weapon !== 'fists') state.player.ammo = keep === Infinity ? (state.player.weapon === 'pistol' ? 48 : 90) : keep; toast('Weapon: ' + state.player.weaponName, 1.4); }
    if (a & ACTION_ENTER) { if (state.player.car) exitCar(); else { const c = nearestCarForEntry(); if (c) enterCar(c); else playerAttack(); } }
    if (input.mouseDown) playerAttack();
  }
}
let last = performance.now(); let acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min((now - last) / 1000, 0.25); last = now;
  handleActions();
  if (screen === SCREEN_PLAY) { while (acc >= STEP) { update(STEP); acc -= STEP; if (screen !== SCREEN_PLAY) { acc = 0; break; } } } else acc = 0;
  renderer.draw(state, screen);
}
function stageShot(name) {
  state = freshState(null); syncWeapon();
  const p = state.player;
  if (name === 'chase') {
    screen = SCREEN_PLAY; state.missionIndex = 2; state.missionStep = 1; state.stepTimer = 96;
    const car = makeCar(random, 1450, 1280, 0, { model: CAR_MODELS[3] }); car.driver = 'player'; car.speed = 300; state.cars.push(car); p.car = car; p.x = car.x; p.y = car.y;
    state.wanted = 3; state.heat = 3;
    for (let i = 0; i < 3; i += 1) { const cop = makeCop(random, 1310 - i * 110, 1280 + (i % 2) * 34 - 17, true); cop.angle = 0; state.copCars.push(cop); }
    state.money = 860; toast('SBPD in pursuit!', 9);
  } else if (name === 'car') {
    screen = SCREEN_PLAY; state.missionIndex = 1; state.missionStep = 1;
    const car = makeCar(random, 1930, 1330, 0, { model: CAR_MODELS[3], mission: false }); car.driver = 'player'; car.speed = 210; state.cars.push(car); p.car = car; p.x = car.x; p.y = car.y;
    state.money = 570; state.wanted = 1; state.heat = 1;
    const cop = makeCop(random, 1750, 1210, true); state.copCars.push(cop);
  } else if (name === 'mission') {
    screen = SCREEN_PLAY; state.missionIndex = 3; state.missionStep = 0; p.x = 520; p.y = 2070; p.weapons = ['fists', 'pistol', 'smg']; p.weapon = 'smg'; syncWeapon(); p.ammo = 64;
    state.wanted = 2; state.heat = 2; state.money = 1950;
    state.bullets.push({ x: 500, y: 2062, angle: -1.2, speed: 800, life: 0.3, from: 'player', damage: 10 });
    burst(470, 2010, '#ffb02e', 8, 100);
    const cop = makeCop(random, 830, 2050, true); cop.angle = Math.PI / 2; state.copCars.push(cop);
  } else { screen = SCREEN_TITLE; p.x = 620; p.y = 560; }
  startMissionSetup();
  if (name === 'mission' && state.guards[0]) { state.guards[0].dead = true; state.guards[0].health = 0; state.guardKills = 1; }
  if (name === 'chase') { state.missionIndex = 2; state.missionStep = 1; state.stepTimer = 96; state.wanted = 3; }
  updateObjectiveText();
  window.__gameState = state;
  let painted = 0;
  (function paint() { renderer.draw(state, screen); painted += 1; if (painted < 3) requestAnimationFrame(paint); else window.__shotReady = true; })();
}
if (shotName) stageShot(shotScene(shotName) ? shotName : 'start');
else { state = freshState(loadSave()); syncWeapon(); startMissionSetup(); window.__gameState = state; requestAnimationFrame(frame); }
