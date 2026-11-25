// Burner Rush — the kitchen itself: state, movement, chopping, cooking, plating,
// serving, orders and the shift clock. One job: the rules, nothing drawn here.
import { BOARD, CHEF, COLORS, CRATE_KINDS, FLOOR, STATIONS, TIMING } from './config.js';
import { clamp } from './random.js';
import { findMatchingOrder, makeOrder, resetOrderIds, spawnInterval } from './recipes.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_CHOP_DONE = 'chop_done';
export const EVENT_COOK_DONE = 'cook_done';
export const EVENT_BURNT = 'burnt';
export const EVENT_SERVED = 'served';
export const EVENT_FAILED = 'failed';
export const EVENT_OVER = 'over';

const INTERACT_RANGE = 78;

function newItem(kind) {
  return { kind, chopped: false, cooked: false, burnt: false };
}

function newPlate() {
  return { kind: 'plate', items: [] };
}

export function createWorld(rng, seed) {
  resetOrderIds();
  return {
    rng,
    seed,
    screen: 'title',
    time: 0,
    timeLeft: TIMING.shiftLength,
    hearts: TIMING.startHearts,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    best: 0,
    overReason: '',
    chef: { x: 640, y: 590, dirX: 0, dirY: 1, moving: false, carrying: null },
    board: { item: null, progress: 0, chopping: false },
    burners: [
      { item: null, progress: 0, done: false, burnt: false },
      { item: null, progress: 0, done: false, burnt: false },
    ],
    assembly: { plate: null },
    orders: [],
    spawnTimer: TIMING.firstOrderAt,
    particles: [],
    floats: [],
    events: [],
  };
}

export function startShift(state) {
  const fresh = createWorld(state.rng, state.seed);
  fresh.screen = 'play';
  fresh.best = state.best;
  Object.assign(state, fresh);
}

function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1.4 });
}

function burst(state, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = state.rng() * Math.PI * 2;
    const speed = 40 + state.rng() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.6 + state.rng() * 0.4,
      maxLife: 1,
      color,
      size: 3 + state.rng() * 4,
    });
  }
}

function rectDistance(px, py, rect) {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.width));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/** Which station the chef stands close enough to use, or null. */
export function nearestStation(state) {
  const chef = state.chef;
  let bestName = null;
  let bestDistance = INTERACT_RANGE;
  for (const name of Object.keys(STATIONS)) {
    const distance = rectDistance(chef.x, chef.y, STATIONS[name]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = name;
    }
  }
  return bestName;
}

function crateKindAt(state, y) {
  const rect = STATIONS.crates;
  const slot = Math.floor(((y - rect.y) / rect.height) * CRATE_KINDS.length);
  return CRATE_KINDS[clamp(slot, 0, CRATE_KINDS.length - 1)];
}

function canChop(item) {
  return item && !item.chopped && !item.cooked && (item.kind === 'tomato' || item.kind === 'lettuce');
}

/** The one context action: E, Space, or a click on the station.
 * `stationName` pins the station (the scripted pilot's steps name theirs);
 * live play uses the nearest station in reach. */
