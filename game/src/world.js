// Ember & Oak — Rush Hour Kitchen: the simulation. One job: the rules.
// Orders, stations, the chef, items, scoring — no drawing, no DOM.

import {
  BURNERS, BURN_GRACE, CHEF_RADIUS, CHEF_SPEED, FLOOR, INGREDIENTS,
  INGREDIENT_ORDER, MAX_ORDERS, MAX_STRIKES, PREP_TIME, RECIPES, SHIFT_SECONDS,
  STATIONS, TARGET_COINS, componentLabel, levelFor, nextPrep, patienceFor,
  recipesForLevel, spawnIntervalFor, stateAfterPrep,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const INTERACT_RANGE = 96;

function makeItem(kind) {
  return { kind, state: 'raw', progress: 0, burnt: false };
}

function sameComponents(a, b) {
  if (a.length !== b.length) return false;
  const key = (c) => `${c.kind}:${c.state}`;
  const sortedA = a.map(key).sort().join('|');
  const sortedB = b.map(key).sort().join('|');
  return sortedA === sortedB;
}

function plateMatchesOrder(plate, recipe) {
  return sameComponents(plate, recipe.components);
}

// Is this prepared item a component of any recipe at all?
function isPlatable(item) {
  return RECIPES.some((r) =>
    r.components.some((c) => c.kind === item.kind && c.state === item.state));
}

function rectOf(station) {
  return STATIONS[station];
}

function distToRect(x, y, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy);
}

