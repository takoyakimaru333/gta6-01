// Solara Bay city generation: road grid, buildings, landmarks, props and collision.
// The city is original: a sun-soaked bay city with a beach south, a canal west,
// a park north-east, and named districts the story missions travel between.
import { WORLD_W, WORLD_H, ROAD_W } from './config.js';
import { pick, range } from './random.js';

export const V_ROADS = [280, 830, 1380, 1930, 2480, 3030];
export const H_ROADS = [280, 780, 1280, 1780, 2280];
const BUILDING_COLORS = ['#e8a87c', '#d98e6a', '#f2c894', '#c9d6a3', '#9fc6c5', '#e6b8c8', '#f0e0b6', '#b5c4e8', '#e3d0a8', '#d4a0a0'];
const ROOF_COLORS = ['#b96a4a', '#8f7a5e', '#a85f4e', '#6f8f7a', '#7a6a9a', '#96684f'];

export const LANDMARKS = [
  { id: 'cafe', name: 'Cafe Alba', x: 560, y: 480, color: '#ffb347' },
  { id: 'garage', name: 'Rios Garage', x: 1620, y: 1020, color: '#37d6e0' },
  { id: 'warehouse', name: 'Canal Warehouse', x: 430, y: 1980, color: '#c86a5a' },
  { id: 'hideout', name: 'Hilltop Hideout', x: 3220, y: 420, color: '#9be15d' },
  { id: 'pier', name: 'Solara Pier', x: 1800, y: 2440, color: '#ffd94d' },
  { id: 'clinic', name: 'Bay Clinic', x: 2660, y: 1480, color: '#ffffff' },
  { id: 'armory', name: 'Marina Outfitters', x: 1080, y: 2240, color: '#ff8c42' },
  { id: 'tower', name: 'Aurelia Tower', x: 2200, y: 560, color: '#a8c8ff' },
];

export function nearestRoadX(x) { let b = V_ROADS[0]; for (const r of V_ROADS) if (Math.abs(r - x) < Math.abs(b - x)) b = r; return b; }
export function nearestRoadY(y) { let b = H_ROADS[0]; for (const r of H_ROADS) if (Math.abs(r - y) < Math.abs(b - y)) b = r; return b; }
export function isOnRoad(x, y) {
  for (const r of V_ROADS) if (Math.abs(x - r) < ROAD_W / 2) return true;
  for (const r of H_ROADS) if (Math.abs(y - r) < ROAD_W / 2) return true;
  return false;
}

export function createWorld(random) {
  const buildings = [];
  const trees = [];
  const lamps = [];
  // Fill each block between roads with buildings, leaving sidewalk margins.
  const xs = [60, ...V_ROADS.map((r) => r + ROAD_W / 2 + 18), WORLD_W - 40];
  const ys = [60, ...H_ROADS.map((r) => r + ROAD_W / 2 + 18), WORLD_H - 200];
  for (let bi = 0; bi < xs.length - 1; bi += 1) {
    for (let bj = 0; bj < ys.length - 1; bj += 1) {
      const bx = xs[bi]; const by = ys[bj];
      const bw = xs[bi + 1] - bx - 30; const bh = ys[bj + 1] - by - 30;
      if (bw < 120 || bh < 120) continue;
      // Park block (north-east) and beach stay open.
      if (bx > 2500 && by < 700) continue;
      if (by > 2050 && bx > 1300 && bx < 2400) continue;
      const cols = bw > 340 ? 2 : 1; const rows = bh > 320 ? 2 : 1;
      for (let c = 0; c < cols; c += 1) for (let r = 0; r < rows; r += 1) {
        const w = (bw / cols) - 22; const h = (bh / rows) - 22;
        const x = bx + c * (bw / cols) + 10; const y = by + r * (bh / rows) + 10;
        buildings.push({ x, y, w, h, color: pick(random, BUILDING_COLORS), roof: pick(random, ROOF_COLORS), floors: 2 + Math.floor(random() * 6), seed: random() });
      }
    }
  }
  // Landmark buildings replace whatever overlaps them.
  for (const lm of LANDMARKS) {
    for (let i = buildings.length - 1; i >= 0; i -= 1) {
      const b = buildings[i];
      if (lm.x > b.x - 70 && lm.x < b.x + b.w + 70 && lm.y > b.y - 70 && lm.y < b.y + b.h + 70) buildings.splice(i, 1);
    }
    buildings.push({ x: lm.x - 55, y: lm.y - 42, w: 110, h: 84, color: lm.color, roof: '#5a4632', floors: 3, seed: 0.5, landmark: lm.id, name: lm.name });
  }
  for (let i = 0; i < 190; i += 1) {
    const x = range(random, 80, WORLD_W - 80); const y = range(random, 80, WORLD_H - 260);
    if (!isOnRoad(x, y)) trees.push({ x, y, r: range(random, 9, 16), palm: random() > 0.45 });
  }
  for (const rx of V_ROADS) for (let y = 120; y < WORLD_H - 200; y += 170) lamps.push({ x: rx + ROAD_W / 2 + 8, y });
  for (const ry of H_ROADS) for (let x = 120; x < WORLD_W; x += 170) lamps.push({ x, y: ry + ROAD_W / 2 + 8 });

  const colliders = buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
  function collides(x, y, r) {
    if (x < r + 8 || y < r + 8 || x > WORLD_W - r - 8 || y > WORLD_H - r - 8) return true;
    for (const c of colliders) if (x + r > c.x && x - r < c.x + c.w && y + r > c.y && y - r < c.y + c.h) return true;
    return false;
  }
  function carCollides(x, y, r) { return collides(x, y, r); }
  function slideMove(obj, dx, dy, r) {
    if (!collides(obj.x + dx, obj.y, r)) obj.x += dx;
    if (!collides(obj.x, obj.y + dy, r)) obj.y += dy;
  }
  return { buildings, trees, lamps, colliders, collides, carCollides, slideMove, landmarks: LANDMARKS };
}
