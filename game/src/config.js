// Ember & Oak — Rush Hour Kitchen: tuning, ingredients, recipes and levels.
// One job: every number and name the simulation and the renderer agree on.

export const VIEW = { width: 1280, height: 720 };
export const FLOOR = { x: 0, y: 132, width: 1280, height: 508 };
export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 150;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 4;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 22;

// A component is one prepared ingredient on a plate. `prep` is the state the
// ingredient must reach: raw, chopped, grilled, boiled or melted.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e5484d', prep: ['chop', 'boil'], key: '1', price: 0 },
  lettuce: { name: 'Lettuce', color: '#7dc383', prep: ['chop'], key: '2', price: 0 },
  onion: { name: 'Onion', color: '#c9a0dc', prep: ['chop'], key: '3', price: 0 },
  patty: { name: 'Patty', color: '#8a5a3b', prep: ['grill'], key: '4', price: 0 },
  cheese: { name: 'Cheese', color: '#f5c542', prep: ['grill'], key: '5', price: 0 },
  bun: { name: 'Bun', color: '#e8b96f', prep: [], key: '6', price: 0 },
  pasta: { name: 'Pasta', color: '#f2d492', prep: ['boil'], key: '7', price: 0 },
};

export const INGREDIENT_ORDER = ['tomato', 'lettuce', 'onion', 'patty', 'cheese', 'bun', 'pasta'];

// How long each prep step takes, in seconds. Burn grace is the extra time a
// cooked item survives on the stove before it is ruined.
export const PREP_TIME = { chop: 1.8, grill: 6.0, boil: 7.0 };
export const BURN_GRACE = 5.0;

// A recipe is a set of components, each naming an ingredient and the prep
// state it must be in when it lands on the plate.
export const RECIPES = [
  {
    id: 'salad', name: 'Garden Salad', price: 12, level: 1,
    components: [
      { kind: 'tomato', state: 'chopped' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'burger', name: 'Ember Burger', price: 18, level: 1,
    components: [
      { kind: 'patty', state: 'grilled' },
      { kind: 'bun', state: 'raw' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'soup', name: 'Sunny Soup', price: 20, level: 2,
    components: [
      { kind: 'tomato', state: 'boiled' },
      { kind: 'onion', state: 'chopped' },
    ],
  },
  {
    id: 'pasta', name: 'Pasta Pomodoro', price: 22, level: 2,
    components: [
      { kind: 'pasta', state: 'boiled' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'melt', name: 'Cheesy Melt', price: 24, level: 3,
    components: [
      { kind: 'patty', state: 'grilled' },
      { kind: 'cheese', state: 'melted' },
      { kind: 'bun', state: 'raw' },
    ],
  },
];

// An item's display label, e.g. "Chopped Tomato" or "Grilled Patty".
export function componentLabel(component) {
  const base = INGREDIENTS[component.kind].name;
  if (component.state === 'raw') return base;
  const word = { chopped: 'Chopped', grilled: 'Grilled', boiled: 'Boiled', melted: 'Melted' }[component.state];
  return `${word} ${base}`;
}

// The next prep step for an item, or null when it is done / cannot be prepped.
export function nextPrep(item) {
  const chain = INGREDIENTS[item.kind].prep;
  if (item.state === 'raw') return chain[0] ?? null;
  if (item.state === 'chopped') return chain.includes('boil') ? 'boil' : null;
  return null;
}

export function stateAfterPrep(item, prep) {
  if (prep === 'chop') return 'chopped';
  if (prep === 'grill') return item.kind === 'cheese' ? 'melted' : 'grilled';
  if (prep === 'boil') return 'boiled';
  return item.state;
}

// Per-level pacing: a new level every minute of the shift.
export function levelFor(elapsed) {
  return Math.min(3, 1 + Math.floor(elapsed / 60));
}

export function recipesForLevel(level) {
  return RECIPES.filter((recipe) => recipe.level <= level);
}

export function spawnIntervalFor(level) {
  return [0, 15, 12, 10][level];
}

export function patienceFor(level) {
  return [0, 75, 65, 55][level];
}

export const STATIONS = {
  pantry: { x: 24, y: 168, w: 208, h: 96, label: 'PANTRY' },
  board: { x: 264, y: 168, w: 176, h: 96, label: 'CHOPPING BOARD' },
  stove: { x: 472, y: 168, w: 264, h: 96, label: 'STOVE' },
  plating: { x: 768, y: 168, w: 208, h: 96, label: 'PLATING' },
  window: { x: 1008, y: 168, w: 248, h: 96, label: 'SERVING WINDOW' },
  trash: { x: 24, y: 576, w: 104, h: 56, label: 'TRASH' },
};

// Burner slots on the stove, relative to the stove rect.
export const BURNERS = [
  { dx: 36, dy: 18, w: 88, h: 60 },
  { dx: 140, dy: 18, w: 88, h: 60 },
];

export const PANTRY_SLOTS = INGREDIENT_ORDER.map((kind, i) => ({
  kind,
  x: STATIONS.pantry.x + 8 + i * 28,
  y: STATIONS.pantry.y + 30,
  w: 24,
  h: 24,
}));