export function createWorld(seed = 20261125) {
  // The RNG lives in the state (as a plain number) so reset() restores the
  // exact stream: same seed, same orders, same staged screenshot.
  const world = {
    screen: SCREEN_TITLE,
    seed,
    rngState: seed >>> 0 || 1,
    nextOrderId: 1,
    chef: { x: 640, y: 460, target: null, pending: null, facing: 1 },
    held: null,
    board: { item: null },
    burners: BURNERS.map(() => ({ item: null })),
    plate: { components: [] },
    plateHeld: false,
    orders: [],
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    strikes: 0,
    elapsed: 0,
    level: 1,
    spawnTimer: 6,
    won: false,
    events: [],
    toasts: [],
    lastChopTick: 0,
  };

  // mulberry32, stepped on the state's own counter.
  function rnd() {
    world.rngState = (world.rngState + 0x6d2b79f5) >>> 0;
    let t = world.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function toast(text, color = '#fff') {
    world.toasts.push({ text, color, t: 0 });
    if (world.toasts.length > 4) world.toasts.shift();
  }

  function emit(type, data = {}) {
    world.events.push({ type, ...data });
  }

  function spawnOrder() {
    const pool = recipesForLevel(world.level);
    const recipe = pool[Math.floor(rnd() * pool.length)];
    const patience = patienceFor(world.level);
    world.orders.push({
      id: world.nextOrderId, recipe, patience, maxPatience: patience,
    });
    world.nextOrderId += 1;
    emit('order');
  }

  function nearestStation(maxDist = INTERACT_RANGE) {
    let best = null;
    let bestDist = maxDist;
    for (const name of Object.keys(STATIONS)) {
      const d = distToRect(world.chef.x, world.chef.y, rectOf(name));
      if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
  }

  function stationAtPoint(x, y) {
    for (const name of Object.keys(STATIONS)) {
      const r = rectOf(name);
      if (x >= r.x - 8 && x <= r.x + r.w + 8 && y >= r.y - 8 && y <= r.y + r.h + 8) return name;
    }
    return null;
  }

  function pantryKindAtPoint(x, y) {
    for (const slot of pantrySlots()) {
      if (x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h) return slot.kind;
    }
    return null;
  }

  function pantrySlots() {
    return INGREDIENT_ORDER.map((kind, i) => ({
      kind,
      x: STATIONS.pantry.x + 8 + i * 28,
      y: STATIONS.pantry.y + 34,
      w: 24,
      h: 24,
    }));
  }

  function approachPoint(station) {
    const r = rectOf(station);
    // Stand just outside the station's collision box: below it, or above
    // it for the trash bin, which sits at the floor's bottom edge.
    const fromAbove = r.y + r.h > FLOOR.y + FLOOR.height - 100;
    return {
      x: Math.max(r.x + 24, Math.min(world.chef.x, r.x + r.w - 24)),
      y: fromAbove
        ? r.y - CHEF_RADIUS - 14
        : r.y + r.h + CHEF_RADIUS + 14,
    };
  }

  function takeFromPantry(kind) {
    if (world.held) { toast('Hands full!', '#ffb3b3'); return; }
    if (!INGREDIENTS[kind]) return;
    world.held = makeItem(kind);
    emit('pickup');
    toast(`Picked up ${INGREDIENTS[kind].name}`, '#d8f7d8');
  }

  function interactAt(station, kind = null) {
    const chef = world.chef;
    if (station === 'pantry') {
      if (kind) takeFromPantry(kind);
      else toast('Pick an ingredient: click a crate or press 1-7', '#ffe9a8');
      return;
    }
    if (station === 'trash') {
      if (world.held) {
        const label = world.held.plate ? 'plate' : componentLabel(world.held);
        world.held = null;
        emit('place');
        toast(`Trashed ${label}`, '#ffb3b3');
      }
      return;
    }
    if (station === 'board') {
      const board = world.board;
      if (!board.item && world.held && !world.held.plate) {
        if (nextPrep(world.held) === 'chop') {
          board.item = world.held;
          world.held = null;
          emit('place');
        } else {
          toast(`${componentLabel(world.held)} can't be chopped`, '#ffb3b3');
        }
      } else if (board.item && !world.held && board.item.state !== 'raw') {
        // A chopped item comes off the board; a raw one stays put until
        // it is chopped (hold E), so one press never steals it mid-chop.
        world.held = board.item;
        board.item = null;
        emit('pickup');
      } else if (board.item && !world.held) {
        toast('Hold E to chop it', '#ffe9a8');
      } else if (board.item && world.held) {
        toast('Hands full!', '#ffb3b3');
      }
      return;
    }
    if (station === 'stove') {
      // Take a finished burner item first, then place a cookable one.
      if (!world.held || world.held.plate) {
        const done = world.burners.find((b) => b.item && b.item.progress >= 1 && !b.item.burnt);
        if (done && !world.held) {
          world.held = done.item;
          done.item = null;
          emit('pickup');
          return;
        }
        const burnt = world.burners.find((b) => b.item && b.item.burnt);
        if (burnt && !world.held) {
          world.held = burnt.item;
          burnt.item = null;
          emit('pickup');
          toast('Burnt! Trash it.', '#ffb3b3');
          return;
        }
        if (world.held?.plate) toast('A plate does not go on the stove', '#ffb3b3');
        else toast('Still cooking…', '#ffe9a8');
        return;
      }
      const prep = nextPrep(world.held);
      if (prep !== 'grill' && prep !== 'boil') {
        toast(`${componentLabel(world.held)} can't be cooked`, '#ffb3b3');
        return;
      }
      const free = world.burners.find((b) => !b.item);
      if (!free) { toast('Both burners are busy!', '#ffb3b3'); return; }
      free.item = { ...world.held, prep, targetState: stateAfterPrep(world.held, prep), progress: 0, done: false };
      world.held = null;
      emit('sizzle');
      return;
    }
    if (station === 'plating') {
      if (world.held && world.held.plate) {
        // Put the plate back down.
        if (world.plate.components.length === 0) {
          world.plate.components = world.held.components;
          world.held = null;
          emit('place');
        } else {
          toast('The plate is already on the counter', '#ffb3b3');
        }
        return;
      }
      if (world.held && !world.held.plate) {
        if (world.held.burnt) { toast('Burnt food goes in the trash!', '#ffb3b3'); return; }
        if (!isPlatable(world.held)) {
          toast(`${componentLabel(world.held)} is not ready yet`, '#ffb3b3');
          return;
        }
        if (world.plate.components.length >= 4) { toast('Plate is full', '#ffb3b3'); return; }
        world.plate.components.push({ kind: world.held.kind, state: world.held.state });
        world.held = null;
        emit('plate');
        return;
      }
      // Empty hands: pick the plate up if it has anything on it.
      if (world.plate.components.length > 0) {
        world.held = { plate: true, components: world.plate.components };
        world.plate.components = [];
        emit('pickup');
      }
      return;
    }
    if (station === 'window') {
      if (!world.held || !world.held.plate) {
        toast('Bring a finished plate to serve', '#ffe9a8');
        return;
      }
      const matches = world.orders.filter((o) => plateMatchesOrder(world.held.components, o.recipe));
      if (matches.length === 0) {
        toast('No order wants this plate', '#ffb3b3');
        return;
      }
      matches.sort((a, b) => a.patience - b.patience);
      const order = matches[0];
      const frac = order.patience / order.maxPatience;
      const tip = Math.round(order.recipe.price * 0.5 * frac);
      const comboBonus = 1 + Math.min(world.combo, 10) * 0.1;
      const payout = Math.round((order.recipe.price + tip) * comboBonus);
      world.coins += payout;
      world.combo += 1;
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      world.served += 1;
      world.orders = world.orders.filter((o) => o.id !== order.id);
      world.held = null;
      emit('serve', { payout, recipe: order.recipe.name });
      emit('coin');
      toast(`Served ${order.recipe.name}! +$${payout}${world.combo > 1 ? `  Combo x${world.combo}` : ''}`, '#a8f0a8');
      return;
    }
  }

  function collide() {
    const c = world.chef;
    c.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.width - CHEF_RADIUS, c.x));
    c.y = Math.max(FLOOR.y + CHEF_RADIUS, Math.min(FLOOR.y + FLOOR.height - CHEF_RADIUS, c.y));
    for (const name of Object.keys(STATIONS)) {
      const r = rectOf(name);
      const left = r.x - CHEF_RADIUS;
      const right = r.x + r.w + CHEF_RADIUS;
      const top = r.y - CHEF_RADIUS;
      const bottom = r.y + r.h + CHEF_RADIUS;
      if (c.x > left && c.x < right && c.y > top && c.y < bottom) {
        const pushLeft = c.x - left;
        const pushRight = right - c.x;
        const pushTop = c.y - top;
        const pushBottom = bottom - c.y;
        const min = Math.min(pushLeft, pushRight, pushTop, pushBottom);
        if (min === pushLeft) c.x = left;
        else if (min === pushRight) c.x = right;
        else if (min === pushTop) c.y = top;
        else c.y = bottom;
      }
    }
  }

  function stepPlay(dt, act) {
    world.elapsed += dt;
    world.level = levelFor(world.elapsed);

    // Spawn orders on a timer.
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0 && world.orders.length < MAX_ORDERS) {
      spawnOrder();
      world.spawnTimer = spawnIntervalFor(world.level);
    } else if (world.spawnTimer <= 0) {
      world.spawnTimer = 2;
    }

    // Patience drains; an expired order is a strike.
    for (const order of [...world.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        world.orders = world.orders.filter((o) => o.id !== order.id);
        world.expired += 1;
        world.strikes += 1;
        world.combo = 0;
        emit('fail');
        toast(`Order expired: ${order.recipe.name}! Strike ${world.strikes}/${MAX_STRIKES}`, '#ffb3b3');
        if (world.strikes >= MAX_STRIKES) { endShift(false); return; }
      }
    }

    // Chopping: hold interact near the board while an item waits there.
    const near = nearestStation();
    if (near === 'board' && world.board.item && act.interact) {
      const item = world.board.item;
      item.progress += dt / PREP_TIME.chop;
      if (world.elapsed - world.lastChopTick > 0.32) {
        world.lastChopTick = world.elapsed;
        emit('chop');
      }
      if (item.progress >= 1) {
        item.state = 'chopped';
        item.progress = 0;
        emit('chopDone');
        toast(`${componentLabel(item)} ready`, '#d8f7d8');
      }
    }

    // Cooking: burners run on their own; overcook and they burn.
    for (const burner of world.burners) {
      const item = burner.item;
      if (!item) continue;
      const total = PREP_TIME[item.prep];
      item.progress += dt / total;
      if (!item.done && item.progress >= 1) {
        item.done = true;
        item.state = item.targetState;
        emit('cookDone');
        toast(`${componentLabel(item)} is ready!`, '#d8f7d8');
      }
      if (!item.burnt && item.progress >= 1 + BURN_GRACE / total) {
        item.burnt = true;
        item.state = 'burnt';
        emit('burn');
        toast('Something burned on the stove!', '#ffb3b3');
      }
    }

    // Movement: keyboard wins over click-to-move.
    const chef = world.chef;
    if (act.mx !== 0 || act.my !== 0) {
      chef.target = null;
      chef.pending = null;
      chef.x += act.mx * CHEF_SPEED * dt;
      chef.y += act.my * CHEF_SPEED * dt;
      if (act.mx !== 0) chef.facing = act.mx > 0 ? 1 : -1;
    } else if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        chef.target = null;
        if (chef.pending) {
          const pending = chef.pending;
          chef.pending = null;
          interactAt(pending.station, pending.kind);
        }
      } else {
        chef.x += (dx / dist) * CHEF_SPEED * dt;
        chef.y += (dy / dist) * CHEF_SPEED * dt;
        chef.facing = dx >= 0 ? 1 : -1;
      }
    }

    // Mouse click: a station becomes a walk-to + act-on-arrival; anywhere
    // else is just a walk-to point.
    if (act.click) {
      const station = stationAtPoint(act.click.x, act.click.y);
      if (station) {
        const kind = station === 'pantry' ? pantryKindAtPoint(act.click.x, act.click.y) : null;
        chef.target = approachPoint(station);
        chef.pending = { station, kind };
      } else {
        chef.target = {
          x: Math.max(FLOOR.x + 30, Math.min(FLOOR.x + FLOOR.width - 30, act.click.x)),
          y: Math.max(FLOOR.y + 30, Math.min(FLOOR.y + FLOOR.height - 30, act.click.y)),
        };
        chef.pending = null;
      }
    }

    // Edge-triggered interact (E / Space) at the nearest station.
    if (act.interactEdge) {
      const station = nearestStation();
      if (station) interactAt(station);
    }

    // Number keys grab a pantry ingredient when standing by the pantry.
    if (act.digit) {
      const kind = INGREDIENT_ORDER[act.digit - 1];
      if (kind && nearestStation() === 'pantry') takeFromPantry(kind);
      else if (kind) toast('Go to the pantry first', '#ffe9a8');
    }

    collide();

    // Toasts age out.
    for (const t of world.toasts) t.t += dt;
    world.toasts = world.toasts.filter((t) => t.t < 3.2);

    // Shift end.
    if (world.elapsed >= SHIFT_SECONDS) {
      endShift(world.coins >= TARGET_COINS);
    }
  }

  function endShift(won) {
    world.won = won;
    world.screen = SCREEN_OVER;
    emit(won ? 'win' : 'fail');
  }

  return {
    state: world,
    reset() {
      const fresh = createWorld(world.seed);
      Object.keys(world).forEach((k) => { world[k] = fresh.state[k]; });
      world.screen = SCREEN_TITLE;
    },
    startShift() {
      this.reset();
      world.screen = SCREEN_PLAY;
      world.spawnTimer = 4;
      spawnOrder();
      spawnOrder();
      emit('order');
    },
    step(dt, act) {
      if (world.screen !== SCREEN_PLAY) return;
      stepPlay(dt, act);
    },
    // Direct hooks for the screenshot autopilot and for tests.
    interactAt,
    nearestStation,
    stationAtPoint,
    pantryKindAtPoint,
    approachPoint,
    takeFromPantry,
    spawnOrder,
    toast,
    emit,
    events() {
      const out = world.events;
      world.events = [];
      return out;
    },
  };
}