export function tryInteract(state, stationName) {
  if (state.screen !== 'play') return;
  const station = stationName && rectDistance(state.chef.x, state.chef.y, STATIONS[stationName]) < INTERACT_RANGE
    ? stationName
    : nearestStation(state);
  if (!station) return;
  const chef = state.chef;
  const carrying = chef.carrying;

  if (station === 'crates') {
    if (!carrying) {
      chef.carrying = newItem(crateKindAt(state, chef.y));
      state.events.push(EVENT_PICKUP);
    }
    return;
  }
  if (station === 'board') {
    const board = state.board;
    if (!board.item && canChop(carrying)) {
      board.item = carrying;
      board.progress = 0;
      board.chopping = true;
      chef.carrying = null;
      state.events.push(EVENT_PICKUP);
    } else if (board.item && board.item.chopped && !board.chopping && !carrying) {
      chef.carrying = board.item;
      board.item = null;
      state.events.push(EVENT_PICKUP);
    }
    return;
  }
  if (station === 'stove') {
    for (const burner of state.burners) {
      if (!burner.item && carrying && carrying.kind === 'patty' && !carrying.cooked && !carrying.chopped) {
        burner.item = carrying;
        burner.progress = 0;
        burner.done = false;
        burner.burnt = false;
        chef.carrying = null;
        state.events.push(EVENT_PICKUP);
        return;
      }
      if (burner.item && (burner.done || burner.burnt) && !carrying) {
        chef.carrying = burner.item;
        burner.item = null;
        burner.progress = 0;
        burner.done = false;
        burner.burnt = false;
        state.events.push(EVENT_PICKUP);
        return;
      }
    }
    return;
  }
  if (station === 'plates') {
    if (!carrying) {
      chef.carrying = newPlate();
      state.events.push(EVENT_PICKUP);
    }
    return;
  }
  if (station === 'assembly') {
    const assembly = state.assembly;
    if (!assembly.plate && carrying && carrying.kind === 'plate') {
      assembly.plate = carrying;
      chef.carrying = null;
      state.events.push(EVENT_PICKUP);
    } else if (assembly.plate && carrying && carrying.kind !== 'plate' && assembly.plate.items.length < 5) {
      assembly.plate.items.push(carrying);
      chef.carrying = null;
      state.events.push(EVENT_PICKUP);
    } else if (assembly.plate && !carrying) {
      chef.carrying = assembly.plate;
      assembly.plate = null;
      state.events.push(EVENT_PICKUP);
    }
    return;
  }
  if (station === 'window') {
    if (carrying && carrying.kind === 'plate' && carrying.items.length > 0) {
      servePlate(state, carrying);
      chef.carrying = null;
    }
    return;
  }
  if (station === 'trash') {
    if (carrying) {
      chef.carrying = null;
      state.events.push(EVENT_PICKUP);
    }
  }
}

function servePlate(state, plate) {
  const order = findMatchingOrder(plate.items, state.orders);
  const windowRect = STATIONS.window;
  const x = windowRect.x + windowRect.width / 2;
  const y = windowRect.y + windowRect.height / 2;
  if (order) {
    const timeFraction = order.patience / order.maxPatience;
    const tip = Math.round(10 * timeFraction);
    const comboBonus = state.combo >= 2 ? 2 : 0;
    const earned = order.dish.coins + tip + comboBonus;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    order.state = 'served';
    state.orders = state.orders.filter((entry) => entry !== order);
    addFloat(state, x, y - 30, `+${earned} coins`, COLORS.gold);
    if (timeFraction > 0.5) addFloat(state, x, y - 60, 'PERFECT!', COLORS.green);
    if (state.combo >= 3) addFloat(state, x, y - 90, `COMBO x${state.combo}`, COLORS.red);
    burst(state, x, y, COLORS.gold, 16);
    state.events.push(EVENT_SERVED);
  } else {
    state.hearts -= 1;
    state.failed += 1;
    state.combo = 0;
    addFloat(state, x, y - 30, 'WRONG DISH!', COLORS.red);
    burst(state, x, y, COLORS.red, 10);
    state.events.push(EVENT_FAILED);
    if (state.hearts <= 0) endShift(state, 'hearts');
  }
}

function endShift(state, reason) {
  state.screen = 'over';
  state.overReason = reason;
  state.best = Math.max(state.best, state.coins);
  state.events.push(EVENT_OVER);
}

/** True when a circle at x, y with the chef's radius overlaps any station. */
function hitsStation(x, y) {
  for (const rect of Object.values(STATIONS)) {
    const closestX = clamp(x, rect.x, rect.x + rect.width);
    const closestY = clamp(y, rect.y, rect.y + rect.height);
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < CHEF.radius * CHEF.radius) return true;
  }
  return false;
}

