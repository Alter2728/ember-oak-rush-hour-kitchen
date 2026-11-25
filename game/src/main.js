// Ember & Oak — Rush Hour Kitchen: the loop. One job: wire input, world,
// audio and renderer together, and run the frame.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawGame, startButtonRect, againButtonRect, pointInRect } from './render.js';
import { createWorld, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = createAudio();
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

const world = createWorld(seed);
let paused = false;
let lastTime = performance.now();
let shotTime = 1.0;

function playEventSounds(events) {
  for (const event of events) {
    switch (event.type) {
      case 'pickup': audio.pickup(); break;
      case 'place': audio.place(); break;
      case 'chop': audio.chop(); break;
      case 'chopDone': audio.chopDone(); break;
      case 'sizzle': audio.sizzle(); break;
      case 'cookDone': audio.cookDone(); break;
      case 'burn': audio.burn(); break;
      case 'plate': audio.plate(); break;
      case 'serve': audio.serve(); break;
      case 'coin': audio.coin(); break;
      case 'fail': audio.fail(); break;
      case 'win': audio.win(); break;
      case 'order': audio.tick(); break;
      default: break;
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now / 1000;

  // Global keys.
  if (input.wasPressed('KeyM')) {
    const muted = audio.toggleMute();
    document.getElementById('mute').textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
  }
  if (input.wasPressed('KeyP') && world.state.screen === SCREEN_PLAY) paused = !paused;

  const click = input.consumeClick();
  const mouse = input.mouse();
  const hoverStation = world.stationAtPoint(mouse.x, mouse.y);

  if (world.state.screen === SCREEN_TITLE) {
    const start = input.wasPressed('Enter') || input.wasPressed('Space')
      || (click && pointInRect(click.x, click.y, startButtonRect()));
    if (start) {
      audio.unlock();
      world.startShift();
    }
  } else if (world.state.screen === SCREEN_OVER) {
    const again = input.wasPressed('KeyR')
      || (click && pointInRect(click.x, click.y, againButtonRect()));
    if (again) {
      audio.unlock();
      world.startShift();
    }
  } else if (world.state.screen === SCREEN_PLAY && !paused) {
    const axis = input.axis();
    const act = {
      mx: axis.x,
      my: axis.y,
      interact: input.interactDown(),
      interactEdge: input.wasPressed('KeyE') || input.wasPressed('Space'),
      digit: input.digitPressed(),
      click,
    };
    world.step(dt, act);
    playEventSounds(world.events());
  }

  drawGame(ctx, world.state, { time, hoverStation, paused });
  input.endFrame();
  requestAnimationFrame(frame);
}

function frameShot() {
  // Screenshot mode: the scene is staged once, then drawn with a frozen
  // clock so every capture of the same URL shows the same frame.
  drawGame(ctx, world.state, { time: shotTime, hoverStation: null, paused: false });
  requestAnimationFrame(frameShot);
}

if (shotName) {
  stageShot(shotName, world, seed);
  // Frame only the canvas: hide the page chrome so the shot is the game.
  document.getElementById('mute').style.display = 'none';
  document.getElementById('bar').style.display = 'none';
  document.getElementById('help').style.display = 'none';
  document.getElementById('wrap').style.padding = '0';
  requestAnimationFrame(frameShot);
} else {
  requestAnimationFrame(frame);
}

document.getElementById('mute').addEventListener('click', () => {
  const muted = audio.toggleMute();
  document.getElementById('mute').textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
});
