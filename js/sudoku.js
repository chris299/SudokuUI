// Utility helpers for Sudoku grid management (9x9)

(function () {
  const SIZE = 9;

  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
  }

  function clone(grid) {
    return grid.map(row => row.slice());
  }

  function equals(a, b) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function isComplete(grid) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!Number.isInteger(grid[r][c]) || grid[r][c] < 1 || grid[r][c] > 9) return false;
      }
    }
    return true;
  }

  function toHuman(grid) {
    return grid.map(r => r.map(n => (n === 0 ? '' : String(n))));
  }

  function fromHuman(cells) {
    // cells is 81-length array of strings ('', '1'..'9') → 9x9 number grid
    const g = emptyGrid();
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9;
      const v = (cells[i] || '').trim();
      const n = v === '' ? 0 : parseInt(v, 10);
      g[r][c] = Number.isFinite(n) ? n : 0;
    }
    return g;
  }

  function firstDiff(a, b) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return { r, c };
      }
    }
    return null;
  }

  function formatStep(step) {
    const tech = step.technique || 'Technique';
    const placements = (step.placements || []).map(p => `r${p.r + 1}c${p.c + 1} = ${p.n}`).join(', ');
    const eliminations = (step.eliminations || []).map(e => `r${e.r + 1}c${e.c + 1} ≠ ${e.n}`).join(', ');
    let parts = [tech];
    if (placements) parts.push(`placements: ${placements}`);
    if (eliminations) parts.push(`eliminations: ${eliminations}`);
    return parts.join(' • ');
  }

  window.Sudoku = {
    SIZE,
    emptyGrid,
    clone,
    equals,
    isComplete,
    toHuman,
    fromHuman,
    firstDiff,
    formatStep,
  };
})();

