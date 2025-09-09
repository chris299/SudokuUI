// Main app logic

(function () {
  const boardEl = document.getElementById('sudokuBoard');
  const statusEl = document.getElementById('statusText');
  const overlayEl = document.getElementById('boardOverlay');
  const explainListEl = document.getElementById('explainList');

  const difficultyEl = document.getElementById('difficulty');
  const newBtn = document.getElementById('newPuzzleBtn');
  const hintBtn = document.getElementById('hintBtn');
  const solveBtn = document.getElementById('solveBtn');
  const explainBtn = document.getElementById('explainBtn');
  const evaluateBtn = document.getElementById('evaluateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const enterModeBtn = document.getElementById('enterModeBtn');
  const healthBtn = document.getElementById('healthCheckBtn');

  const SIZE = Sudoku.SIZE;

  let currentPuzzle = Sudoku.emptyGrid();
  let currentSolution = null; // 9x9 grid
  let fixedMask = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
  let enterMode = false;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function showOverlay(title, description) {
    overlayEl.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'overlay-card';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const p = document.createElement('p');
    p.textContent = description || '';
    const ok = document.createElement('button');
    ok.className = 'ok';
    ok.textContent = 'OK';
    ok.addEventListener('click', () => overlayEl.classList.add('hidden'));
    card.append(h3, p, ok);
    overlayEl.appendChild(card);
    overlayEl.classList.remove('hidden');
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const wrap = document.createElement('div');
        wrap.className = 'cell';
        if ((c + 1) % 3 === 0 && c !== SIZE - 1) wrap.dataset.br = '1';
        if ((r + 1) % 3 === 0 && r !== SIZE - 1) wrap.dataset.bb = '1';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.inputMode = 'numeric';
        inp.maxLength = 1;
        inp.autocomplete = 'off';
        inp.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);
        inp.dataset.r = String(r);
        inp.dataset.c = String(c);
        inp.addEventListener('input', onCellInput);
        inp.addEventListener('keydown', onCellKeyDown);
        wrap.appendChild(inp);
        boardEl.appendChild(wrap);
      }
    }
  }

  function getCellInput(r, c) {
    return boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
  }

  function readGrid() {
    const cells = Array.from(boardEl.querySelectorAll('input')).map((i) => i.value);
    return Sudoku.fromHuman(cells);
  }

  function renderGrid(grid, opts = {}) {
    const { fixed = fixedMask } = opts;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const inp = getCellInput(r, c);
        const v = grid[r][c];
        inp.value = v === 0 ? '' : String(v);
        inp.disabled = fixed && fixed[r][c];
        inp.classList.toggle('fixed', !!(fixed && fixed[r][c]));
        inp.classList.remove('invalid');
      }
    }
  }

  function computeFixedMask(puzzle) {
    return puzzle.map(row => row.map(n => n !== 0));
  }

  function isValidPlacement(grid, r, c, n) {
    // Check row
    for (let j = 0; j < SIZE; j++) if (j !== c && grid[r][j] === n) return false;
    // Check col
    for (let i = 0; i < SIZE; i++) if (i !== r && grid[i][c] === n) return false;
    // Check box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if ((i !== r || j !== c) && grid[i][j] === n) return false;
      }
    }
    return true;
  }

  function updateInvalidHighlights() {
    const g = readGrid();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const inp = getCellInput(r, c);
        if (!inp.value) { inp.classList.remove('invalid'); continue; }
        const n = parseInt(inp.value, 10);
        const ok = isValidPlacement(g, r, c, n);
        inp.classList.toggle('invalid', !ok);
      }
    }
  }

  async function checkCompletionIfDone() {
    const g = readGrid();
    if (!Sudoku.isComplete(g)) return; // not full

    try {
      let solution = currentSolution;
      if (!solution) {
        const solved = await SudokuAPI.solve(g);
        solution = solved.solution;
      }
      if (Sudoku.equals(g, solution)) {
        showOverlay('Solved! 🎉', 'Great job — the puzzle is correct.');
        setStatus('Solved correctly.');
      } else {
        showOverlay('Incorrect', 'Some numbers are wrong. Keep trying!');
        setStatus('Grid filled, but incorrect.');
      }
    } catch (e) {
      console.error(e);
      setStatus(`Check failed: ${e.message}`);
    }
  }

  // Event handlers
  function onCellInput(e) {
    const inp = e.target;
    if (inp.disabled) return;
    let v = inp.value.replace(/[^1-9]/g, '');
    v = v.slice(0, 1);
    inp.value = v;
    updateInvalidHighlights();
    checkCompletionIfDone();
  }

  function onCellKeyDown(e) {
    const inp = e.target;
    const r = parseInt(inp.dataset.r, 10);
    const c = parseInt(inp.dataset.c, 10);
    let nr = r, nc = c;
    switch (e.key) {
      case 'ArrowUp': nr = Math.max(0, r - 1); break;
      case 'ArrowDown': nr = Math.min(8, r + 1); break;
      case 'ArrowLeft': nc = Math.max(0, c - 1); break;
      case 'ArrowRight': nc = Math.min(8, c + 1); break;
      default: return;
    }
    e.preventDefault();
    getCellInput(nr, nc).focus();
  }

  async function handleNewPuzzle() {
    try {
      enterMode = false;
      enterModeBtn.dataset.active = 'false';
      setStatus('Generating puzzle…');
      const diff = difficultyEl.value;
      const { puzzle, solution, difficulty } = await SudokuAPI.generate({ difficulty: diff, solutionIncluded: true });
      currentPuzzle = puzzle;
      currentSolution = solution || null;
      fixedMask = computeFixedMask(puzzle);
      renderGrid(puzzle);
      setStatus(`New puzzle generated (${difficulty}).`);
      explainListEl.innerHTML = '';
    } catch (e) {
      console.error(e);
      setStatus(`Generate failed: ${e.message}`);
    }
  }

  function handleEnterModeToggle() {
    enterMode = !enterMode;
    enterModeBtn.dataset.active = enterMode ? 'true' : 'false';
    currentPuzzle = Sudoku.emptyGrid();
    currentSolution = null;
    fixedMask = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
    renderGrid(currentPuzzle);
    setStatus(enterMode ? 'Enter Mode: type a puzzle to solve.' : 'Enter Mode off.');
    explainListEl.innerHTML = '';
  }

  function handleClear() {
    if (enterMode) {
      currentPuzzle = Sudoku.emptyGrid();
      currentSolution = null;
      fixedMask = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
      renderGrid(currentPuzzle);
    } else {
      const g = readGrid();
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) if (!fixedMask[r][c]) g[r][c] = 0;
      }
      renderGrid(g);
    }
    setStatus('Cleared.');
    updateInvalidHighlights();
  }

  async function handleHint() {
    try {
      const g = readGrid();
      const { solution } = await SudokuAPI.solve(g);
      // Find first empty or wrong cell and fill it
      let placed = false;
      for (let r = 0; r < SIZE && !placed; r++) {
        for (let c = 0; c < SIZE && !placed; c++) {
          if (fixedMask[r][c]) continue;
          const cur = g[r][c];
          const target = solution[r][c];
          if (cur === 0 || cur !== target) {
            g[r][c] = target;
            placed = true;
          }
        }
      }
      if (placed) {
        renderGrid(g);
        setStatus('Hint applied.');
      } else {
        setStatus('No hint available — already matches solution.');
      }
    } catch (e) {
      console.error(e);
      setStatus(`Hint failed: ${e.message}`);
    }
  }

  async function handleSolve() {
    try {
      const g = readGrid();
      const { solution } = await SudokuAPI.solve(g);
      currentSolution = solution;
      renderGrid(solution);
      setStatus('Solved (filled with solution).');
      showOverlay('Solved', 'Filled the grid with a valid solution.');
    } catch (e) {
      console.error(e);
      setStatus(`Solve failed: ${e.message}`);
    }
  }

  async function handleExplain() {
    try {
      const g = readGrid();
      const { solution, steps = [] } = await SudokuAPI.explain(g);
      currentSolution = solution;
      explainListEl.innerHTML = '';
      steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = Sudoku.formatStep(step);
        explainListEl.appendChild(li);
      });
      setStatus(`Explanation loaded: ${steps.length} steps.`);
    } catch (e) {
      console.error(e);
      setStatus(`Explain failed: ${e.message}`);
    }
  }

  async function handleEvaluate() {
    try {
      const g = readGrid();
      const { rating } = await SudokuAPI.evaluate(g);
      if (rating && rating.level) setStatus(`Difficulty: ${rating.level} (score ${rating.score})`);
      else setStatus('Evaluated.');
    } catch (e) {
      console.error(e);
      setStatus(`Evaluate failed: ${e.message}`);
    }
  }

  async function handleHealth() {
    try {
      const data = await SudokuAPI.health();
      setStatus(data && data.ok ? 'API healthy.' : 'API responded.');
    } catch (e) {
      console.error(e);
      setStatus(`Health check failed: ${e.message}`);
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    buildBoard();
    renderGrid(currentPuzzle);
    updateInvalidHighlights();

    newBtn.addEventListener('click', handleNewPuzzle);
    enterModeBtn.addEventListener('click', handleEnterModeToggle);
    clearBtn.addEventListener('click', handleClear);
    hintBtn.addEventListener('click', handleHint);
    solveBtn.addEventListener('click', handleSolve);
    explainBtn.addEventListener('click', handleExplain);
    evaluateBtn.addEventListener('click', handleEvaluate);
    healthBtn.addEventListener('click', handleHealth);
  });
})();

