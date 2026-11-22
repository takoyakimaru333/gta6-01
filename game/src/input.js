// Keyboard + mouse input: held movement keys, mouse aim position, and one-shot action flags.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_WEAPON = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseX = 0; let mouseY = 0; let mouseDown = false;
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (!e.repeat) {
      if (e.code === 'Space' || e.code === 'Enter') actions |= ACTION_CONFIRM;
      if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACTION_PAUSE;
      if (e.code === 'KeyE' || e.code === 'KeyF') actions |= ACTION_ENTER;
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'KeyQ') actions |= ACTION_WEAPON;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); mouseDown = false; });
  canvas.addEventListener('pointermove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  canvas.addEventListener('pointerdown', (e) => { mouseDown = true; mouseX = e.clientX; mouseY = e.clientY; actions |= ACTION_CONFIRM; });
  window.addEventListener('pointerup', () => { mouseDown = false; });
  return {
    keys, get mouseX() { return mouseX; }, get mouseY() { return mouseY; }, get mouseDown() { return mouseDown; },
    axis() {
      const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      const y = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
      return { x, y };
    },
    sprint() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    brake() { return keys.has('Space'); },
    takeActions() { const a = actions; actions = 0; return a; },
  };
}
