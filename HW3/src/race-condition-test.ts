
/* ==================================================
   HW3 - TASK 3.5
   RACE CONDITION & OVERSELLING PREVENTION
   ================================================== */

interface SimulationResult {
  requests: number;
  successful: number;
  rejected: number;
  remainingStock: number;
}

const INITIAL_STOCK = 3;
const REQUEST_COUNT = 10;

// Simulate asynchronous work between reading
// stock and updating stock.
function asyncDelay(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 20);
  });
}

// ==================================================
// 1. UNSAFE IMPLEMENTATION
// ==================================================

// All requests can read the same old stock value
// before any update is committed.

async function runUnsafeSimulation():
  Promise<SimulationResult> {

  let stock = INITIAL_STOCK;
  let successful = 0;
  let rejected = 0;

  const requests = Array.from(
    { length: REQUEST_COUNT },
    async () => {
      // Read shared stock
      const observedStock = stock;

      // Simulate an asynchronous operation
      await asyncDelay();

      // Stale stock check
      if (observedStock > 0) {
        stock -= 1;
        successful += 1;
      } else {
        rejected += 1;
      }
    }
  );

  await Promise.all(requests);

  return {
    requests: REQUEST_COUNT,
    successful,
    rejected,
    remainingStock: stock,
  };
}

// ==================================================
// 2. SAFE IMPLEMENTATION
// ==================================================

// Each order checks and updates shared stock
// synchronously without awaiting in between.

async function runSafeSimulation():
  Promise<SimulationResult> {

  let stock = INITIAL_STOCK;
  let successful = 0;
  let rejected = 0;

  const requests = Array.from(
    { length: REQUEST_COUNT },
    async () => {
      await asyncDelay();

      // Atomic with respect to this JS event loop:
      // no await between stock validation and update.
      if (stock > 0) {
        stock -= 1;
        successful += 1;
      } else {
        rejected += 1;
      }
    }
  );

  await Promise.all(requests);

  return {
    requests: REQUEST_COUNT,
    successful,
    rejected,
    remainingStock: stock,
  };
}

// ==================================================
// 3. DOM HELPERS
// ==================================================

function createStat(
  label: string,
  valueId: string
): string {
  return `
    <div class="race-stat">
      <span>${label}</span>
      <strong id="${valueId}">—</strong>
    </div>
  `;
}

function showResult(
  prefix: string,
  result: SimulationResult
): void {

  const values: Record<string, number> = {
    requests: result.requests,
    successful: result.successful,
    rejected: result.rejected,
    stock: result.remainingStock,
  };

  for (const [key, value] of Object.entries(values)) {
    const element = document.getElementById(
      `${prefix}-${key}`
    );

    if (element) {
      element.textContent = String(value);
    }
  }
}

// ==================================================
// 4. MOUNT TEST PANEL
// ==================================================

export function mountRaceConditionTest(): void {
  const main = document.querySelector("main");

  if (!main) {
    throw new Error("Main element not found");
  }

  const section = document.createElement("section");

  section.className = "race-panel";
  section.id = "race-condition-test";

  section.innerHTML = `
    <div class="section-heading">
      <div>
        <span class="eyebrow">
          TASK 3.5 - CONCURRENCY SAFETY
        </span>

        <h2>Race Condition Comparison</h2>
      </div>

      <span class="status">Simulation</span>
    </div>

    <p class="race-description">
      Compare 10 concurrent purchase requests
      competing for 3 units of stock.
    </p>

    <div class="race-grid">

      <div class="race-result-card unsafe-card">
        <h3>Unsafe Processing</h3>

        <p>
          Read stock, await, then update using
          an outdated stock observation.
        </p>

        <div class="race-stats">
          ${createStat("Requests", "unsafe-requests")}
          ${createStat("Successful", "unsafe-successful")}
          ${createStat("Rejected", "unsafe-rejected")}
          ${createStat("Final Stock", "unsafe-stock")}
        </div>
      </div>

      <div class="race-result-card safe-card">
        <h3>Safe Processing</h3>

        <p>
          Validate and reduce stock together
          without an asynchronous gap.
        </p>

        <div class="race-stats">
          ${createStat("Requests", "safe-requests")}
          ${createStat("Successful", "safe-successful")}
          ${createStat("Rejected", "safe-rejected")}
          ${createStat("Final Stock", "safe-stock")}
        </div>
      </div>

    </div>

    <button
      type="button"
      id="run-race-test"
      class="simulate-button"
    >
      Run Race Condition Test
    </button>

    <p
      id="race-message"
      class="race-message"
      role="status"
      aria-live="polite"
    >
      Click the button to compare both strategies.
    </p>
  `;

  main.appendChild(section);

  const button =
    section.querySelector<HTMLButtonElement>(
      "#run-race-test"
    );

  const message =
    section.querySelector<HTMLElement>(
      "#race-message"
    );

  if (!button || !message) {
    throw new Error("Race test controls missing");
  }

  button.addEventListener("click", async () => {
    if (button.disabled) return;

    button.disabled = true;
    message.textContent = "Running simulations...";

    try {
      const [unsafeResult, safeResult] =
        await Promise.all([
          runUnsafeSimulation(),
          runSafeSimulation(),
        ]);

      showResult("unsafe", unsafeResult);
      showResult("safe", safeResult);

      const safePassed =
        safeResult.successful === INITIAL_STOCK &&
        safeResult.rejected ===
          REQUEST_COUNT - INITIAL_STOCK &&
        safeResult.remainingStock === 0;

      const unsafeOversold =
        unsafeResult.successful > INITIAL_STOCK &&
        unsafeResult.remainingStock < 0;

      if (safePassed && unsafeOversold) {
        message.textContent =
          "PASS: Unsafe processing oversold stock. " +
          "Safe processing accepted only 3 orders.";
      } else {
        message.textContent =
          "Unexpected result. Review simulation output.";
      }

      console.table({
        Unsafe: unsafeResult,
        Safe: safeResult,
      });
    } catch (error) {
      console.error("Race condition test error:", error);

      message.textContent =
        "Simulation failed. Check the browser console.";
    } finally {
      button.disabled = false;
    }
  });
}
