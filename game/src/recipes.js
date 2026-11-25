// Burner Rush — dishes and orders: what a ticket asks for, how new tickets arrive,
// and whether a finished plate matches a dish.
import { DISHES, DISH_ORDER, TIMING } from './config.js';
import { pickWeighted } from './random.js';

let orderId = 0;

export function nextOrderId() {
  orderId += 1;
  return orderId;
}

export function resetOrderIds() {
  orderId = 0;
}

/** A fresh ticket. Early in the shift the easy dishes dominate; later the deluxe appears. */
export function makeOrder(rng, elapsed) {
  const progress = Math.min(1, elapsed / TIMING.shiftLength);
  const deluxeWeight = 0.1 + progress * 0.45;
  const burgerWeight = 0.45;
  const saladWeight = 1 - deluxeWeight - burgerWeight;
  const dishId = pickWeighted(rng, [
    { value: 'salad', weight: saladWeight },
    { value: 'burger', weight: burgerWeight },
    { value: 'deluxe', weight: deluxeWeight },
  ]);
  const patience = TIMING.patienceStart + (TIMING.patienceEnd - TIMING.patienceStart) * progress;
  return {
    id: nextOrderId(),
    dishId,
    dish: DISHES[dishId],
    patience,
    maxPatience: patience,
    state: 'waiting',
  };
}

/** Seconds between tickets, shrinking as the shift wears on. */
export function spawnInterval(elapsed) {
  const progress = Math.min(1, elapsed / TIMING.shiftLength);
  return TIMING.spawnStart + (TIMING.spawnEnd - TIMING.spawnStart) * progress;
}

/**
 * Does this plate hold exactly the dish's steps — each step once, chopped or cooked
 * as the recipe demands, and nothing else? A burnt item never matches.
 */
export function plateMatchesDish(plateItems, dish) {
  if (plateItems.length !== dish.steps.length) return false;
  const used = new Array(plateItems.length).fill(false);
  for (const step of dish.steps) {
    let found = false;
    for (let i = 0; i < plateItems.length; i += 1) {
      if (used[i]) continue;
      const item = plateItems[i];
      if (item.burnt) continue;
      if (item.kind !== step.kind) continue;
      if (step.chopped && !item.chopped) continue;
      if (step.cooked && !item.cooked) continue;
      if (!step.chopped && item.chopped) continue;
      if (!step.cooked && item.cooked) continue;
      used[i] = true;
      found = true;
      break;
    }
    if (!found) return false;
  }
  return true;
}

/** The first waiting ticket this plate completes, or null when it completes none. */
export function findMatchingOrder(plateItems, orders) {
  for (const order of orders) {
    if (order.state !== 'waiting') continue;
    if (plateMatchesDish(plateItems, order.dish)) return order;
  }
  return null;
}

export function dishNames() {
  return DISH_ORDER.map((id) => DISHES[id].name);
}
