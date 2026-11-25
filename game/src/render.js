// Burner Rush — every pixel the player sees: the kitchen, the stations, the chef,
// the order board, the timer and the title / game-over screens. Flat vector art,
// drawn in code; no image files anywhere.
import { BOARD, CHEF, COLORS, CRATE_KINDS, DISHES, FIELD, STATIONS, TIMING } from './config.js';
import { clamp } from './random.js';
import { nearestStation } from './world.js';

const FONT = 'Trebuchet MS, Verdana, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient (or a plate) as a small vector picture, centred on x, y. */
export function drawItemIcon(ctx, item, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (!item) {
    ctx.restore();
    return;
  }
  if (item.kind === 'plate') {
    ctx.fillStyle = '#e8e4da';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.52, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.03, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const held of item.items) {
      drawItemIcon(ctx, held, 0, -s * 0.08, s * 0.52);
    }
    ctx.restore();
    return;
  }
  if (item.kind === 'tomato') {
    if (item.chopped) {
      ctx.fillStyle = '#e23b2a';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.4 + i * s * 0.32, s * 0.2);
        ctx.lineTo(-s * 0.28 + i * s * 0.32, -s * 0.3);
        ctx.lineTo(-s * 0.12 + i * s * 0.32, s * 0.2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#f4705f';
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#d9382a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4705f';
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.14, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f8f2f';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.lineTo(-s * 0.22, -s * 0.62);
      ctx.lineTo(0, -s * 0.48);
      ctx.lineTo(s * 0.22, -s * 0.62);
      ctx.lineTo(0, -s * 0.42);
      ctx.fill();
    }
  } else if (item.kind === 'lettuce') {
    if (item.chopped) {
      ctx.fillStyle = '#5da53f';
      for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2 + 0.4;
        ctx.save();
        ctx.rotate(angle);
        roundRect(ctx, -s * 0.08, -s * 0.5, s * 0.16, s * 0.42, s * 0.06);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#8cc96a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#4d9b3a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6fbf52';
      ctx.lineWidth = s * 0.06;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, s * (0.16 + i * 0.1), Math.PI * 0.3, Math.PI * 1.1);
        ctx.stroke();
      }
    }
  } else if (item.kind === 'patty') {
    ctx.fillStyle = item.burnt ? '#1f1a16' : item.cooked ? '#7a4a22' : '#a85f3c';
    roundRect(ctx, -s * 0.48, -s * 0.26, s * 0.96, s * 0.52, s * 0.16);
    ctx.fill();
    if (item.cooked && !item.burnt) {
      ctx.strokeStyle = '#5d3312';
      ctx.lineWidth = s * 0.05;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.3 + i * s * 0.2, -s * 0.2);
        ctx.lineTo(-s * 0.2 + i * s * 0.2, s * 0.2);
        ctx.stroke();
      }
    }
    if (item.burnt) {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.3);
      ctx.quadraticCurveTo(-s * 0.1, -s * 0.55, -s * 0.18, -s * 0.7);
      ctx.moveTo(s * 0.15, -s * 0.3);
      ctx.quadraticCurveTo(s * 0.25, -s * 0.55, s * 0.12, -s * 0.72);
      ctx.stroke();
    }
  } else if (item.kind === 'bun') {
    ctx.fillStyle = '#e0a458';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.44, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c98d3f';
    roundRect(ctx, -s * 0.44, s * 0.08, s * 0.88, s * 0.18, s * 0.08);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-0.2, -0.18], [0.05, -0.3], [0.26, -0.14]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.kind === 'cheese') {
    ctx.fillStyle = '#f2b234';
    ctx.beginPath();
    ctx.moveTo(-s * 0.44, s * 0.3);
    ctx.lineTo(s * 0.44, s * 0.3);
    ctx.lineTo(0, -s * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d18f16';
    for (const [dx, dy] of [[-0.12, 0.08], [0.16, 0.14], [0.02, -0.12]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, radius, fraction, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
  ctx.stroke();
}

function drawStationShell(ctx, rect, label, highlight) {
  ctx.fillStyle = COLORS.counterBody;
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, rect.x, rect.y, rect.width, 16, 8);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8, 12);
    ctx.stroke();
  }
  text(ctx, label, rect.x + rect.width / 2, rect.y + rect.height - 12, 12, '#e8d9b0', 'bold', 'center');
}

