// Screenshot scene descriptors for ?shot=<name>: main.js stages each scene with real
// game state (never a fake image), renders it, and sets window.__shotReady when painted.
export const SHOT_SCENES = {
  start: { screen: 'title', description: 'Title screen over the living city' },
  chase: { screen: 'play', description: 'Police chase with wanted stars, minimap and mission objective' },
  car: { screen: 'play', description: 'Driving a stolen Palma Coupe through downtown traffic' },
  mission: { screen: 'play', description: 'Warehouse mission shootout on foot with guards' },
};
export function shotScene(name) { return SHOT_SCENES[name] || SHOT_SCENES.start; }
