// Burner Rush — boot and frame loop: title, play, game over, and the scripted
// ?shot= scenes the screenshots are taken from. One job: wire input, rules,
// drawing and sound together, nothing else.
import { FIELD } from './config.js';
import { createInput } from './input.js';
import { mulberry32 } from './random.js';
import { drawScene } from './render.js';
import { stageShot } from './shots.js';
import { sound } from './sound.js';
import {
  EVENT_BURNT,
  EVENT_CHOP_DONE,
  EVENT_COOK_DONE,
  EVENT_FAILED,
  EVENT_OVER,
  EVENT_PICKUP,
  EVENT_SERVED,
  createWorld,
  nearestStation,
  startShift,
  tryInteract,
  updateWorld,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

function playEventSounds(state) {
  for (const event of state.events.splice(0)) {
    if (event === EVENT_PICKUP) sound.pickup();
    else if (event === EVENT_CHOP_DONE) sound.chopDone();
    else if (event === EVENT_COOK_DONE) sound.cookDone();
    else if (event === EVENT_BURNT) sound.burnt();
    else if (event === EVENT_SERVED) sound.served();
    else if (event === EVENT_FAILED) sound.failed();
  }
}

if (shotName) {
  // Screenshot mode: stage the scene from the real rules, draw it once.
  const help = document.getElementById('help');
  if (help) help.style.display = 'none';
  const staged = stageShot(shotName, seed);
  drawScene(ctx, staged.state);
  document.title = `Burner Rush — shot ${shotName}`;
} else {
  const state = createWorld(mulberry32((Math.random() * 1e9) | 0), 1);
  const input = createInput(canvas);
  let last = performance.now();
  let lastTickSecond = -1;

  canvas.addEventListener('pointerdown', () => {
    if (state.screen === 'title') startShift(state);
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.screen === 'title' && input.enter) startShift(state);
    if (state.screen === 'over' && input.restart) startShift(state);
    if (state.screen === 'play') {
      const second = Math.ceil(state.timeLeft);
      if (second !== lastTickSecond && second <= 10 && second > 0) {
        lastTickSecond = second;
        sound.tick();
      }
      if (input.pendingInteract) {
        if (nearestStation(state)) {
          tryInteract(state);
          input.pendingInteract = false;
          input.clickTarget = null;
        } else if (!input.clickTarget) {
          // Arrived at an open spot with no station in reach: drop the tap.
          input.pendingInteract = false;
        }
      }
      updateWorld(state, dt, input);
    }
    playEventSounds(state);
    drawScene(ctx, state);
    input.consumeEdges();
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') sound.toggleMute();
  });

  drawScene(ctx, state);
  requestAnimationFrame(frame);
}

export { FIELD };
