// Seeded random (mulberry32) so screenshot scenes and city layout are repeatable.
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pick(random, list) { return list[Math.floor(random() * list.length)]; }
export function range(random, lo, hi) { return lo + random() * (hi - lo); }
