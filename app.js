(function () {
  'use strict';

  /* ===================== RELATIONSHIP COUNTER ===================== */
  const START_DATE = new Date(2025, 8, 9, 0, 0, 0);

  function updateCounter() {
    const now = new Date();
    const diff = Math.max(0, now - START_DATE);

    const totalDays = Math.floor(diff / 86400000);
    const totalHours = Math.floor(diff / 3600000);
    const totalMinutes = Math.floor(diff / 60000);
    const totalSeconds = Math.floor(diff / 1000);

    document.getElementById('days').textContent = totalDays.toLocaleString('ru-RU');
    document.getElementById('hours').textContent = totalHours.toLocaleString('ru-RU');
    document.getElementById('minutes').textContent = totalMinutes.toLocaleString('ru-RU');
    document.getElementById('seconds').textContent = totalSeconds.toLocaleString('ru-RU');
  }

  updateCounter();
  setInterval(updateCounter, 1000);

  /* ===================== CROSSWORD ===================== */
  /*
   * Сетка с пересечениями — слова горизонтально и вертикально.
   * Все остальные клетки заполняются случайными буквами-отвлекателями.
   */
  const FILLER_LETTERS = 'АБВГДЕЖЗКЛМНОПРСТУФХЦЧШЩЫЭЮЯ';

  function createFillerGenerator(seed) {
    let state = seed >>> 0;
    return function nextFiller() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return FILLER_LETTERS[state % FILLER_LETTERS.length];
    };
  }

  const nextFiller = createFillerGenerator(20250909);
  const WORDS = [
    { word: 'госпожа', row: 0, col: 1, dir: 'h' },
    { word: 'принцесса', row: 1, col: 1, dir: 'h' },
    { word: 'сладкая', row: 2, col: 9, dir: 'h' },
    { word: 'любовь', row: 3, col: 5, dir: 'v' },
    { word: 'любимая', row: 5, col: 3, dir: 'h' },
    { word: 'солнышко', row: 6, col: 4, dir: 'h' },
    { word: 'любимый', row: 7, col: 6, dir: 'h' },
    { word: 'бусинка', row: 10, col: 1, dir: 'h' },
    { word: 'бубочка', row: 11, col: 2, dir: 'h' },
    { word: 'булочка', row: 12, col: 1, dir: 'h' },
    { word: 'зайка', row: 13, col: 4, dir: 'h' },
    { word: 'котик', row: 14, col: 6, dir: 'h' },
    { word: 'китя', row: 15, col: 7, dir: 'h' },
    { word: 'умничка', row: 8, col: 7, dir: 'h' },
    { word: 'зёпа', row: 9, col: 11, dir: 'h' },
    { word: 'котенок', row: 16, col: 1, dir: 'h' }
  ];

  function getCellsForWord(w) {
    const cells = [];
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'h' ? w.row : w.row + i;
      const c = w.dir === 'h' ? w.col + i : w.col;
      cells.push([r, c]);
    }
    return cells;
  }

  function buildCrosswordGrid() {
    const cellMap = new Map();
    const wordEntries = [];

    WORDS.forEach((w) => {
      const cells = getCellsForWord(w);
      wordEntries.push({ word: w.word, cells, found: false });

      cells.forEach(([r, c], i) => {
        const key = `${r},${c}`;
        const letter = w.word[i];
        if (cellMap.has(key)) {
          if (cellMap.get(key).letter !== letter) {
            console.warn(`Conflict at ${key}: ${cellMap.get(key).letter} vs ${letter}`);
          }
        } else {
          cellMap.set(key, { letter, row: r, col: c, isWord: true });
        }
      });
    });

    let minRow = Infinity;
    let minCol = Infinity;
    let maxRow = 0;
    let maxCol = 0;

    cellMap.forEach(({ row, col }) => {
      minRow = Math.min(minRow, row);
      minCol = Math.min(minCol, col);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    });

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const key = `${r},${c}`;
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            letter: nextFiller(),
            row: r,
            col: c,
            isWord: false
          });
        }
      }
    }

    return {
      cellMap,
      wordEntries,
      minRow,
      minCol,
      rows: maxRow - minRow + 1,
      cols: maxCol - minCol + 1
    };
  }

  const crossword = buildCrosswordGrid();
  const gridEl = document.getElementById('crossword-grid');
  const linesEl = document.getElementById('crossword-lines');
  const wordListEl = document.getElementById('word-list');
  const foundCountEl = document.getElementById('found-count');
  const totalCountEl = document.getElementById('total-count');

  totalCountEl.textContent = crossword.wordEntries.length;

  const cellElements = new Map();

  const crosswordWrapper = document.querySelector('.crossword-wrapper');
  const CROSSWORD_GAP = 3;
  const CROSSWORD_MAX_CELL = 38;
  const CROSSWORD_MIN_CELL = 16;
  const MOBILE_BREAKPOINT = 430;
  const MOBILE_MIN_CELL = 24;
  const MOBILE_GAP = 2;

  function applyCrosswordCellSize(cellSize, gap) {
    gridEl.style.gridTemplateColumns = `repeat(${crossword.cols}, ${cellSize}px)`;
    gridEl.style.gridTemplateRows = `repeat(${crossword.rows}, ${cellSize}px)`;
    gridEl.style.gap = `${gap}px`;
    document.documentElement.style.setProperty('--crossword-cell-size', `${cellSize}px`);
    document.documentElement.style.setProperty('--crossword-gap', `${gap}px`);
  }

  function fitCrossword() {
    if (!crosswordWrapper) return;

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const gap = isMobile ? MOBILE_GAP : CROSSWORD_GAP;
    const minCell = isMobile ? MOBILE_MIN_CELL : CROSSWORD_MIN_CELL;

    const styles = getComputedStyle(crosswordWrapper);
    const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const availableWidth = crosswordWrapper.clientWidth - padX;

    let cellByWidth = (availableWidth - (crossword.cols - 1) * gap) / crossword.cols;
    cellByWidth = Math.floor(cellByWidth);

    let cellSize = Math.min(CROSSWORD_MAX_CELL, Math.max(minCell, cellByWidth));

    if (isMobile) {
      cellSize = Math.max(MOBILE_MIN_CELL, cellSize);
    } else {
      const maxGridHeight = Math.min(window.innerHeight * 0.55, 420);
      let cellByHeight = (maxGridHeight - (crossword.rows - 1) * gap) / crossword.rows;
      cellByHeight = Math.floor(cellByHeight);
      cellSize = Math.max(CROSSWORD_MIN_CELL, Math.min(cellSize, cellByHeight));
    }

    applyCrosswordCellSize(cellSize, gap);
    resizeSvg();
  }

  for (let r = crossword.minRow; r <= crossword.minRow + crossword.rows - 1; r++) {
    for (let c = crossword.minCol; c <= crossword.minCol + crossword.cols - 1; c++) {
      const key = `${r},${c}`;
      const { letter, isWord } = crossword.cellMap.get(key);
      const cell = document.createElement('div');
      cell.className = isWord ? 'cell cell-word' : 'cell cell-filler';
      cell.textContent = letter;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.gridRow = r - crossword.minRow + 1;
      cell.style.gridColumn = c - crossword.minCol + 1;
      cellElements.set(key, cell);
      gridEl.appendChild(cell);
    }
  }

  crossword.wordEntries.forEach(({ word }) => {
    const li = document.createElement('li');
    li.textContent = word;
    li.dataset.word = word;
    wordListEl.appendChild(li);
  });

  let isSelecting = false;
  let startCell = null;
  let selectedCells = [];

  function cellKey(row, col) {
    return `${row},${col}`;
  }

  function getCellCenter(key) {
    const el = cellElements.get(key);
    if (!el) return null;
    const gridRect = gridEl.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - gridRect.left,
      y: rect.top + rect.height / 2 - gridRect.top
    };
  }

  function getDirection(from, to) {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    if (dr === 0 && dc === 0) return null;
    if (dr !== 0 && dc !== 0) return null;
    return { dr: Math.sign(dr), dc: Math.sign(dc) };
  }

  function getCellsInLine(start, end) {
    const dir = getDirection(start, end);
    if (!dir) return [startCell];

    const cells = [];
    let r = start.row;
    let c = start.col;
    const maxSteps = Math.max(crossword.rows, crossword.cols);

    for (let i = 0; i <= maxSteps; i++) {
      const key = cellKey(r, c);
      if (!cellElements.has(key)) break;
      cells.push(key);

      if (r === end.row && c === end.col) break;
      r += dir.dr;
      c += dir.dc;
    }

    const lastKey = cellKey(end.row, end.col);
    if (cells[cells.length - 1] !== lastKey) return null;
    return cells;
  }

  function clearSelection() {
    selectedCells.forEach((key) => {
      const el = cellElements.get(key);
      if (el && !el.classList.contains('found')) {
        el.classList.remove('selecting');
      }
    });
    selectedCells = [];
  }

  function setSelection(cells) {
    clearSelection();
    if (!cells) return;
    selectedCells = cells.filter((key) => {
      const el = cellElements.get(key);
      return el && !el.classList.contains('found');
    });
    selectedCells.forEach((key) => {
      cellElements.get(key).classList.add('selecting');
    });
  }

  function cellsMatchWord(cells) {
    const normalized = cells.slice().sort((a, b) => {
      const [ar, ac] = a.split(',').map(Number);
      const [br, bc] = b.split(',').map(Number);
      return ar - br || ac - bc;
    });

    return crossword.wordEntries.find((entry) => {
      if (entry.found) return false;
      const entryKeys = entry.cells.map(([r, c]) => cellKey(r, c)).sort((a, b) => {
        const [ar, ac] = a.split(',').map(Number);
        const [br, bc] = b.split(',').map(Number);
        return ar - br || ac - bc;
      });
      const reversed = entryKeys.slice().reverse();
      return (
        arraysEqual(normalized, entryKeys) ||
        arraysEqual(normalized, reversed)
      );
    });
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  function drawWordLine(cells) {
    if (cells.length < 2) return;

    const points = cells.map(getCellCenter).filter(Boolean);
    if (points.length < 2) return;

    let defs = linesEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffd700"/>
          <stop offset="50%" stop-color="#7dcea0"/>
          <stop offset="100%" stop-color="#ffd700"/>
        </linearGradient>`;
      linesEl.appendChild(defs);
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points.map((p) => `${p.x},${p.y}`).join(' '));
    path.classList.add('word-line');

    const length = points.reduce((sum, p, i) => {
      if (i === 0) return 0;
      const prev = points[i - 1];
      return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
    }, 0);
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    linesEl.appendChild(path);
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0';
    });
  }

  function spawnParticles(x, y) {
    const container = document.getElementById('particles');
    const colors = ['#ffb6c1', '#ffd4b8', '#ffd700', '#ff8fab', '#a8e6cf'];

    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      const isHeart = i % 3 === 0;
      p.className = `particle ${isHeart ? 'heart' : 'confetti'}`;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      p.style.setProperty('--ty', `${-80 - Math.random() * 160}px`);
      p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      p.style.setProperty('--duration', `${1 + Math.random() * 0.8}s`);

      if (isHeart) {
        p.textContent = '♥';
        p.style.setProperty('--size', `${12 + Math.random() * 14}px`);
      } else {
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.setProperty('--size', `${6 + Math.random() * 6}px`);
      }

      container.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  function markWordFound(entry, cells) {
    entry.found = true;
    cells.forEach((key) => {
      const el = cellElements.get(key);
      if (el) {
        el.classList.remove('selecting');
        el.classList.add('found');
      }
    });

    drawWordLine(cells);

    const li = wordListEl.querySelector(`[data-word="${entry.word}"]`);
    if (li) li.classList.add('found');

    const found = crossword.wordEntries.filter((e) => e.found).length;
    foundCountEl.textContent = found;

    const midCell = cells[Math.floor(cells.length / 2)];
    const center = getCellCenter(midCell);
    if (center) {
      const gridRect = gridEl.getBoundingClientRect();
      spawnParticles(gridRect.left + center.x, gridRect.top + center.y);
    }
  }

  function showError(cells) {
    cells.forEach((key) => {
      const el = cellElements.get(key);
      if (el && !el.classList.contains('found')) {
        el.classList.add('error');
        setTimeout(() => el.classList.remove('error'), 500);
      }
    });
  }

  function handlePointerDown(e) {
    const cell = e.target.closest('.cell:not(.found)');
    if (!cell) return;
    e.preventDefault();

    isSelecting = true;
    startCell = {
      row: Number(cell.dataset.row),
      col: Number(cell.dataset.col)
    };
    setSelection([cellKey(startCell.row, startCell.col)]);
  }

  function handlePointerMove(e) {
    if (!isSelecting || !startCell) return;

    let target = e.target;
    if (e.touches) {
      const touch = e.touches[0];
      target = document.elementFromPoint(touch.clientX, touch.clientY);
    }

    const cell = target?.closest?.('.cell');
    if (!cell) return;

    const endCell = {
      row: Number(cell.dataset.row),
      col: Number(cell.dataset.col)
    };

    const line = getCellsInLine(startCell, endCell);
    if (line) setSelection(line);
  }

  function handlePointerUp() {
    if (!isSelecting) return;
    isSelecting = false;

    if (selectedCells.length === 0) {
      startCell = null;
      return;
    }

    const match = cellsMatchWord(selectedCells);
    if (match) {
      markWordFound(match, selectedCells);
    } else if (selectedCells.length > 1) {
      showError(selectedCells);
    }

    clearSelection();
    startCell = null;
  }

  gridEl.addEventListener('mousedown', handlePointerDown);
  gridEl.addEventListener('mousemove', handlePointerMove);
  document.addEventListener('mouseup', handlePointerUp);

  gridEl.addEventListener('touchstart', handlePointerDown, { passive: false });
  gridEl.addEventListener('touchmove', handlePointerMove, { passive: false });
  document.addEventListener('touchend', handlePointerUp);

  function resizeSvg() {
    const rect = gridEl.getBoundingClientRect();
    linesEl.setAttribute('width', rect.width);
    linesEl.setAttribute('height', rect.height);
    linesEl.style.width = `${rect.width}px`;
    linesEl.style.height = `${rect.height}px`;
  }

  fitCrossword();
  requestAnimationFrame(fitCrossword);
  window.addEventListener('resize', fitCrossword);
  window.addEventListener('orientationchange', () => setTimeout(fitCrossword, 150));

  /* ===================== SURPRISES ===================== */
  const FLIP_CARDS = [
    { emoji: '👑', text: 'Ты моя принцесса — и это не шутка' },
    { emoji: '☀️', text: 'С тобой даже обычный день — солнышко' },
    { emoji: '🧸', text: 'Обнимать тебя — моё любимое занятие' },
    { emoji: '🍰', text: 'Ты сладкая, как лучшая булочка' },
    { emoji: '🌙', text: 'Про тебя я думаю даже перед сном' },
    { emoji: '💫', text: 'Рядом с тобой я самый счастливый' }
  ];

  const loveEnvelope = document.getElementById('love-envelope');
  const envelopeHint = document.getElementById('envelope-hint');
  const flipGrid = document.getElementById('flip-grid');
  const flipCountEl = document.getElementById('flip-count');
  const flipTotalEl = document.getElementById('flip-total');
  const flipReward = document.getElementById('flip-reward');
  const catchStart = document.getElementById('catch-start');
  const catchArena = document.getElementById('catch-arena');
  const catchScoreEl = document.getElementById('catch-score');
  const catchTimeEl = document.getElementById('catch-time');
  const catchResult = document.getElementById('catch-result');
  const envelopeLockNotice = document.getElementById('envelope-lock-notice');

  let flippedCount = 0;
  let envelopeUnlocked = false;

  function unlockEnvelope() {
    if (!loveEnvelope || envelopeUnlocked) return;
    envelopeUnlocked = true;
    loveEnvelope.classList.remove('envelope-locked');
    loveEnvelope.removeAttribute('aria-disabled');
    loveEnvelope.setAttribute('aria-label', 'Открыть письмо');
    if (envelopeLockNotice) {
      envelopeLockNotice.textContent = '✓ Сердечки пойманы! Теперь можно открыть письмо ♡';
      envelopeLockNotice.classList.add('is-unlocked');
    }
    if (envelopeHint) {
      envelopeHint.textContent = 'Нажми на конверт';
    }
  }

  if (loveEnvelope) {
    loveEnvelope.addEventListener('click', () => {
      if (!envelopeUnlocked || loveEnvelope.classList.contains('opened')) {
        if (!envelopeUnlocked) {
          loveEnvelope.classList.add('envelope-shake');
          setTimeout(() => loveEnvelope.classList.remove('envelope-shake'), 450);
        }
        return;
      }
      loveEnvelope.classList.add('opened');
      if (envelopeHint) {
        envelopeHint.textContent = 'Письмо для тебя ♡';
        setTimeout(() => envelopeHint.classList.add('is-hidden'), 2000);
      }
      const rect = loveEnvelope.getBoundingClientRect();
      spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  if (flipGrid && flipTotalEl) {
    flipTotalEl.textContent = FLIP_CARDS.length;

    FLIP_CARDS.forEach((card, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flip-card';
      btn.setAttribute('aria-label', `Карточка ${i + 1}`);
      btn.innerHTML = `
        <span class="flip-card-inner">
          <span class="flip-face flip-front">${card.emoji}</span>
          <span class="flip-face flip-back">${card.text}</span>
        </span>`;

      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-flipped')) return;
        btn.classList.add('is-flipped');
        flippedCount++;
        if (flipCountEl) flipCountEl.textContent = flippedCount;

        if (flippedCount === FLIP_CARDS.length && flipReward) {
          flipReward.hidden = false;
          const rect = flipGrid.getBoundingClientRect();
          spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });

      flipGrid.appendChild(btn);
    });
  }

  let catchTimer = null;
  let catchSpawner = null;
  let catchScore = 0;
  let catchTimeLeft = 15;

  function endCatchGame(won) {
    clearInterval(catchTimer);
    clearInterval(catchSpawner);
    catchTimer = null;
    catchSpawner = null;
    if (catchStart) catchStart.disabled = false;
    catchArena.querySelectorAll('.catch-heart').forEach((h) => h.remove());

    if (catchResult) {
      catchResult.hidden = false;
      catchResult.textContent = won
        ? 'Ура! Ты поймала все сердечки! Я тебя люблю ♡'
        : 'Почти! Попробуй ещё раз — у тебя получится ♡';
    }

    if (won) {
      const rect = catchArena.getBoundingClientRect();
      spawnParticles(rect.left + rect.width / 2, rect.top);
      unlockEnvelope();
    }
  }

  function spawnCatchHeart() {
    if (!catchArena.classList.contains('is-active')) return;

    const heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'catch-heart';
    heart.textContent = '♥';
    heart.setAttribute('aria-label', 'Поймать сердечко');

    const maxX = Math.max(0, catchArena.clientWidth - 40);
    const maxY = Math.max(0, catchArena.clientHeight - 40);
    heart.style.left = `${Math.random() * maxX}px`;
    heart.style.top = `${Math.random() * maxY}px`;

    heart.addEventListener('click', () => {
      heart.remove();
      catchScore++;
      if (catchScoreEl) catchScoreEl.textContent = catchScore;
      if (catchScore >= 10) endCatchGame(true);
    });

    catchArena.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) heart.remove();
    }, 2500);
  }

  if (catchStart && catchArena) {
    catchStart.addEventListener('click', () => {
      if (catchTimer) return;

      catchScore = 0;
      catchTimeLeft = 15;
      if (catchScoreEl) catchScoreEl.textContent = '0';
      if (catchTimeEl) catchTimeEl.textContent = '15';
      if (catchResult) catchResult.hidden = true;

      catchStart.disabled = true;
      catchArena.classList.add('is-active');
      catchArena.setAttribute('aria-hidden', 'false');
      catchArena.querySelectorAll('.catch-heart').forEach((h) => h.remove());

      spawnCatchHeart();
      catchSpawner = setInterval(spawnCatchHeart, 700);

      catchTimer = setInterval(() => {
        catchTimeLeft--;
        if (catchTimeEl) catchTimeEl.textContent = String(catchTimeLeft);
        if (catchTimeLeft <= 0) endCatchGame(catchScore >= 10);
      }, 1000);
    });
  }

  /* ===================== CALENDAR ===================== */
  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const CAL_START = { year: 2025, month: 8 };
  const CAL_END = { year: 2026, month: 5 };

  let MEMORIES = window.MEMORIES_DATA || {};

  function mediaPath(entry, filename) {
    if (entry.folder) {
      return `${entry.folder}/${filename}`;
    }
    return filename;
  }

  function encodePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  const EMOJI_RULES = [
    [/поцел|поцелов/i, '💋'],
    [/фотосесс|пофотк/i, '📸✨'],
    [/кино/i, '🎬🍿'],
    [/колесо обозрения/i, '🎡💫'],
    [/день рожд|тортик|18 лет/i, '🎂🎉'],
    [/зал/i, '💪'],
    [/дач/i, '🌿🏡'],
    [/котик|кота|кот/i, '🐱'],
    [/уточ/i, '🦆☕'],
    [/кофе/i, '☕'],
    [/минск|зоопарк|немиг/i, '🦁🐾'],
    [/шаурм|пите/i, '🌯'],
    [/кроссов/i, '👟💕'],
    [/ногти/i, '💅'],
    [/видео|дурачил/i, '📹😄'],
    [/домой/i, '🏠'],
    [/встреч/i, '💑'],
    [/спичк|петард/i, '🔥😄'],
    [/отпечат.*рук/i, '🤝✋'],
    [/6 месяц/i, '💖🎊'],
    [/мост/i, '🌉'],
    [/каникул/i, '🎄💝'],
    [/бабушк/i, '👵🎂'],
    [/первый раз/i, '💕✨'],
    [/предложил встреч/i, '💍💑']
  ];

  function collectEmojis(emojiStr) {
    return [...emojiStr].filter((ch) => /\p{Extended_Pictographic}/u.test(ch));
  }

  function enrichTextWithEmojis(text) {
    const emojis = [];
    for (const [pattern, emojiStr] of EMOJI_RULES) {
      if (pattern.test(text)) {
        collectEmojis(emojiStr).forEach((e) => {
          if (!emojis.includes(e)) emojis.push(e);
        });
      }
    }
    const prefix = emojis.length ? emojis.slice(0, 5).join(' ') + ' ' : '💕 ';
    const hasHeart = /[♡❤💕💖]/.test(text);
    return prefix + text + (hasHeart ? '' : ' ♡');
  }

  async function loadMemoryText(entry) {
    const path = entry.folder
      ? `${entry.folder}/${entry.textFile || 'Текстовый документ.txt'}`
      : entry.textFile;
    try {
      const res = await fetch(encodePath(path));
      if (res.ok) {
        return enrichTextWithEmojis((await res.text()).trim());
      }
    } catch (_) { /* offline or file:// */ }
    return enrichTextWithEmojis(entry.text || '');
  }

  let currentYear = CAL_START.year;
  let currentMonth = CAL_START.month;

  const calendarTitle = document.getElementById('calendar-title');
  const calendarGrid = document.getElementById('calendar-grid');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');

  function monthIndex(year, month) {
    return year * 12 + month;
  }

  function isInRange(year, month) {
    const idx = monthIndex(year, month);
    return idx >= monthIndex(CAL_START.year, CAL_START.month) &&
           idx <= monthIndex(CAL_END.year, CAL_END.month);
  }

  function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function formatDateDisplay(year, month, day) {
    return `${day} ${MONTH_NAMES[month]} ${year}`;
  }

  function renderCalendar() {
    calendarTitle.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';

    prevBtn.disabled = monthIndex(currentYear, currentMonth) <= monthIndex(CAL_START.year, CAL_START.month);
    nextBtn.disabled = monthIndex(currentYear, currentMonth) >= monthIndex(CAL_END.year, CAL_END.month);

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = day;

      const dateKey = formatDateKey(currentYear, currentMonth, day);
      const memory = MEMORIES[dateKey];

      if (memory) {
        el.classList.add('active', 'has-memory');
        if (dateKey === '2025-09-09') el.classList.add('special');
        el.addEventListener('click', () => openModal(currentYear, currentMonth, day));
      } else if (isInRange(currentYear, currentMonth)) {
        el.classList.add('inactive');
      }

      calendarGrid.appendChild(el);
    }
  }

  prevBtn.addEventListener('click', () => {
    if (monthIndex(currentYear, currentMonth) <= monthIndex(CAL_START.year, CAL_START.month)) return;
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    if (monthIndex(currentYear, currentMonth) >= monthIndex(CAL_END.year, CAL_END.month)) return;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  renderCalendar();

  fetch('memories.json')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Object.keys(data).length) {
        MEMORIES = data;
        renderCalendar();
      }
    })
    .catch(() => {});

  /* ===================== MODAL ===================== */
  const overlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const modalDate = document.getElementById('modal-date');
  const modalText = document.getElementById('modal-text');
  const modalSlider = document.getElementById('modal-slider');
  const sliderTrack = document.getElementById('slider-track');
  const sliderDots = document.getElementById('slider-dots');
  const sliderCounter = document.getElementById('slider-counter');
  const sliderPrev = document.getElementById('slider-prev');
  const sliderNext = document.getElementById('slider-next');
  const modalVideos = document.getElementById('modal-videos');

  let sliderIndex = 0;
  let sliderImages = [];
  let activeVideos = [];

  function stopAllVideos() {
    activeVideos.forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    activeVideos = [];
  }

  function buildSlider(images, dateLabel) {
    sliderImages = images;
    sliderIndex = 0;
    sliderTrack.innerHTML = '';
    sliderDots.innerHTML = '';

    if (images.length === 0) {
      modalSlider.hidden = true;
      return;
    }

    modalSlider.hidden = false;

    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slider-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Фото ${i + 1} — ${dateLabel}`;
      img.loading = 'lazy';
      slide.appendChild(img);
      sliderTrack.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Фото ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      sliderDots.appendChild(dot);
    });

    updateSlider();
  }

  function updateSlider() {
    sliderTrack.style.transform = `translateX(-${sliderIndex * 100}%)`;
    sliderDots.querySelectorAll('.slider-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === sliderIndex);
    });
    sliderCounter.textContent = sliderImages.length > 1
      ? `${sliderIndex + 1} / ${sliderImages.length}`
      : '';
    sliderPrev.disabled = sliderIndex === 0;
    sliderNext.disabled = sliderIndex === sliderImages.length - 1;
  }

  function goToSlide(index) {
    sliderIndex = Math.max(0, Math.min(index, sliderImages.length - 1));
    updateSlider();
  }

  sliderPrev.addEventListener('click', () => goToSlide(sliderIndex - 1));
  sliderNext.addEventListener('click', () => goToSlide(sliderIndex + 1));

  let touchStartX = 0;
  modalSlider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  modalSlider.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      goToSlide(sliderIndex + (diff < 0 ? 1 : -1));
    }
  }, { passive: true });

  function buildVideoGallery(videos, dateLabel) {
    stopAllVideos();
    modalVideos.innerHTML = '';

    if (videos.length === 0) {
      modalVideos.hidden = true;
      return;
    }

    modalVideos.hidden = false;

    videos.forEach((src, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'video-card';

      const label = document.createElement('span');
      label.className = 'video-label';
      label.textContent = videos.length > 1 ? `Видео ${i + 1} 🎬` : 'Наше видео 🎬';

      const video = document.createElement('video');
      video.className = 'modal-video';
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('aria-label', `Видео ${i + 1} — ${dateLabel}`);

      wrap.appendChild(label);
      wrap.appendChild(video);
      modalVideos.appendChild(wrap);
      activeVideos.push(video);
    });
  }

  async function openModal(year, month, day) {
    const dateKey = formatDateKey(year, month, day);
    const entry = MEMORIES[dateKey];
    if (!entry) return;

    const dateLabel = formatDateDisplay(year, month, day);
    modalDate.textContent = dateLabel;
    modalText.textContent = 'Загружаем воспоминание…';

    const images = (entry.images || []).map((f) => encodePath(mediaPath(entry, f)));
    const videos = (entry.videos || []).map((f) => encodePath(mediaPath(entry, f)));

    buildSlider(images, dateLabel);
    buildVideoGallery(videos, dateLabel);

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.body.style.overflow = 'hidden';

    modalText.textContent = await loadMemoryText(entry);
  }

  function closeModal() {
    overlay.classList.remove('visible');
    stopAllVideos();
    sliderTrack.innerHTML = '';
    modalVideos.innerHTML = '';
    modalSlider.hidden = true;
    modalVideos.hidden = true;
    document.body.style.overflow = '';
    setTimeout(() => {
      overlay.hidden = true;
    }, 350);
  }

  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
    if (!overlay.hidden && e.key === 'ArrowLeft') goToSlide(sliderIndex - 1);
    if (!overlay.hidden && e.key === 'ArrowRight') goToSlide(sliderIndex + 1);
  });

  /* ===================== LOVE GATE ===================== */
  const gateOverlay = document.getElementById('gate-overlay');
  const gateYes = document.getElementById('gate-yes');
  const gateNo = document.getElementById('gate-no');
  const gateNoZone = document.getElementById('gate-no-zone');
  const siteContent = document.getElementById('site-content');

  function moveNoButton() {
    if (!gateNoZone || !gateNo) return;

    const maxX = Math.max(0, gateNoZone.clientWidth - gateNo.offsetWidth - 8);
    const maxY = Math.max(0, gateNoZone.clientHeight - gateNo.offsetHeight - 8);
    const x = 4 + Math.random() * maxX;
    const y = 4 + Math.random() * maxY;

    gateNo.classList.add('is-dodging');
    gateNo.style.left = `${x}px`;
    gateNo.style.top = `${y}px`;
    gateNo.style.transform = 'none';
  }

  function revealSite() {
    gateYes.disabled = true;
    gateOverlay.classList.add('gate-hide');
    document.body.classList.remove('gate-active');
    siteContent.classList.remove('site-locked');
    siteContent.classList.add('site-revealed');

    const items = document.querySelectorAll('.reveal-item');
    items.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('is-visible');
      }, 350 + i * 300);
    });

    setTimeout(() => {
      gateOverlay.remove();
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }, 350 + items.length * 300 + 700);
  }

  if (gateYes) {
    gateYes.addEventListener('click', revealSite);
  }

  if (gateNo) {
    gateNo.addEventListener('click', (e) => {
      e.preventDefault();
      moveNoButton();
    });

    gateNo.addEventListener('mouseenter', moveNoButton);

    gateNo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      moveNoButton();
    }, { passive: false });

    gateNoZone.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const rect = gateNo.getBoundingClientRect();
      const near = touch.clientX >= rect.left - 30 &&
        touch.clientX <= rect.right + 30 &&
        touch.clientY >= rect.top - 30 &&
        touch.clientY <= rect.bottom + 30;
      if (near) moveNoButton();
    }, { passive: true });
  }

})();
