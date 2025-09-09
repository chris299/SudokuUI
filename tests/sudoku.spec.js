// @ts-check
const { test, expect } = require('@playwright/test');

// Known example puzzle and solution (matches the example from the API spec)
const PUZZLE = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9],
];

const SOLUTION = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9],
];

test.beforeEach(async ({ page }) => {
  // Stub external API calls so tests don't depend on network
  await page.route('**/api/v1/sudoku/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'medium', seed: 'test-seed' })
    });
  });

  await page.route('**/api/v1/sudoku/solve', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ solution: SOLUTION, metrics: { steps: 1, backtracks: 0, techniquesUsed: ['given'] } })
    });
  });

  await page.route('**/healthz', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true })
    });
  });
});

test('renders the page and 9x9 grid', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sudokuBoard input')).toHaveCount(81);
});

test('generates a new puzzle and solves it', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'New Puzzle' }).click();

  // Wait for some fixed, disabled cells to appear after generation
  await page.waitForSelector('#sudokuBoard input.fixed[disabled]');

  // Click Solve and verify all cells match the known solution
  await page.getByRole('button', { name: 'Solve' }).click();
  // Collect all 81 input values from the grid.
  // $$eval runs inside the page: it queries all elements matching the selector,
  // passes the resulting NodeList to the callback, and returns the callback's
  // return value to the test context. Here we map each <input> to its `.value`.
  // Note for VS Code / // @ts-check: `els` is typed as Element[] (HTMLElement|SVGElement),
  // which doesn't guarantee a `.value` property. Since our selector is 'input', we can
  // safely cast to HTMLInputElement[] for type-checking.
  const values = await page.$$eval('#sudokuBoard input', (els) => {
    /** @type {HTMLInputElement[]} */
    const inputs = /** @type {any} */ (els);
    return inputs.map((e) => e.value);
  });
  const expected = SOLUTION.flat().map(String);
  expect(values).toEqual(expected);
});
