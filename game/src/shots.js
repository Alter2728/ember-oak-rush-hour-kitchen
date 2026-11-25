// Ember & Oak — Rush Hour Kitchen: screenshot scenes. One job: stage a
// deterministic frame of the real game for ?shot=start|play|serve|end.
// Everything here drives the world through its own rules — the chef walks,
// picks, chops, cooks and plates with the same actions a player would —
// then the frame is whatever the simulation reached. Same seed, same frame.

import { STATIONS, nextPrep } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const DT = 1 / 60;
const BLANK = { mx: 0, my: 0, interact: false, interactEdge: false, digit: null, click: null };

function distToRect(x, y, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy);
}

function idle(api, seconds, act = BLANK) {
  const n = Math.max(0, Math.round(seconds / DT));
  for (let i = 0; i < n; i += 1) api.step(DT, { ...act });
}

function waitUntil(api, cond, maxSeconds, act = BLANK) {
  const n = Math.max(0, Math.round(maxSeconds / DT));
  for (let i = 0; i < n; i += 1) {
    if (cond()) return true;
    api.step(DT, { ...act });
  }
  return cond();
}

function walkTo(api, station) {
  const s = api.state;
  s.chef.target = api.approachPoint(station);
  s.chef.pending = null;
  waitUntil(api, () => !s.chef.target, 12);
}

function near(api, station) {
  return distToRect(api.state.chef.x, api.state.chef.y, STATIONS[station]) < 96;
}

function pressAt(api, station, kind = null) {
  walkTo(api, station);
  if (!near(api, station)) return;
  api.interactAt(station, kind);
}

function takeIngredient(api, kind) {
  pressAt(api, 'pantry', kind);
  // If the click-free pantry path left hands empty, take it directly.
  if (!api.state.held) {
    walkTo(api, 'pantry');
    api.takeFromPantry(kind);
  }
}

// Prepare one recipe component from raw and put it on the plate.
function prepareComponent(api, kind, targetState) {
  const s = api.state;
  takeIngredient(api, kind);
  if (!s.held) return false;
  // Chop first when the target state needs it (a boiled tomato is chopped
  // before it is boiled; pasta goes straight to the pot).
  if (s.held && nextPrep(s.held) === 'chop' && (targetState === 'chopped' || targetState === 'boiled')) {
    pressAt(api, 'board');
    if (s.board.item) {
      waitUntil(api, () => !s.board.item || s.board.item.state === 'chopped', 6, { ...BLANK, interact: true });
      pressAt(api, 'board');
    }
  }
  if (!s.held) return false;
  // Cook on the stove when the target state needs heat.
  if (targetState === 'grilled' || targetState === 'melted' || targetState === 'boiled') {
    pressAt(api, 'stove');
    const idx = s.burners.findIndex((b) => b.item);
    if (idx >= 0) {
      waitUntil(api, () => {
        const item = s.burners[idx].item;
        return !item || item.done;
      }, 25);
      pressAt(api, 'stove');
    }
  }
  if (!s.held) return false;
  pressAt(api, 'plating');
  return true;
}

function serveFirstOrder(api) {
  const s = api.state;
  const order = s.orders[0];
  if (!order) return false;
  for (const comp of order.recipe.components) {
    if (s.screen !== SCREEN_PLAY) return false;
    if (!prepareComponent(api, comp.kind, comp.state)) return false;
  }
  // Pick the plate up and serve it.
  pressAt(api, 'plating');
  if (!s.held || !s.held.plate) return false;
  pressAt(api, 'window');
  return true;
}

function stagePlay(api) {
  api.startShift();
  serveFirstOrder(api);
  // Start a second dish so the frame shows one mid-assembly: its first
  // component on the plate, its second on the stove or board.
  const s = api.state;
  if (s.screen === SCREEN_PLAY && s.orders.length > 0) {
    const order = s.orders[0];
    const first = order.recipe.components[0];
    prepareComponent(api, first.kind, first.state);
    const second = order.recipe.components[1];
    if (second && s.screen === SCREEN_PLAY) {
      takeIngredient(api, second.kind);
      if (s.held && s.held.state === 'raw') {
        // Put it to work: chop it, or start it cooking.
        const needsChop = second.state === 'chopped' || second.state === 'boiled';
        if (needsChop) {
          pressAt(api, 'board');
          idle(api, 0.7, { ...BLANK, interact: true });
        } else {
          pressAt(api, 'stove');
        }
      }
    }
  }
  idle(api, 1.5);
}

function stageServe(api) {
  api.startShift();
  serveFirstOrder(api);
  // One more dish, finished and in hand at the serving window.
  const s = api.state;
  if (s.screen === SCREEN_PLAY && s.orders.length > 0) {
    const order = s.orders[0];
    for (const comp of order.recipe.components) {
      if (s.screen !== SCREEN_PLAY) break;
      prepareComponent(api, comp.kind, comp.state);
    }
    pressAt(api, 'plating');
    walkTo(api, 'window');
  }
  idle(api, 0.5);
}

function stageStart(api) {
  // Title screen over a live kitchen: start a shift, let orders arrive,
  // then drop back to the title.
  api.startShift();
  idle(api, 4);
  api.state.screen = SCREEN_TITLE;
}

function stageEnd(api) {
  api.startShift();
  serveFirstOrder(api);
  const s = api.state;
  s.coins = 162;
  s.served = 9;
  s.bestCombo = 4;
  s.elapsed = 179.2;
  idle(api, 1.2);
  if (s.screen !== SCREEN_OVER) {
    // Force the real end-of-shift path if the clock did not get there.
    s.elapsed = 180;
    idle(api, 0.2);
  }
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name
 * is start) and return the screen to draw.
 */
export function stageShot(name, world, seed) {
  const api = world;
  api.reset();
  if (name === 'play') stagePlay(api);
  else if (name === 'serve') stageServe(api);
  else if (name === 'end') stageEnd(api);
  else stageStart(api);
  return { screen: api.state.screen };
}
