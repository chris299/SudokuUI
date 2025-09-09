Sudoku UI (Vanilla JS)
======================

A lightweight, framework‑free Sudoku web app that runs entirely in the browser and uses a public Sudoku API for generating, solving, evaluating, validating, and explaining puzzles.

Features
--------
- Generate new puzzles by difficulty (easy/medium/hard/expert)
- Enter Mode to input your own puzzle
- Automatic correctness check when the last cell is filled
- One‑cell Hint (computed via the solver)
- Solve fully on request
- Explain solution steps (techniques + placements/eliminations)
- Evaluate difficulty of any grid

Tech Stack
----------
- Plain HTML/CSS/JavaScript (no frameworks)
- API: see `docs/openapi.yaml` and base URL below

API
---
Default base: `https://sudokus-api.netlify.app`

Endpoints used (see `docs/openapi.yaml`):
- `POST /api/v1/sudoku/generate` – body `{ difficulty, solutionIncluded }`
- `POST /api/v1/sudoku/solve` – body `{ puzzle }`
- `POST /api/v1/sudoku/evaluate` – body `{ puzzle }`
- `POST /api/v1/sudoku/validate` – body `{ puzzle }`
- `POST /api/v1/sudoku/explain` – body `{ puzzle }`
- `GET /healthz`

You can override the API base in two ways:
- URL query: `?api=https://my-api.example.com`
- In the UI input in the header (persisted to localStorage)

Project Structure
-----------------
- `index.html` – main page
- `css/style.css` – modern, responsive styles
- `js/api.js` – tiny API client for the endpoints
- `js/sudoku.js` – grid utilities and helpers
- `js/app.js` – UI logic and event handling
- `docs/openapi.yaml` – OpenAPI 3.0 spec (downloaded from the provided URL)

Running Locally
---------------
This is a static site; serve with any webserver (e.g., Apache, Nginx). For quick local testing:

1) Python: `python -m http.server 8080`
2) Node: `npx http-server -p 8080`

Then open `http://localhost:8080/`.

Notes
-----
- Some browsers may block cross‑origin requests from `file://` URLs. Use a local server.
- The app requests a solution only when needed (hint/solve/explain) and uses the API for generation/evaluation as required.

End-to-End Tests (Playwright)
-----------------------------
This repo includes Playwright tests that run against a tiny built-in static server (no dependencies).

Setup
- Requires Node.js 18+.
- Install dev deps and Playwright browsers:
  - `npm install`
  - `npm run pw:install`

Run tests
- `npm test` – starts the static server and runs tests headlessly.
- `npm run test:ui` – Playwright UI mode.
- `npm run pw:report` – open the last HTML report.

Record new tests
- Start the local server: `npm start`
- In another terminal: `npm run codegen`
  - This opens a browser to record actions and generate a test.

Where things are
- Config: `playwright.config.js` (launches `node scripts/serve.js -p 5173`)
- Static server: `scripts/serve.js`
- Tests: `tests/sudoku.spec.js`

Notes
- Tests stub the Sudoku API network calls (generate/solve/health) with known responses, so they work offline and deterministically.

Continuous Integration (GitHub Actions)
---------------------------------------
- Workflow file: `.github/workflows/ci.yml`
- Triggers: on every push and via manual dispatch.
- What it does: installs Node + Playwright, starts the static server (via Playwright config), runs tests, and uploads the HTML report as an artifact.

Manual run
- Go to GitHub → Actions → CI → Run workflow.
- After completion, download the “playwright-report” artifact.
