// Burner Rush — screenshot scenes behind ?shot=cover|play|rush|serve. Each one plays
// the real rules forward from a fresh shift, steered by a waypoint autopilot that
// walks the chef between stations and uses them, so every frame is what a real
// game looks like and the same seed always gives the same frame.
import { DISHES, STATIONS } from './config.js';
import { nextOrderId } from './recipes.js';
import { EVENT_SERVED, createWorld, startShift, updateWorld } from './world.js';

const STEP = 1 / 30;
const ARRIVE = 14;

// Approach points just outside each station, close enough to use it.
const APPROACH = {
  crates: (y) => ({ x: 212, y }),
  board: { x: 325, y: 458 },
  stove: { x: 630, y: 280 },
  plates: { x: 890, y: 280 },
  assembly: { x: 640, y: 548 },
  window: { x: 1082, y: 320 },
};

const CRATE_Y = { tomato: 185, lettuce: 246, patty: 307, bun: 368, cheese: 429 };

function go(x, y) {
  return { x, y, act: 'go' };
}

function use(x, y, until, station) {
  return { x, y, act: 'use', until, station };
}

function waitFor(until) {
  return { x: null, y: null, act: 'wait', until };
}

function plateStep() {
  return [use(APPROACH.plates.x, APPROACH.plates.y, undefined, 'plates'), use(APPROACH.assembly.x, APPROACH.assembly.y, undefined, 'assembly')];
}

function chopStep(kind) {
  return [
    use(APPROACH.crates(CRATE_Y[kind]).x, CRATE_Y[kind], undefined, 'crates'),
    use(APPROACH.board.x, APPROACH.board.y, (s) => s.board.item && s.board.item.chopped, 'board'),
    use(APPROACH.board.x, APPROACH.board.y, undefined, 'board'),
    use(APPROACH.assembly.x, APPROACH.assembly.y, undefined, 'assembly'),
  ];
}

function grillStep() {
  return [
    use(APPROACH.crates(CRATE_Y.patty).x, CRATE_Y.patty, undefined, 'crates'),
    use(APPROACH.stove.x, APPROACH.stove.y, (s) => s.burners.some((b) => b.done && !b.burnt), 'stove'),
    use(APPROACH.stove.x, APPROACH.stove.y, undefined, 'stove'),
    use(APPROACH.assembly.x, APPROACH.assembly.y, undefined, 'assembly'),
  ];
}

function addStep(kind) {
  return [
    use(APPROACH.crates(CRATE_Y[kind]).x, CRATE_Y[kind], undefined, 'crates'),
    use(APPROACH.assembly.x, APPROACH.assembly.y, undefined, 'assembly'),
  ];
}

function serveStep() {
  return [
    use(APPROACH.assembly.x, APPROACH.assembly.y, undefined, 'assembly'),
    use(APPROACH.window.x, APPROACH.window.y, undefined, 'window'),
  ];
}

function saladPlan() {
  return [...plateStep(), ...chopStep('tomato'), ...chopStep('lettuce'), ...serveStep()];
}

function burgerPlan() {
  return [
    ...plateStep(),
    ...grillStep(),
    ...addStep('cheese'),
    ...addStep('bun'),
    ...serveStep(),
  ];
}

function deluxePlan() {
  return [
    ...plateStep(),
    ...grillStep(),
    ...addStep('cheese'),
    ...chopStep('tomato'),
    ...addStep('bun'),
    ...serveStep(),
  ];
}

/** One ticket, hand-picked so the autopilot always has a dish to cook for. */
function forceOrder(state, dishId, patience) {
  const dish = DISHES[dishId];
  state.orders.push({
    id: nextOrderId(),
    dishId,
    dish,
    patience,
    maxPatience: patience,
    state: 'waiting',
  });
}