function moveChef(state, dt, input) {
  const chef = state.chef;
  let mx = input.mx;
  let my = input.my;
  if (input.clickTarget) {
    const dx = input.clickTarget.x - chef.x;
    const dy = input.clickTarget.y - chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 8) {
      mx = dx / distance;
      my = dy / distance;
    } else {
      mx = 0;
      my = 0;
      input.clickTarget = null;
    }
  }
  const length = Math.hypot(mx, my);
  if (length > 0) {
    mx /= length;
    my /= length;
    chef.dirX = mx;
    chef.dirY = my;
    chef.moving = true;
  } else {
    chef.moving = false;
  }
  // If the chef somehow starts overlapped with a counter, push out radially
  // once so the axis-separated steps below can move freely again.
  for (const rect of Object.values(STATIONS)) {
    const closestX = clamp(chef.x, rect.x, rect.x + rect.width);
    const closestY = clamp(chef.y, rect.y, rect.y + rect.height);
    const dx = chef.x - closestX;
    const dy = chef.y - closestY;
    const distance = Math.hypot(dx, dy);
    if (distance < CHEF.radius && distance > 0) {
      chef.x = closestX + (dx / distance) * CHEF.radius;
      chef.y = closestY + (dy / distance) * CHEF.radius;
    }
  }
  // Axis-separated movement, so the chef slides along counters instead of
  // wedging into their corners when steering diagonally into them.
  const nextX = clamp(chef.x + mx * CHEF.speed * dt, FLOOR.x + CHEF.radius, FLOOR.x + FLOOR.width - CHEF.radius);
  const nextY = clamp(chef.y + my * CHEF.speed * dt, BOARD.height + CHEF.radius, FLOOR.y + FLOOR.height - CHEF.radius);
  if (!hitsStation(nextX, chef.y)) chef.x = nextX;
  if (!hitsStation(chef.x, nextY)) chef.y = nextY;
}

function updateStations(state, dt) {
  const board = state.board;
  if (board.chopping && board.item) {
    board.progress += dt / TIMING.chopSeconds;
    if (board.progress >= 1) {
      board.progress = 1;
      board.chopping = false;
      board.item.chopped = true;
      state.events.push(EVENT_CHOP_DONE);
      burst(state, STATIONS.board.x + STATIONS.board.width / 2, STATIONS.board.y + 30, COLORS.green, 8);
    }
  }
  for (const burner of state.burners) {
    if (!burner.item) continue;
    burner.progress += dt / TIMING.cookSeconds;
    if (!burner.done && burner.progress >= 1) {
      burner.done = true;
      burner.item.cooked = true;
      state.events.push(EVENT_COOK_DONE);
    }
    if (burner.done && !burner.burnt && burner.progress >= 1 + TIMING.burnSeconds / TIMING.cookSeconds) {
      burner.burnt = true;
      burner.item.burnt = true;
      state.events.push(EVENT_BURNT);
    }
  }
}

function updateOrders(state, dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.orders.length < TIMING.maxOrders) {
    state.orders.push(makeOrder(state.rng, state.time));
    state.spawnTimer = spawnInterval(state.time);
  }
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders = state.orders.filter((entry) => entry !== order);
      state.hearts -= 1;
      state.failed += 1;
      state.combo = 0;
      addFloat(state, 640, 130, `${order.dish.name} EXPIRED!`, COLORS.red);
      state.events.push(EVENT_FAILED);
      if (state.hearts <= 0) {
        endShift(state, 'hearts');
        return;
      }
    }
  }
}

function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  for (const float of state.floats) {
    float.y -= 34 * dt;
    float.life -= dt;
  }
  state.floats = state.floats.filter((float) => float.life > 0);
}

/** Advance the rules one frame. `input` carries mx, my, interact edge, clickTarget. */
export function updateWorld(state, dt, input) {
  if (state.screen !== 'play') return;
  state.time += dt;
  state.timeLeft = Math.max(0, TIMING.shiftLength - state.time);
  moveChef(state, dt, input);
  if (input.interact) tryInteract(state, input.station);
  updateStations(state, dt);
  updateOrders(state, dt);
  updateParticles(state, dt);
  if (state.screen === 'play' && state.timeLeft <= 0) endShift(state, 'time');
}
