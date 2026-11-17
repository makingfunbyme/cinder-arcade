export function createInput(canvas) {
  const input = { keys: new Set(), mouse: { x: 650, y: 300, down: false }, pause: false, start: false, restart: false };
  window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    input.keys.add(e.code);
    if (!e.repeat) {
      if (e.code === 'KeyP') input.pause = true;
      if (e.code === 'KeyR') input.restart = true;
      if (e.code === 'Space' || e.code === 'Enter') input.start = true;
    }
  });
  window.addEventListener('keyup', e => input.keys.delete(e.code));
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * canvas.width / r.width;
    input.mouse.y = (e.clientY - r.top) * canvas.height / r.height;
  });
  canvas.addEventListener('mousedown', e => { if (e.button === 0) { input.mouse.down = true; input.start = true; } });
  window.addEventListener('mouseup', () => input.mouse.down = false);
  window.addEventListener('blur', () => { input.keys.clear(); input.mouse.down = false; input.pause = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  return input;
}
