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

  /* ===================== CALENDAR ===================== */
  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const CAL_START = { year: 2025, month: 8 };
  const CAL_END = { year: 2026, month: 5 };

  /**
   * Воспоминания по датам (ключ: YYYY-MM-DD).
   * Заполни своими фото, видео и текстами:
   *   image: URL или путь к локальному файлу
   *   video: ID YouTube-видео (только ID, без URL)
   *   text: текст воспоминания
   */
  const MEMORIES = {
    '2025-09-09': {
      image: 'https://picsum.photos/seed/love0909/520/320',
      video: 'dQw4w9WgXcQ',
      text: 'День, когда всё началось… Наш первый день вместе. Я помню каждую секунду этого вечера ♡'
    },
    '2025-09-14': {
      image: 'https://picsum.photos/seed/love0914/520/320',
      video: '',
      text: 'Наша первая прогулка под звёздами. Ты смеялась, и мир стал прекраснее.'
    },
    '2025-10-01': {
      image: 'https://picsum.photos/seed/love1001/520/320',
      video: 'LXb3EKWsInQ',
      text: 'Октябрь — месяц тёплых объятий и горячего какао вдвоём.'
    },
    '2025-12-31': {
      image: 'https://picsum.photos/seed/love1231/520/320',
      video: '',
      text: 'Новый год мы встретили вместе. Пусть каждый следующий — только с тобой.'
    },
    '2026-02-14': {
      image: 'https://picsum.photos/seed/love0214/520/320',
      video: '3JZ_D3xNXRY',
      text: 'День святого Валентина — а для меня каждый день с тобой — праздник любви.'
    },
    '2026-03-08': {
      image: 'https://picsum.photos/seed/love0308/520/320',
      video: '',
      text: '8 марта — день моей принцессы. Ты заслуживаешь всего самого нежного.'
    }
  };

  const DEFAULT_MEMORY = {
    image: 'https://picsum.photos/seed/ourday/520/320',
    video: '',
    text: 'Здесь будет наше воспоминание… Добавь текст, фото и видео в объект MEMORIES в app.js ♡'
  };

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
      const inRange = isInRange(currentYear, currentMonth);

      if (inRange) {
        el.classList.add('active');
        if (MEMORIES[dateKey]) el.classList.add('has-memory');
        if (dateKey === '2025-09-09') el.classList.add('special');
        el.addEventListener('click', () => openModal(currentYear, currentMonth, day));
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

  /* ===================== MODAL ===================== */
  const overlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const modalDate = document.getElementById('modal-date');
  const modalImage = document.getElementById('modal-image');
  const modalVideo = document.getElementById('modal-video');
  const modalVideoWrap = document.getElementById('modal-video-wrap');
  const modalText = document.getElementById('modal-text');

  function openModal(year, month, day) {
    const dateKey = formatDateKey(year, month, day);
    const memory = MEMORIES[dateKey] || DEFAULT_MEMORY;

    modalDate.textContent = formatDateDisplay(year, month, day);
    modalImage.src = memory.image;
    modalImage.alt = `Фото — ${formatDateDisplay(year, month, day)}`;
    modalText.textContent = memory.text;

    if (memory.video) {
      modalVideoWrap.hidden = false;
      modalVideo.src = `https://www.youtube.com/embed/${memory.video}?autoplay=0`;
    } else {
      modalVideoWrap.hidden = true;
      modalVideo.src = '';
    }

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('visible');
    modalVideo.src = '';
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
  });

})();