function drawPantry(ctx, state, highlight) {
  const rect = STATIONS.crates;
  drawStationShell(ctx, rect, 'PANTRY', highlight);
  const slotH = (rect.height - 34) / CRATE_KINDS.length;
  CRATE_KINDS.forEach((kind, i) => {
    const cy = rect.y + 26 + i * slotH + slotH / 2;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    roundRect(ctx, rect.x + 8, rect.y + 22 + i * slotH, rect.width - 16, slotH - 4, 6);
    ctx.fill();
    drawItemIcon(ctx, { kind, chopped: false, cooked: false, burnt: false }, rect.x + 34, cy, 34);
    text(ctx, kind.toUpperCase(), rect.x + 62, cy, 14, COLORS.cream);
  });
}

function drawChoppingBoard(ctx, state, highlight) {
  const rect = STATIONS.board;
  drawStationShell(ctx, rect, 'CHOPPING BOARD', highlight);
  ctx.fillStyle = '#e8cfa5';
  roundRect(ctx, rect.x + 14, rect.y + 18, rect.width - 28, 56, 8);
  ctx.fill();
  const board = state.board;
  if (board.item) {
    drawItemIcon(ctx, board.item, rect.x + rect.width / 2 - 20, rect.y + 46, 52);
    if (board.chopping) {
      drawProgressRing(ctx, rect.x + rect.width - 26, rect.y + 46, 16, board.progress, COLORS.green);
      text(ctx, 'CHOP!', rect.x + rect.width / 2, rect.y + 84, 13, COLORS.cream, 'bold', 'center');
    }
  } else {
    text(ctx, 'bring tomato / lettuce', rect.x + rect.width / 2, rect.y + 46, 12, '#8a7a5c', 'bold', 'center');
  }
}

function drawStove(ctx, state, highlight) {
  const rect = STATIONS.stove;
  drawStationShell(ctx, rect, 'STOVE', highlight);
  ctx.fillStyle = COLORS.steel;
  roundRect(ctx, rect.x + 10, rect.y + 14, rect.width - 20, rect.height - 44, 8);
  ctx.fill();
  state.burners.forEach((burner, i) => {
    const cx = rect.x + 66 + i * 128;
    const cy = rect.y + 52;
    ctx.fillStyle = '#3a3f45';
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22262a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    if (burner.item) {
      if (!burner.done) {
        ctx.fillStyle = COLORS.flame;
        ctx.beginPath();
        ctx.moveTo(cx - 26, cy + 18);
        ctx.quadraticCurveTo(cx - 30, cy - 6, cx, cy - 26);
        ctx.quadraticCurveTo(cx + 30, cy - 6, cx + 26, cy + 18);
        ctx.closePath();
        ctx.fill();
      }
      drawItemIcon(ctx, burner.item, cx, cy, 52);
      const fraction = clamp(burner.progress, 0, 1);
      const color = burner.burnt ? COLORS.red : burner.done ? COLORS.gold : COLORS.flame;
      drawProgressRing(ctx, cx, cy, 46, fraction, color);
      if (burner.burnt) text(ctx, 'BURNT!', cx, cy - 58, 13, COLORS.red, 'bold', 'center');
      else if (burner.done) text(ctx, 'READY', cx, cy - 58, 13, COLORS.gold, 'bold', 'center');
    }
  });
}

function drawPlates(ctx, state, highlight) {
  const rect = STATIONS.plates;
  drawStationShell(ctx, rect, 'PLATES', highlight);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = i === 3 ? '#ffffff' : '#d9d4c8';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.width / 2, rect.y + 74 - i * 9, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'take a plate', rect.x + rect.width / 2, rect.y + 46, 11, '#8a7a5c', 'bold', 'center');
}

function drawAssembly(ctx, state, highlight) {
  const rect = STATIONS.assembly;
  drawStationShell(ctx, rect, 'ASSEMBLY', highlight);
  const plate = state.assembly.plate;
  if (plate) {
    drawItemIcon(ctx, plate, rect.x + rect.width / 2, rect.y + 58, 120);
    if (plate.items.length === 0) {
      text(ctx, 'add ingredients', rect.x + rect.width / 2, rect.y + 100, 12, '#8a7a5c', 'bold', 'center');
    }
  } else {
    text(ctx, 'put a plate here', rect.x + rect.width / 2, rect.y + 58, 13, '#8a7a5c', 'bold', 'center');
  }
}

