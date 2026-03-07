const SIZE = 6;
const MAX_HP = 100;
const GEM_TYPES = ['fire', 'water', 'leaf', 'star', 'moon'];
const GEM_ICON = {
  fire: '🔥',
  water: '💧',
  leaf: '🍀',
  star: '⭐',
  moon: '🌙',
};

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const playerHpEl = document.getElementById('playerHp');
const enemyHpEl = document.getElementById('enemyHp');
const playerHpBar = document.getElementById('playerHpBar');
const enemyHpBar = document.getElementById('enemyHpBar');

let board = [];
let selected = null;
let locked = false;
let playerHp = MAX_HP;
let enemyHp = MAX_HP;

function randGem() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function makeCleanBoard() {
  board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randGem));

  while (findMatches(board).length) {
    board.forEach((row, r) => {
      row.forEach((_, c) => {
        if (isPartOfMatch(board, r, c)) board[r][c] = randGem();
      });
    });
  }
}

function isPartOfMatch(src, row, col) {
  const val = src[row][col];
  const left = col > 1 && src[row][col - 1] === val && src[row][col - 2] === val;
  const up = row > 1 && src[row - 1][col] === val && src[row - 2][col] === val;
  return left || up;
}

function render() {
  boardEl.innerHTML = '';

  board.forEach((row, r) => {
    row.forEach((gem, c) => {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.type = 'button';
      btn.textContent = GEM_ICON[gem];
      btn.dataset.row = String(r);
      btn.dataset.col = String(c);

      if (selected && selected.row === r && selected.col === c) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => handleCellClick(r, c));
      boardEl.appendChild(btn);
    });
  });

  playerHpEl.textContent = playerHp;
  enemyHpEl.textContent = enemyHp;
  playerHpBar.style.width = `${(playerHp / MAX_HP) * 100}%`;
  enemyHpBar.style.width = `${(enemyHp / MAX_HP) * 100}%`;
}

function adjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function swap(a, b) {
  const tmp = board[a.row][a.col];
  board[a.row][a.col] = board[b.row][b.col];
  board[b.row][b.col] = tmp;
}

function findMatches(src) {
  const found = new Set();

  for (let r = 0; r < SIZE; r += 1) {
    let streak = 1;
    for (let c = 1; c <= SIZE; c += 1) {
      if (c < SIZE && src[r][c] === src[r][c - 1]) {
        streak += 1;
      } else {
        if (streak >= 3) {
          for (let k = 0; k < streak; k += 1) found.add(`${r},${c - 1 - k}`);
        }
        streak = 1;
      }
    }
  }

  for (let c = 0; c < SIZE; c += 1) {
    let streak = 1;
    for (let r = 1; r <= SIZE; r += 1) {
      if (r < SIZE && src[r][c] === src[r - 1][c]) {
        streak += 1;
      } else {
        if (streak >= 3) {
          for (let k = 0; k < streak; k += 1) found.add(`${r - 1 - k},${c}`);
        }
        streak = 1;
      }
    }
  }

  return [...found].map((key) => key.split(',').map(Number));
}

function collapse() {
  for (let c = 0; c < SIZE; c += 1) {
    const stack = [];
    for (let r = SIZE - 1; r >= 0; r -= 1) {
      if (board[r][c] !== null) stack.push(board[r][c]);
    }

    for (let r = SIZE - 1; r >= 0; r -= 1) {
      board[r][c] = stack[SIZE - 1 - r] || randGem();
    }
  }
}

async function resolveBoard() {
  let combo = 0;
  let totalCleared = 0;

  while (true) {
    const matches = findMatches(board);
    if (!matches.length) break;

    combo += 1;
    totalCleared += matches.length;
    matches.forEach(([r, c]) => {
      board[r][c] = null;
    });

    render();
    await pause(140);
    collapse();
    render();
    await pause(140);
  }

  return { combo, totalCleared };
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rivalCounter(combo) {
  const hit = Math.min(16, 4 + Math.floor(Math.random() * 8) + combo * 2);
  playerHp = Math.max(0, playerHp - hit);
  return hit;
}

async function handleTurn(first, second) {
  locked = true;
  swap(first, second);
  render();

  const openingMatches = findMatches(board);
  if (!openingMatches.length) {
    swap(first, second);
    selected = null;
    statusEl.textContent = 'No match from that swap. Try a different move!';
    locked = false;
    render();
    return;
  }

  const { combo, totalCleared } = await resolveBoard();
  const damage = combo > 0 ? combo * 8 + Math.floor(totalCleared / 2) : 0;
  enemyHp = Math.max(0, enemyHp - damage);

  if (enemyHp === 0) {
    statusEl.textContent = `K.O.! You win with a ${combo}x combo!`;
    selected = null;
    locked = false;
    render();
    return;
  }

  const counter = rivalCounter(combo);
  if (playerHp === 0) {
    statusEl.textContent = `You dealt ${damage}, but took ${counter} back. You were knocked out!`;
    selected = null;
    locked = false;
    render();
    return;
  }

  statusEl.textContent = `Combo ${combo}x! You dealt ${damage} damage and took ${counter} in return.`;
  selected = null;
  locked = false;
  render();
}

function handleCellClick(row, col) {
  if (locked || playerHp === 0 || enemyHp === 0) return;

  const next = { row, col };
  if (!selected) {
    selected = next;
    statusEl.textContent = 'Select an adjacent gem to swap.';
    render();
    return;
  }

  if (selected.row === row && selected.col === col) {
    selected = null;
    statusEl.textContent = 'Selection cleared.';
    render();
    return;
  }

  if (!adjacent(selected, next)) {
    selected = next;
    statusEl.textContent = 'Pick a neighboring gem for the swap.';
    render();
    return;
  }

  handleTurn(selected, next);
}

function restartGame() {
  playerHp = MAX_HP;
  enemyHp = MAX_HP;
  selected = null;
  locked = false;
  makeCleanBoard();
  statusEl.textContent = 'Make a move!';
  render();
}

restartBtn.addEventListener('click', restartGame);
restartGame();
