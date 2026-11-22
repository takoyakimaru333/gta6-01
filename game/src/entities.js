// Living city: parked & moving traffic, pedestrians, police units and pickups.
// Traffic follows the road grid lane by lane; pedestrians stroll sidewalks and flee danger;
// police chase the player on foot or in cruisers and try to box the player's car in.
import { WORLD_W, WORLD_H } from './config.js';
import { V_ROADS, H_ROADS, isOnRoad } from './world.js';
import { pick, range } from './random.js';

export const CAR_MODELS = [
  { name: 'Solara Comet', color: '#e94f64', speed: 1.0, value: 400 },
  { name: 'Bayline Sedan', color: '#4f83e9', speed: 0.85, value: 250 },
  { name: 'Canal Van', color: '#e8e3d5', speed: 0.7, value: 200 },
  { name: 'Palma Coupe', color: '#ffb02e', speed: 1.1, value: 550 },
  { name: 'Dune Pickup', color: '#6ab04c', speed: 0.8, value: 300 },
  { name: 'Aurelia GT', color: '#b06ae0', speed: 1.25, value: 900 },
  { name: 'Taxi Sol', color: '#ffd21f', speed: 0.9, value: 280 },
];
let nextId = 1;
export function makeCar(random, x, y, angle, opts = {}) {
  const m = opts.model || pick(random, CAR_MODELS);
  return { id: nextId++, kind: 'car', x, y, angle, speed: 0, health: 100, model: m, color: opts.color || m.color,
    parked: !!opts.parked, driver: opts.driver || null, police: !!opts.police, mission: !!opts.mission,
    laneAxis: opts.laneAxis || null, laneDir: opts.laneDir || 1, laneCoord: opts.laneCoord || 0, targetSpeed: 0, honk: 0 };
}
export function makePed(random, x, y) {
  const names = ['Marta', 'Diego', 'Sofia', 'Kenji', 'Priya', 'Omar', 'Lena', 'Tomas', 'Aya', 'Ruth', 'Marco', 'Ines'];
  return { id: nextId++, kind: 'ped', x, y, angle: range(random, 0, 6.28), speed: range(random, 28, 52), health: 60,
    name: pick(random, names), shirt: pick(random, ['#e94f64', '#4f83e9', '#ffd21f', '#6ab04c', '#f2f2f2', '#ff8c42', '#37d6e0']),
    state: 'walk', timer: range(random, 2, 7), targetX: x, targetY: y, police: false, guard: false, dead: false };
}
export function makeCop(random, x, y, inCar) {
  if (inCar) { const c = makeCar(random, x, y, 0, { police: true, color: '#f4f6f8' }); c.driver = 'officer'; return c; }
  const p = makePed(random, x, y); p.police = true; p.shirt = '#24406e'; p.health = 80; p.name = 'Officer'; return p;
}
export function spawnTraffic(random, world) {
  const cars = [];
  // Moving traffic on random lanes.
  for (let i = 0; i < 26; i += 1) {
    const vertical = random() > 0.5;
    if (vertical) {
      const rx = pick(random, V_ROADS); const dir = random() > 0.5 ? 1 : -1;
      const c = makeCar(random, rx + dir * 26, range(random, 100, WORLD_H - 300), dir > 0 ? Math.PI / 2 : -Math.PI / 2, { driver: 'citizen' });
      c.laneAxis = 'y'; c.laneDir = dir; c.laneCoord = c.x; c.targetSpeed = range(random, 120, 190) * c.model.speed; cars.push(c);
    } else {
      const ry = pick(random, H_ROADS); const dir = random() > 0.5 ? 1 : -1;
      const c = makeCar(random, range(random, 100, WORLD_W - 100), ry + (dir > 0 ? -26 : 26), dir > 0 ? 0 : Math.PI, { driver: 'citizen' });
      c.laneAxis = 'x'; c.laneDir = dir; c.laneCoord = c.y; c.targetSpeed = range(random, 120, 190) * c.model.speed; cars.push(c);
    }
  }
  // Parked cars along curbs - these are the ones the player steals.
  for (let i = 0; i < 34; i += 1) {
    const rx = pick(random, V_ROADS); const y = range(random, 120, WORLD_H - 320);
    if (world.collides(rx + 44, y, 16)) continue;
    cars.push(makeCar(random, rx + 44, y, Math.PI / 2, { parked: true }));
  }
  return cars;
}
export function spawnPeds(random) {
  const peds = [];
  for (let i = 0; i < 42; i += 1) {
    let x = range(random, 80, WORLD_W - 80); let y = range(random, 80, WORLD_H - 260);
    if (!isOnRoad(x, y)) { x = V_ROADS[Math.floor(random() * V_ROADS.length)] + 68; }
    peds.push(makePed(random, x, y));
  }
  return peds;
}
export function updateTrafficCar(car, dt, world, allCars) {
  if (car.parked || car.driver === 'player' || car.police) return;
  const desired = car.targetSpeed;
  // Slow for a car ahead in the same lane.
  let ahead = false;
  for (const o of allCars) {
    if (o === car || o.dead) continue;
    const dx = o.x - car.x; const dy = o.y - car.y;
    const fwd = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
    const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
    if (fwd > 0 && fwd < 74 && side < 22) { ahead = true; break; }
  }
  car.speed += ((ahead ? 0 : desired) - car.speed) * Math.min(1, dt * 2.2);
  let nx = car.x + Math.cos(car.angle) * car.speed * dt;
  let ny = car.y + Math.sin(car.angle) * car.speed * dt;
  // Turn at intersections sometimes: snap to the crossing road's lane.
  if (car.laneAxis === 'y') {
    const cross = H_ROADS.find((ry) => Math.abs(ny - ry) < 8 && Math.abs(car.y - ry) >= 8);
    if (cross !== undefined && Math.random() < 0.35) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      car.laneAxis = 'x'; car.laneDir = dir; car.y = cross + (dir > 0 ? -26 : 26); car.angle = dir > 0 ? 0 : Math.PI; car.laneCoord = car.y; return;
    }
    car.x = car.laneCoord; car.y = ny;
  } else {
    const cross = V_ROADS.find((rx) => Math.abs(nx - rx) < 8 && Math.abs(car.x - rx) >= 8);
    if (cross !== undefined && Math.random() < 0.35) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      car.laneAxis = 'y'; car.laneDir = dir; car.x = cross + dir * 26; car.angle = dir > 0 ? Math.PI / 2 : -Math.PI / 2; car.laneCoord = car.x; return;
    }
    car.y = car.laneCoord; car.x = nx;
  }
  if (car.x < -80) car.x = WORLD_W + 60; if (car.x > WORLD_W + 80) car.x = -60;
  if (car.y < -80) car.y = WORLD_H - 140; if (car.y > WORLD_H - 120) car.y = 40;
}
export function updatePed(ped, dt, world, danger) {
  if (ped.dead || ped.police || ped.guard) return;
  ped.timer -= dt;
  const dx = danger ? ped.x - danger.x : 0; const dy = danger ? ped.y - danger.y : 0;
  const dDanger = Math.hypot(dx, dy);
  if (danger && dDanger < 130) ped.state = 'flee'; else if (ped.state === 'flee' && dDanger > 220) ped.state = 'walk';
  if (ped.timer <= 0 || ped.state === 'flee') {
    if (ped.state === 'flee') { ped.targetX = ped.x + dx * 2; ped.targetY = ped.y + dy * 2; }
    else { ped.targetX = ped.x + range(Math.random, -260, 260); ped.targetY = ped.y + range(Math.random, -260, 260); ped.timer = range(Math.random, 3, 8); }
  }
  const tx = ped.targetX - ped.x; const ty = ped.targetY - ped.y; const d = Math.hypot(tx, ty);
  if (d > 6) {
    ped.angle = Math.atan2(ty, tx);
    const sp = ped.state === 'flee' ? 150 : ped.speed;
    world.slideMove(ped, Math.cos(ped.angle) * sp * dt, Math.sin(ped.angle) * sp * dt, 10);
  }
}