function drawWindow(ctx, state, highlight) {
  const rect = STATIONS.window;
  drawStationShell(ctx, rect, 'SERVE', highlight);
  ctx.fillStyle = '#2c2620';
  roundRect(ctx, rect.x + 12, rect.y + 16, rect.width - 24, 120, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(rect.x + rect.width / 2, rect.y + 60, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5a10';
  ctx.beginPath();
  ctx.arc(rect.x + rect.width / 2, rect.y + 60, 6, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'serve the', rect.x + rect.width / 2, rect.y + 160, 13, COLORS.cream, 'bold', 'center');
  text(ctx, 'finished plate', rect.x + rect.width / 2, rect.y + 180, 13, COLORS.cream, 'bold', 'center');
}

function drawTrash(ctx, state, highlight) {
  const rect = STATIONS.trash;
  drawStationShell(ctx, rect, 'TRASH', highlight);
  ctx.fillStyle = '#3a3f45';
  roundRect(ctx, rect.x + 38, rect.y + 22, 60, 58, 8);
  ctx.fill();
  ctx.fillStyle = '#22262a';
  roundRect(ctx, rect.x + 30, rect.y + 14, 76, 12, 6);
  ctx.fill();
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(state.time * 12) * 3 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, CHEF.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = COLORS.teal;
  ctx.beginPath();
  ctx.arc(x, y + 8, CHEF.radius - 6, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 13, y - 22, 9, 0, Math.PI * 2);
  ctx.arc(x, y - 27, 11, 0, Math.PI * 2);
  ctx.arc(x + 13, y - 22, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  const lookX = chef.dirX * 3;
  const lookY = chef.dirY * 2;
  ctx.beginPath();
  ctx.arc(x - 8 + lookX, y - 2 + lookY, 3, 0, Math.PI * 2);
  ctx.arc(x + 8 + lookX, y - 2 + lookY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + lookX, y + 6 + lookY, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  if (chef.carrying) {
    drawItemIcon(ctx, chef.carrying, x, y - CHEF.radius - 26, 44);
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y) {
  const w = 168;
  const h = 78;
  const urgent = order.patience < 12;
  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? COLORS.red : COLORS.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, `#${order.id} ${order.dish.name}`, x + 10, y + 15, 13, COLORS.ink);
  order.dish.steps.forEach((step, i) => {
    drawItemIcon(ctx, { kind: step.kind, chopped: !!step.chopped, cooked: !!step.cooked, burnt: false }, x + 22 + i * 34, y + 40, 28);
  });
  const fraction = clamp(order.patience / order.maxPatience, 0, 1);
  ctx.fillStyle = '#e5dcc3';
  roundRect(ctx, x + 10, y + 62, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? COLORS.green : fraction > 0.25 ? COLORS.gold : COLORS.red;
  roundRect(ctx, x + 10, y + 62, (w - 20) * fraction, 8, 4);
  ctx.fill();
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#2b2620';
  ctx.fillRect(BOARD.x, BOARD.y, BOARD.width, BOARD.height);
  text(ctx, 'ORDERS', 18, 26, 15, COLORS.gold);
  text(ctx, 'BURNER RUSH', 18, 58, 20, COLORS.cream);
  state.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 190 + i * 178, 7);
  });
  const timeLeft = Math.max(0, Math.ceil(state.timeLeft));
  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, '0');
  const lowTime = timeLeft <= 30;
  text(ctx, `${mm}:${ss}`, 1010, 30, 30, lowTime ? COLORS.red : COLORS.cream, 'bold', 'center');
  text(ctx, 'SHIFT', 1010, 58, 11, '#b8a888', 'bold', 'center');
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(1095, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5a10';
  text(ctx, '$', 1095, 31, 16, '#7a5a10', 'bold', 'center');
  text(ctx, `${state.coins}`, 1120, 30, 26, COLORS.cream, 'bold');
  for (let i = 0; i < TIMING.startHearts; i += 1) {
    ctx.fillStyle = i < state.hearts ? COLORS.red : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(1180 + i * 30, 30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i < state.hearts ? '#ff8a7a' : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(1177 + i * 30, 27, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.combo >= 2) {
    text(ctx, `COMBO x${state.combo}`, 1010, 76, 13, COLORS.gold, 'bold', 'center');
  }
}

function drawFloor(ctx) {
  const tile = 64;
  for (let ty = 0; ty < Math.ceil(FIELD.height / tile); ty += 1) {
    for (let tx = 0; tx < Math.ceil(FIELD.width / tile); tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * tile, BOARD.height + ty * tile, tile, tile);
    }
  }
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, BOARD.height, FIELD.width, 8);
}

function drawPrompt(ctx, state) {
  if (state.screen !== 'play') return;
  const station = nearestStation(state);
  if (!station) return;
  const rect = STATIONS[station];
  text(ctx, 'E — use', rect.x + rect.width / 2, rect.y - 12, 14, COLORS.cream, 'bold', 'center');
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const float of state.floats) {
    ctx.globalAlpha = clamp(float.life / 1.4, 0, 1);
    text(ctx, float.text, float.x, float.y, 22, float.color, 'bold', 'center');
  }
  ctx.globalAlpha = 1;
}

function drawControlsHint(ctx) {
  text(ctx, 'WASD / arrows — move    •    E / Space — use station    •    click a station to walk there    •    M — mute', FIELD.width / 2, FIELD.height - 14, 13, 'rgba(43,33,24,0.65)', 'bold', 'center');
}

export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawFloor(ctx);
  const near = nearestStation(state);
  drawPantry(ctx, state, near === 'crates');
  drawChoppingBoard(ctx, state, near === 'board');
  drawStove(ctx, state, near === 'stove');
  drawPlates(ctx, state, near === 'plates');
  drawAssembly(ctx, state, near === 'assembly');
  drawWindow(ctx, state, near === 'window');
  drawTrash(ctx, state, near === 'trash');
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawOrderBoard(ctx, state);
  drawPrompt(ctx, state);
  if (state.screen === 'play') drawControlsHint(ctx);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'over') drawGameOver(ctx, state);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,14,8,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'BURNER RUSH', FIELD.width / 2, 220, 84, COLORS.cream, 'bold', 'center');
  text(ctx, 'a tiny kitchen rush — chop it, grill it, plate it, serve it', FIELD.width / 2, 280, 24, COLORS.gold, 'bold', 'center');
  text(ctx, 'Orders roll in on the board. Grab ingredients from the pantry,', FIELD.width / 2, 360, 20, COLORS.cream, 'bold', 'center');
  text(ctx, 'chop on the board, grill patties on the stove, build the plate,', FIELD.width / 2, 390, 20, COLORS.cream, 'bold', 'center');
  text(ctx, 'and serve before the ticket runs out. Three strikes and the shift ends.', FIELD.width / 2, 420, 20, COLORS.cream, 'bold', 'center');
  text(ctx, 'WASD / arrows to move  •  E to use a station  •  click to walk there', FIELD.width / 2, 480, 18, '#e8d9b0', 'bold', 'center');
  const pulse = 0.7 + 0.3 * Math.sin(state.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER OR CLICK TO START', FIELD.width / 2, 550, 26, COLORS.gold, 'bold', 'center');
  ctx.globalAlpha = 1;
  if (state.best > 0) text(ctx, `best shift: ${state.best} coins`, FIELD.width / 2, 600, 18, COLORS.cream, 'bold', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,14,8,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, state.overReason === 'hearts' ? 'THREE STRIKES!' : 'SHIFT OVER!', FIELD.width / 2, 220, 72, COLORS.cream, 'bold', 'center');
  text(ctx, `coins earned: ${state.coins}`, FIELD.width / 2, 320, 28, COLORS.gold, 'bold', 'center');
  text(ctx, `dishes served: ${state.served}    •    orders lost: ${state.failed}    •    best combo: x${state.bestCombo}`, FIELD.width / 2, 370, 20, COLORS.cream, 'bold', 'center');
  text(ctx, `best shift: ${state.best} coins`, FIELD.width / 2, 410, 20, '#e8d9b0', 'bold', 'center');
  const pulse = 0.7 + 0.3 * Math.sin(state.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS R TO PLAY AGAIN', FIELD.width / 2, 500, 26, COLORS.gold, 'bold', 'center');
  ctx.globalAlpha = 1;
}
