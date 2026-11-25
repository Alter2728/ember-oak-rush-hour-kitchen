// Ember & Oak — Rush Hour Kitchen: every pixel. One job: draw the world.
// All art is drawn with canvas shapes — no image files, no network.

import {
  BURNERS, CHEF_RADIUS, FLOOR, INGREDIENTS, INGREDIENT_ORDER, MAX_STRIKES,
  PANTRY_SLOTS, SHIFT_SECONDS, STATIONS, TARGET_COINS, VIEW, componentLabel,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'center', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Ingredient icons -------------------------------------------------------

export function drawIngredient(ctx, kind, state, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#241d18';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.quadraticCurveTo(-r * 0.2, -r * 1.2, 0, -r * 0.7); ctx.stroke();
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'tomato': {
      ctx.fillStyle = state === 'boiled' ? '#c0392b' : '#e5484d';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7d44';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.4, -r * 0.5); ctx.lineTo(-r * 0.4, -r * 0.5); ctx.closePath(); ctx.fill();
      if (state === 'chopped') {
        ctx.strokeStyle = '#a93226'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      }
      if (state === 'boiled') {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(r * 0.35, r * 0.25, r * 0.18, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = '#5da864';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dc383';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      if (state === 'chopped') {
        ctx.strokeStyle = '#3f7d44'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath(); ctx.moveTo(-r * 0.8, i * r * 0.45); ctx.lineTo(r * 0.8, i * r * 0.45); ctx.stroke();
        }
      }
      break;
    }
    case 'onion': {
      ctx.fillStyle = '#c9a0dc';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f3e8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.stroke();
      if (state === 'chopped') {
        ctx.fillStyle = '#e9d5ff';
        for (const [dx, dy] of [[-0.4, -0.3], [0.35, -0.35], [0, 0.3]]) {
          ctx.fillRect(dx * r - 3, dy * r - 3, 6, 6);
        }
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = state === 'grilled' ? '#6b3f22' : '#8a5a3b';
      rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.5); ctx.fill();
      if (state === 'grilled') {
        ctx.strokeStyle = '#3d2412'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath(); ctx.moveTo(i * r * 0.55 - r * 0.3, -r * 0.6); ctx.lineTo(i * r * 0.55 + r * 0.3, r * 0.6); ctx.stroke();
        }
      }
      break;
    }
    case 'cheese': {
      if (state === 'melted') {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath(); ctx.ellipse(0, r * 0.2, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-r * 0.5, r * 0.5, r * 0.25, 0, Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.45, r * 0.5, r * 0.2, 0, Math.PI); ctx.fill();
      } else {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(0, -r); ctx.lineTo(r, r * 0.7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.25, r * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, r * 0.4, r * 0.1, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'bun': {
      ctx.fillStyle = '#e8b96f';
      ctx.beginPath(); ctx.arc(0, r * 0.25, r, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(-r, r * 0.25, r * 2, r * 0.35);
      ctx.fillStyle = '#fff3d6';
      for (const [dx, dy] of [[-0.4, -0.35], [0.1, -0.6], [0.5, -0.3]]) {
        ctx.beginPath(); ctx.ellipse(dx * r, dy * r, 2.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = state === 'boiled' ? '#e8c15a' : '#f2d492';
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath(); ctx.arc(0, 0, r * (0.35 + i * 0.28), i * 1.2, i * 1.2 + Math.PI * 1.4); ctx.stroke();
      }
      break;
    }
    default: break;
  }
  ctx.restore();
}

// --- Kitchen ---------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Wall.
  ctx.fillStyle = '#f3e3c2';
  ctx.fillRect(0, 0, VIEW.width, 132);
  ctx.fillStyle = '#e8d3ac';
  ctx.fillRect(0, 126, VIEW.width, 6);
  // Floor tiles.
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#8a6b4a' : '#7d6043';
      ctx.fillRect(FLOOR.x + x * 128, FLOOR.y + y * 127, 128, 127);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < 4; y += 1) ctx.fillRect(FLOOR.x, FLOOR.y + y * 127, FLOOR.width, 2);
  // Wall decor: a menu poster and hanging pans on the empty right side.
  ctx.fillStyle = '#5b4632';
  ctx.font = '700 15px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('EMBER & OAK', 24, 30);
  ctx.font = '400 12px Georgia, serif';
  ctx.fillStyle = '#8a6b4a';
  ctx.fillText('rush hour kitchen', 24, 50);
  ctx.fillStyle = '#fff8ec';
  ctx.fillRect(1000, 18, 130, 84);
  ctx.strokeStyle = '#8a6b4a'; ctx.lineWidth = 3;
  ctx.strokeRect(1000, 18, 130, 84);
  ctx.fillStyle = '#4a3220';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("TODAY'S MENU", 1065, 36);
  ctx.font = '400 11px Georgia, serif';
  ctx.fillText('Salad · Burger · Soup', 1065, 58);
  ctx.fillText('Pasta · Melt', 1065, 76);
  ctx.fillText('served with love', 1065, 94);
  // A rug and a plant break up the open floor.
  ctx.fillStyle = '#a34d3d';
  ctx.beginPath(); ctx.ellipse(640, 480, 150, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8b96f'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(640, 480, 132, 50, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#b5651d';
  ctx.fillRect(1196, 592, 44, 34);
  ctx.fillStyle = '#3f7d44';
  ctx.beginPath(); ctx.arc(1218, 584, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5da864';
  ctx.beginPath(); ctx.arc(1206, 574, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1230, 572, 14, 0, Math.PI * 2); ctx.fill();
}

function drawCounter(ctx, rect, label, highlight, topColor = '#a9805a') {
  ctx.fillStyle = highlight ? '#c98f4e' : '#6b4a2f';
  rr(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 10); ctx.fill();
  ctx.fillStyle = topColor;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(rect.x + 6, rect.y + 4, rect.w - 12, 5);
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h - 12, 11, '#fff8ec');
}

function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0) { rr(ctx, x + 1, y + 1, Math.max(4, (w - 2) * Math.min(1, frac)), h - 2, (h - 2) / 2); ctx.fill(); }
}

function drawStations(ctx, s, hover) {
  const st = STATIONS;
  // Pantry crates.
  drawCounter(ctx, st.pantry, 'PANTRY', hover === 'pantry');
  for (const slot of PANTRY_SLOTS) {
    const ing = INGREDIENTS[slot.kind];
    ctx.fillStyle = '#f7ead0';
    rr(ctx, slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4, 5); ctx.fill();
    drawIngredient(ctx, slot.kind, 'raw', slot.x + slot.w / 2, slot.y + slot.h / 2, 10);
    text(ctx, ing.key, slot.x + slot.w / 2, slot.y + slot.h + 10, 10, '#fff8ec');
  }
  text(ctx, 'fresh, always', st.pantry.x + st.pantry.w / 2, st.pantry.y + 22, 11, '#fff8ec', '400', 'center', 'Georgia, serif');

  // Chopping board.
  drawCounter(ctx, st.board, 'CHOPPING BOARD', hover === 'board');
  ctx.fillStyle = '#e8d3ac';
  rr(ctx, st.board.x + 28, st.board.y + 18, 120, 52, 8); ctx.fill();
  ctx.strokeStyle = '#b89b6a'; ctx.lineWidth = 2;
  rr(ctx, st.board.x + 28, st.board.y + 18, 120, 52, 8); ctx.stroke();
  if (s.board.item) {
    drawIngredient(ctx, s.board.item.kind, s.board.item.state, st.board.x + 88, st.board.y + 44, 16);
    if (s.board.item.progress > 0 && s.board.item.state === 'raw') {
      progressBar(ctx, st.board.x + 28, st.board.y + 70, 120, 6, s.board.item.progress, '#e5484d');
    }
  } else {
    text(ctx, 'ready to chop', st.board.x + 88, st.board.y + 44, 11, '#8a6b4a', '400');
  }

  // Stove.
  drawCounter(ctx, st.stove, 'STOVE', hover === 'stove', '#3d3d3d');
  for (let i = 0; i < BURNERS.length; i += 1) {
    const b = BURNERS[i];
    const bx = st.stove.x + b.dx;
    const by = st.stove.y + b.dy;
    const burner = s.burners[i];
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(bx + b.w / 2, by + b.h / 2, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx + b.w / 2, by + b.h / 2, 30, 0, Math.PI * 2); ctx.stroke();
    if (burner.item) {
      const item = burner.item;
      // Pan.
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath(); ctx.arc(bx + b.w / 2, by + b.h / 2, 26, 0, Math.PI * 2); ctx.fill();
      drawIngredient(ctx, item.kind, item.done ? item.state : 'raw', bx + b.w / 2, by + b.h / 2, 14);
      const color = item.burnt ? '#1a1a1a' : item.done ? '#7dc383' : '#f5a623';
      progressBar(ctx, bx + 4, by + b.h - 4, b.w - 8, 7, item.progress, color);
      if (item.done && !item.burnt) text(ctx, 'READY!', bx + b.w / 2, by - 6, 11, '#a8f0a8');
      if (item.burnt) text(ctx, 'BURNT', bx + b.w / 2, by - 6, 11, '#ff9d9d');
    } else {
      ctx.fillStyle = '#666';
      ctx.beginPath(); ctx.arc(bx + b.w / 2, by + b.h / 2, 8, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Plating counter.
  drawCounter(ctx, st.plating, 'PLATING', hover === 'plating');
  ctx.fillStyle = '#f7f7f7';
  ctx.beginPath(); ctx.ellipse(st.plating.x + 104, st.plating.y + 46, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(st.plating.x + 104, st.plating.y + 46, 62, 26, 0, 0, Math.PI * 2); ctx.stroke();
  if (s.plate.components.length > 0) {
    s.plate.components.forEach((c, i) => {
      drawIngredient(ctx, c.kind, c.state, st.plating.x + 64 + i * 28, st.plating.y + 46, 12);
    });
  } else {
    text(ctx, 'empty plate', st.plating.x + 104, st.plating.y + 46, 11, '#8a6b4a', '400');
  }

  // Serving window.
  drawCounter(ctx, st.window, 'SERVING WINDOW', hover === 'window', '#7d5a3a');
  ctx.fillStyle = '#3a2a1a';
  rr(ctx, st.window.x + 20, st.window.y + 16, st.window.w - 40, 44, 6); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(st.window.x + st.window.w - 34, st.window.y + 38, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(st.window.x + st.window.w - 36, st.window.y + 38, 4, 8);
  text(ctx, 'DING!', st.window.x + 60, st.window.y + 38, 13, '#ffe9a8', '700', 'left');

  // Trash.
  drawCounter(ctx, st.trash, 'TRASH', hover === 'trash', '#5a6b7d');
  ctx.fillStyle = '#37474f';
  rr(ctx, st.trash.x + 32, st.trash.y + 6, 40, 26, 4); ctx.fill();
  text(ctx, '🗑', st.trash.x + 52, st.trash.y + 19, 13, '#fff');
}

function drawChef(ctx, s, time) {
  const c = s.chef;
  const bob = Math.sin(time * 10) * 1.5;
  const moving = c.target !== null;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + CHEF_RADIUS - 2, CHEF_RADIUS, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath(); ctx.arc(c.x, c.y + (moving ? bob : 0), CHEF_RADIUS, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath(); ctx.arc(c.x, c.y + 8 + (moving ? bob : 0), CHEF_RADIUS * 0.72, 0, Math.PI); ctx.fill();
  // Face.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(c.x, c.y - 4 + (moving ? bob : 0), 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(c.x - 4 + c.facing * 2, c.y - 6 + (moving ? bob : 0), 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x + 4 + c.facing * 2, c.y - 6 + (moving ? bob : 0), 1.8, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(c.x - 8, c.y - 16 + (moving ? bob : 0), 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x, c.y - 20 + (moving ? bob : 0), 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x + 8, c.y - 16 + (moving ? bob : 0), 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(c.x - 12, c.y - 16 + (moving ? bob : 0), 24, 6);
  // Held item floats above the hands.
  if (s.held) {
    const hy = c.y - CHEF_RADIUS - 16 + (moving ? bob : 0);
    if (s.held.plate) {
      ctx.fillStyle = '#f7f7f7';
      ctx.beginPath(); ctx.ellipse(c.x, hy, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
      s.held.components.forEach((comp, i) => {
        drawIngredient(ctx, comp.kind, comp.state, c.x - 14 + i * 14, hy - 4, 7);
      });
    } else {
      drawIngredient(ctx, s.held.kind, s.held.state, c.x, hy, 13);
    }
  }
  // Click-to-move marker.
  if (c.target) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.target.x, c.target.y, 8 + Math.sin(time * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawOrders(ctx, s, time) {
  const boardX = 300;
  const boardY = 8;
  const boardW = 640;
  const boardH = 116;
  ctx.fillStyle = '#4a3220';
  rr(ctx, boardX - 6, boardY - 4, boardW + 12, boardH + 8, 10); ctx.fill();
  ctx.fillStyle = '#fff8ec';
  rr(ctx, boardX, boardY, boardW, boardH, 8); ctx.fill();
  text(ctx, 'ORDER BOARD', boardX + 70, boardY + 16, 12, '#8a6b4a');
  if (s.orders.length === 0) {
    text(ctx, 'No orders — take a breath, chef.', boardX + boardW / 2, boardY + 62, 14, '#8a6b4a', '400', 'center', 'Georgia, serif');
  }
  s.orders.forEach((order, i) => {
    const x = boardX + 8 + i * 156;
    const y = boardY + 30;
    const w = 148;
    const h = 78;
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.35;
    ctx.fillStyle = urgent && Math.sin(time * 4.2) > 0 ? '#ffe1e1' : '#fdf3d8';
    rr(ctx, x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = urgent ? '#e5484d' : '#d9c08a'; ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 6); ctx.stroke();
    text(ctx, order.recipe.name, x + w / 2, y + 12, 12, '#4a3220');
    order.recipe.components.forEach((comp, j) => {
      drawIngredient(ctx, comp.kind, comp.state, x + 24 + j * 30, y + 34, 11);
    });
    text(ctx, `$${order.recipe.price}`, x + w - 26, y + 34, 12, '#2e7d32');
    // Patience bar.
    const color = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f5a623' : '#e5484d';
    progressBar(ctx, x + 8, y + 58, w - 16, 10, frac, color);
    text(ctx, `${Math.ceil(order.patience)}s`, x + w / 2, y + 72, 9, '#8a6b4a');
  });
}

function drawHud(ctx, s) {
  // Left: coins + combo.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, 16, 648, 300, 60, 10); ctx.fill();
  text(ctx, `🪙 $${s.coins}`, 30, 668, 22, '#ffd166', '800', 'left');
  text(ctx, `target $${TARGET_COINS}`, 30, 692, 12, '#fff8ec', '400', 'left');
  if (s.combo > 1) {
    ctx.fillStyle = '#e5484d';
    rr(ctx, 190, 658, 110, 40, 8); ctx.fill();
    text(ctx, `COMBO x${s.combo}`, 245, 678, 15, '#fff');
  }
  // Centre: shift timer.
  const remain = Math.max(0, SHIFT_SECONDS - s.elapsed);
  const mins = Math.floor(remain / 60);
  const secs = Math.floor(remain % 60);
  text(ctx, `⏱ ${mins}:${String(secs).padStart(2, '0')}`, 640, 668, 22, remain < 30 ? '#ff9d9d' : '#fff8ec', '800');
  progressBar(ctx, 520, 690, 240, 8, remain / SHIFT_SECONDS, remain < 30 ? '#e5484d' : '#ffd166');
  // Right: level, served, strikes.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, 964, 648, 300, 60, 10); ctx.fill();
  text(ctx, `Level ${s.level}  •  Served ${s.served}`, 978, 668, 14, '#fff8ec', '700', 'left');
  let strikeText = '';
  for (let i = 0; i < MAX_STRIKES; i += 1) strikeText += i < s.strikes ? '💔 ' : '❤️ ';
  text(ctx, strikeText, 978, 692, 14, '#fff', '400', 'left');
  // Held item label.
  if (s.held) {
    const label = s.held.plate
      ? `Plate: ${s.held.components.map(componentLabel).join(' + ') || 'empty'}`
      : componentLabel(s.held);
    text(ctx, `Holding: ${label}`, 640, 632, 13, '#ffe9a8');
  }
  // Toasts.
  s.toasts.forEach((t, i) => {
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t.t - 2.4) / 0.8);
    text(ctx, t.text, 640, 600 - i * 20, 14, t.color);
    ctx.globalAlpha = 1;
  });
  // Controls hint.
  text(ctx, 'WASD / arrows move  •  E interact (hold to chop)  •  click a station to walk there  •  1-7 grab ingredient  •  P pause  •  M mute', 640, 716, 11, 'rgba(255,248,236,0.75)', '400');
}

function drawTitle(ctx, s, time) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const pulse = 1 + Math.sin(time * 2.4) * 0.02;
  ctx.save();
  ctx.translate(640, 300);
  ctx.scale(pulse, pulse);
  text(ctx, '🍳 EMBER & OAK', 0, -110, 54, '#ffd166', '800', 'center', 'Georgia, serif');
  text(ctx, 'RUSH HOUR KITCHEN', 0, -62, 26, '#fff8ec', '700', 'center', 'Georgia, serif');
  ctx.restore();
  text(ctx, 'Orders are flying in. Chop it, grill it, plate it — before the ticket burns.', 640, 372, 16, '#ffe9a8', '400', 'center', 'Georgia, serif');
  text(ctx, `Serve $${TARGET_COINS} before the ${Math.floor(SHIFT_SECONDS / 60)}-minute shift ends. 3 expired orders and the shift is over.`, 640, 400, 15, '#fff8ec', '400');
  text(ctx, 'Salad → Burger → Soup → Pasta → Melt: new recipes unlock every minute.', 640, 428, 14, '#d8f7d8', '400');
  // Start button.
  ctx.fillStyle = '#e5484d';
  rr(ctx, 540, 462, 200, 56, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(548, 468, 184, 4);
  text(ctx, '▶  START SHIFT', 640, 491, 20, '#fff');
  text(ctx, 'or press Enter — click works too', 640, 540, 12, 'rgba(255,248,236,0.8)', '400');
  text(ctx, 'WASD / arrows to move  •  E to interact  •  click stations to walk there  •  1-7 grab ingredients', 640, 580, 13, '#fff8ec', '400');
}

function drawOver(ctx, s) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (s.won) {
    text(ctx, '🎉 SHIFT COMPLETE!', 640, 220, 48, '#ffd166', '800', 'center', 'Georgia, serif');
    text(ctx, `You served the rush and banked $${s.coins}. The regulars are already back.`, 640, 280, 17, '#fff8ec', '400');
  } else if (s.strikes >= MAX_STRIKES) {
    text(ctx, '💔 SHIFT FAILED', 640, 220, 48, '#ff9d9d', '800', 'center', 'Georgia, serif');
    text(ctx, 'Three orders walked out hungry. The kitchen is yours again tomorrow.', 640, 280, 17, '#fff8ec', '400');
  } else {
    text(ctx, '⏰ TIME!', 640, 220, 48, '#ff9d9d', '800', 'center', 'Georgia, serif');
    text(ctx, `The shift ended at $${s.coins} — short of the $${TARGET_COINS} target.`, 640, 280, 17, '#fff8ec', '400');
  }
  text(ctx, `Served ${s.served} dishes  •  Best combo x${Math.max(1, s.bestCombo)}  •  ${s.expired} orders expired`, 640, 330, 16, '#ffe9a8', '400');
  text(ctx, `Final takings: $${s.coins}`, 640, 366, 22, '#ffd166', '800');
  ctx.fillStyle = '#e5484d';
  rr(ctx, 540, 410, 200, 56, 12); ctx.fill();
  text(ctx, '↻  PLAY AGAIN', 640, 439, 20, '#fff');
  text(ctx, 'press R or click', 640, 490, 12, 'rgba(255,248,236,0.8)', '400');
}

// --- Entry points -----------------------------------------------------------

export function drawGame(ctx, s, opts) {
  drawFloor(ctx);
  drawOrders(ctx, s, opts.time);
  drawStations(ctx, s, opts.hoverStation);
  drawChef(ctx, s, opts.time);
  drawHud(ctx, s);
  if (s.screen === SCREEN_TITLE) drawTitle(ctx, s, opts.time);
  else if (s.screen === SCREEN_OVER) drawOver(ctx, s);
  if (opts.paused && s.screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(20,12,6,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, '⏸ PAUSED', 640, 340, 44, '#fff8ec', '800', 'center', 'Georgia, serif');
    text(ctx, 'press P to keep cooking', 640, 390, 15, '#ffe9a8', '400');
  }
}

export function startButtonRect() {
  return { x: 540, y: 462, w: 200, h: 56 };
}

export function againButtonRect() {
  return { x: 540, y: 410, w: 200, h: 56 };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
