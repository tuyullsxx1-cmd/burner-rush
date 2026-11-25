// Burner Rush — keyboard and mouse: WASD or arrows to walk, E or Space to use a
// station, Enter to start, R to restart, click a spot to walk there.
export function createInput(canvas) {
  const input = {
    mx: 0,
    my: 0,
    interact: false,
    clickTarget: null,
    keys: new Set(),
  };

  function recompute() {
    const keys = input.keys;
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const up = keys.has('ArrowUp') || keys.has('KeyW');
    const down = keys.has('ArrowDown') || keys.has('KeyS');
    input.mx = (right ? 1 : 0) - (left ? 1 : 0);
    input.my = (down ? 1 : 0) - (up ? 1 : 0);
  }

  function keyName(event) {
    return event.code;
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.keys.add(keyName(event));
    if (event.code === 'KeyE' || event.code === 'Space') input.interact = true;
    if (event.code === 'Enter') input.enter = true;
    if (event.code === 'KeyR') input.restart = true;
    recompute();
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(keyName(event));
    recompute();
  });

  window.addEventListener('blur', () => {
    input.keys.clear();
    recompute();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.clickTarget = { x, y };
    // A click walks the chef there first; the action fires on arrival (main.js).
    input.pendingInteract = true;
  });

  /** Edge flags (interact / enter / restart) live for one frame; call after each update. */
  input.consumeEdges = function consumeEdges() {
    input.interact = false;
    input.enter = false;
    input.restart = false;
  };

  return input;
}
