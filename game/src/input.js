// Ember & Oak — Rush Hour Kitchen: keyboard and mouse input.
// The world reads a plain snapshot each frame: movement axes, held keys,
// edge-triggered presses, and the mouse (position + click target).

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
  let interactHeld = false;

  function codeOf(event) {
    return event.code;
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(codeOf(event));
    keys.add(codeOf(event));
  });
  window.addEventListener('keyup', (event) => keys.delete(codeOf(event)));
  window.addEventListener('blur', () => keys.clear());

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.clicked = true;
    mouse.clickX = p.x;
    mouse.clickY = p.y;
  });

  return {
    // Movement axis from WASD or arrow keys, normalised.
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    interactDown() {
      return keys.has('KeyE') || keys.has('Space');
    },
    // Edge-triggered: true once per physical press, then consumed by endFrame.
    wasPressed(code) {
      return pressed.has(code);
    },
    // Number keys 1-7 select a pantry ingredient; returns the digit or null.
    digitPressed() {
      for (let d = 1; d <= 7; d += 1) {
        if (pressed.has(`Digit${d}`)) return d;
      }
      return null;
    },
    mouse() {
      return mouse;
    },
    consumeClick() {
      const had = mouse.clicked;
      mouse.clicked = false;
      return had ? { x: mouse.clickX, y: mouse.clickY } : null;
    },
    endFrame() {
      pressed.clear();
      interactHeld = this.interactDown();
    },
    get interactHeld() {
      return interactHeld;
    },
  };
}