function makePilot(plan) {
  return {
    plan,
    index: 0,
    interacted: false,
    done: false,
    lastX: null,
    lastY: null,
    lastDist: null,
    stillTime: 0,
    detour: null,
    detourUntil: 0,
    stepSince: 0,
    /** The frame's movement + interact for this step. */
    input(state) {
      if (this.done || this.index >= this.plan.length) {
        this.done = true;
        return { mx: 0, my: 0, interact: false, clickTarget: null };
      }
      const step = this.plan[this.index];
      // A step that never completes (a missed interact, a lost ticket) must
      // not eat the whole scene: give up on it after 25 seconds.
      if (this.stepSince === 0) this.stepSince = state.time;
      if (state.time - this.stepSince > 25) {
        this.index += 1;
        this.interacted = false;
        this.detour = null;
        this.stepSince = 0;
        return { mx: 0, my: 0, interact: false, clickTarget: null };
      }
      let tx = step.x;
      let ty = step.y;
      if (step.act !== 'wait' && step.x !== null) {
        const dx = step.x - state.chef.x;
        const dy = step.y - state.chef.y;
        const distance = Math.hypot(dx, dy);
        if (distance > ARRIVE) {
          // Stuck against a counter corner: the straight line leads into the
          // corner and both axes are blocked, or the chef slides along a wall
          // without getting closer. Step sideways (perpendicular, preferring
          // downwards, where the floor is open) until clear. The detour only
          // steers movement: reaching it never fires the step's action.
          const moved = this.lastX === null ? 99 : Math.hypot(state.chef.x - this.lastX, state.chef.y - this.lastY);
          const closer = this.lastDist === null ? 99 : this.lastDist - distance;
          if (moved < 0.5 || closer < 0.2) this.stillTime += STEP;
          else this.stillTime = 0;
          this.lastX = state.chef.x;
          this.lastY = state.chef.y;
          this.lastDist = distance;
          if (this.stillTime > 0.5 && !this.detour) {
            const len = Math.hypot(dx, dy) || 1;
            let px = -dy / len;
            let py = dx / len;
            if (py < 0) {
              px = -px;
              py = -py;
            }
            this.detour = {
              x: Math.min(1240, Math.max(40, state.chef.x + px * 140)),
              y: Math.min(690, Math.max(120, state.chef.y + py * 140)),
            };
            this.detourUntil = state.time + 1.5;
            this.stillTime = 0;
          }
        }
        if (this.detour) {
          const dd = Math.hypot(this.detour.x - state.chef.x, this.detour.y - state.chef.y);
          if (dd < 16 || state.time > this.detourUntil) {
            this.detour = null;
          } else {
            // Steer to the detour point only; the step itself waits.
            return { mx: (this.detour.x - state.chef.x) / dd, my: (this.detour.y - state.chef.y) / dd, interact: false, clickTarget: null };
          }
        }
      }
      if (step.act === 'wait') {
        if (!step.until || step.until(state)) {
          this.index += 1;
          this.stepSince = 0;
        }
        return { mx: 0, my: 0, interact: false, clickTarget: null };
      }
      const dx = tx - state.chef.x;
      const dy = ty - state.chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= ARRIVE) {
        if (step.act === 'go') {
          this.index += 1;
          this.interacted = false;
          this.stepSince = 0;
          return { mx: 0, my: 0, interact: false, clickTarget: null };
        }
        let interact = false;
        if (!this.interacted) {
          interact = true;
          this.interacted = true;
        }
        if (!step.until || step.until(state)) {
          this.index += 1;
          this.interacted = false;
          this.stepSince = 0;
        }
        return { mx: 0, my: 0, interact, station: step.station, clickTarget: null };
      }
      return { mx: dx / distance, my: dy / distance, interact: false, clickTarget: null };
    },
  };
}

/** Run the pilot forward until it finishes the plan or the step budget runs out. */
function runPlan(state, pilot, maxSeconds, keepAlive, stopWhen) {
  const maxSteps = Math.floor(maxSeconds / STEP);
  for (let i = 0; i < maxSteps; i += 1) {
    const input = pilot.input(state);
    updateWorld(state, STEP, input);
    if (keepAlive) {
      for (const order of state.orders) {
        if (order.patience < 25) order.patience = 25;
      }
    }
    if (state.screen !== 'play') break;
    if (stopWhen && stopWhen(state, pilot)) break;
    if (pilot.done) break;
  }
}

/**
 * Stage the named scene on a fresh shift and return the screen to draw.
 * cover: plate mid-assembly, chopped lettuce on the board, two tickets up.
 * play: a salad served, coins on the board, the rush building.
 * rush: deep into the shift — burners busy, four tickets, clock running low.
 * serve: frozen a heartbeat after a serve, coins popping over the window.
 */
export function stageShot(name, seed) {
  const rng = (() => {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6d2b79f5) >>> 0;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
  const state = createWorld(rng, seed);
  startShift(state);
  forceOrder(state, 'salad', 90);
  state.spawnTimer = 999;

  if (name === 'cover') {
    const pilot = makePilot(saladPlan());
    runPlan(state, pilot, 120, true, (s, p) => {
      const plate = s.assembly.plate;
      const boardEmpty = !s.board.item;
      const carryingLettuce = s.chef.carrying && s.chef.carrying.kind === 'lettuce' && s.chef.carrying.chopped;
      return plate && plate.items.length === 1 && boardEmpty && carryingLettuce && p.index >= 9;
    });
    forceOrder(state, 'burger', 48);
    return { state, screen: 'play', best: 0 };
  }

  if (name === 'serve') {
    const pilot = makePilot(saladPlan());
    let servedAt = -1;
    runPlan(state, pilot, 120, true, (s) => {
      if (servedAt < 0 && s.events.includes(EVENT_SERVED)) servedAt = s.time;
      return servedAt > 0 && s.time - servedAt > 0.35;
    });
    return { state, screen: 'play', best: 0 };
  }

  if (name === 'rush') {
    forceOrder(state, 'burger', 90);
    forceOrder(state, 'deluxe', 90);
    const pilot = makePilot([...saladPlan(), ...burgerPlan(), ...deluxePlan()]);
    runPlan(state, pilot, 200, true, (s) => s.time > 78);
    return { state, screen: 'play', best: 0 };
  }

  // play: a salad served, then a patty sizzling on the stove while the next
  // burger comes together — flame, progress ring, tickets and coins all live.
  forceOrder(state, 'burger', 90);
  const pilot = makePilot([...saladPlan(), ...burgerPlan()]);
  runPlan(state, pilot, 200, true, (s) => {
    const cooking = s.burners.some((b) => b.item && !b.done && b.progress > 0.3);
    return s.served >= 1 && cooking;
  });
  return { state, screen: 'play', best: 0 };
}

export { STATIONS };
