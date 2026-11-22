// Solara Bay - shared tuning constants for the whole game.
// One place for world size, speeds and economy so balancing touches a single file.
export const WORLD_W = 3600;
export const WORLD_H = 2600;
export const ROAD_W = 118;
export const STEP = 1 / 60;
export const SAVE_KEY = 'solara-bay-save-v1';
export const PLAYER_SPEED = 168;
export const PLAYER_SPRINT = 248;
export const PLAYER_RADIUS = 13;
export const CAR_ACCEL = 340;
export const CAR_MAX_SPEED = 430;
export const CAR_MAX_REVERSE = 130;
export const CAR_TURN = 2.35;
export const WANTED_DECAY_SECONDS = 26;
export const COP_SPAWN_INTERVAL = 3.2;
export const MAX_COPS_BY_STARS = [0, 2, 3, 5, 7, 9];
export const CHIP_TOTAL = 10;
export const WEAPONS = {
  fists: { name: 'Fists', damage: 16, range: 34, cooldown: 0.32, spread: 0 },
  pistol: { name: 'Harbor Pistol', damage: 34, range: 430, cooldown: 0.24, spread: 0.035 },
  smg: { name: 'Canal SMG', damage: 22, range: 370, cooldown: 0.09, spread: 0.09 },
};
