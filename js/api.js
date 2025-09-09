// Lightweight client for the Sudoku API
// Endpoints from docs/openapi.yaml

(function () {
  const DEFAULT_BASE = 'https://sudokus-api.netlify.app';

  function resolveBaseFromQuery() {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get('api');
      return q ? q : null;
    } catch (e) {
      return null;
    }
  }

  function getAPIBase() {
    const input = document.getElementById('apiBaseInput');
    const fromInput = input && input.value.trim();
    const fromQuery = resolveBaseFromQuery();
    const stored = localStorage.getItem('sudoku_api_base') || '';
    return fromInput || fromQuery || stored || DEFAULT_BASE;
  }

  function setAPIBase(base) {
    const input = document.getElementById('apiBaseInput');
    if (input) input.value = base;
    if (base) localStorage.setItem('sudoku_api_base', base);
  }

  function headers() {
    return { 'Content-Type': 'application/json' };
  }

  async function request(path, options = {}) {
    const base = getAPIBase().replace(/\/$/, '');
    const url = base + path;
    const resp = await fetch(url, options);
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!resp.ok) {
      const err = new Error((data && (data.error || data.message)) || `HTTP ${resp.status}`);
      err.status = resp.status; err.data = data; err.url = url;
      throw err;
    }
    return data;
  }

  // API methods
  async function generate({ difficulty = 'medium', solutionIncluded = true } = {}) {
    return request('/api/v1/sudoku/generate', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ difficulty, solutionIncluded })
    });
  }

  async function solve(puzzle) {
    return request('/api/v1/sudoku/solve', {
      method: 'POST', headers: headers(), body: JSON.stringify({ puzzle })
    });
  }

  async function evaluate(puzzle) {
    return request('/api/v1/sudoku/evaluate', {
      method: 'POST', headers: headers(), body: JSON.stringify({ puzzle })
    });
  }

  async function validate(puzzle) {
    return request('/api/v1/sudoku/validate', {
      method: 'POST', headers: headers(), body: JSON.stringify({ puzzle })
    });
  }

  async function explain(puzzle) {
    return request('/api/v1/sudoku/explain', {
      method: 'POST', headers: headers(), body: JSON.stringify({ puzzle })
    });
  }

  async function health() {
    return request('/healthz', { method: 'GET' });
  }

  // Export to window
  window.SudokuAPI = { generate, solve, evaluate, validate, explain, health, getAPIBase, setAPIBase };

  // Initialize base from stored/query
  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('apiBaseInput');
    const initial = window.SudokuAPI.getAPIBase();
    if (input) input.value = initial;
  });
})();

