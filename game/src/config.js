// Burner Rush — shared constants: field size, station layout, recipes, timings.
// One job: every number the rest of the game reads, in one place.
export const FIELD = { width: 1280, height: 720 };

// The order board lives at the top of the screen; the kitchen floor below it.
export const BOARD = { x: 0, y: 0, width: 1280, height: 92 };
export const FLOOR = { x: 0, y: 92, width: 1280, height: 628 };

// Station rectangles on the floor (x, y, width, height). The chef walks between them.
export const STATIONS = {
  crates: { x: 24, y: 132, width: 150, height: 340, label: 'PANTRY' },
  board: { x: 230, y: 300, width: 190, height: 120, label: 'CHOPPING BOARD' },
  stove: { x: 500, y: 132, width: 260, height: 110, label: 'STOVE' },
  plates: { x: 830, y: 132, width: 120, height: 110, label: 'PLATES' },
  assembly: { x: 500, y: 380, width: 280, height: 130, label: 'ASSEMBLY' },
  window: { x: 1120, y: 200, width: 136, height: 240, label: 'SERVE' },
  trash: { x: 1120, y: 560, width: 136, height: 110, label: 'TRASH' },
};

// Ingredient crate slots inside the pantry, top to bottom.
export const CRATE_KINDS = ['tomato', 'lettuce', 'patty', 'bun', 'cheese'];

// What each dish needs, in the order the ticket lists them. A plate matches a dish
// when it holds exactly these items (chopped / cooked as marked), nothing extra.
export const DISHES = {
  salad: {
    id: 'salad',
    name: 'Garden Salad',
    coins: 10,
    steps: [
      { kind: 'tomato', chopped: true },
      { kind: 'lettuce', chopped: true },
    ],
  },
  burger: {
    id: 'burger',
    name: 'Cheese Burger',
    coins: 14,
    steps: [
      { kind: 'bun', chopped: false },
      { kind: 'patty', cooked: true },
      { kind: 'cheese', chopped: false },
    ],
  },
  deluxe: {
    id: 'deluxe',
    name: 'Deluxe Burger',
    coins: 18,
    steps: [
      { kind: 'bun', chopped: false },
      { kind: 'patty', cooked: true },
      { kind: 'cheese', chopped: false },
      { kind: 'tomato', chopped: true },
    ],
  },
};
export const DISH_ORDER = ['salad', 'burger', 'deluxe'];

// Timings, in seconds.
export const TIMING = {
  shiftLength: 150,
  chopSeconds: 1.4,
  cookSeconds: 6,
  burnSeconds: 5,
  firstOrderAt: 2,
  spawnStart: 14,
  spawnEnd: 8,
  patienceStart: 52,
  patienceEnd: 34,
  maxOrders: 4,
  startHearts: 3,
};

export const CHEF = { radius: 24, speed: 265 };

// Warm kitchen palette: cream walls, terracotta floor, teal counters, tomato red accents.
export const COLORS = {
  wall: '#f3e5c8',
  floorA: '#e8b48a',
  floorB: '#dfa173',
  counterTop: '#8a5a33',
  counterBody: '#5d3a1e',
  counterTrim: '#c98f4e',
  steel: '#b9c4cc',
  steelDark: '#8b98a3',
  teal: '#2e7d6b',
  tealDark: '#1f5a4d',
  cream: '#fff8e7',
  ink: '#2b2118',
  red: '#d9402e',
  green: '#4d9b3a',
  gold: '#f2b234',
  ticket: '#fffdf5',
  ticketEdge: '#d8c9a3',
  flame: '#ff9d2e',
};
