
import "./style.css";

import { createAntiDriftTimer } from "./anti-drift-timer";
import { InventoryStateMachine } from "./inventory-state-machine";
import { OrderQueue } from "./order-queue";
import type { OrderRequest, OrderResult } from "./order-queue";
import { mountRaceConditionTest } from "./race-condition-test";

// =====================================================
// HW3 - TASK 3.8
// OPTIMISTIC INVENTORY LOCK, RESERVATION AND CHECKOUT
// =====================================================

// 1. PRODUCT DATA

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  salePrice: number;
  initialStock: number;
  icon: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Audio",
    price: 2500000,
    salePrice: 1490000,
    initialStock: 12,
    icon: "🎧",
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Wearables",
    price: 3200000,
    salePrice: 1990000,
    initialStock: 8,
    icon: "⌚",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: 1800000,
    salePrice: 990000,
    initialStock: 15,
    icon: "⌨️",
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    category: "Audio",
    price: 1600000,
    salePrice: 790000,
    initialStock: 6,
    icon: "🔊",
  },
];

// 2. APPLICATION STATE

const LOCK_DURATION_MS = 15000;
const SALE_DURATION_MS = 60 * 60 * 1000;

const saleEndTime = Date.now() + SALE_DURATION_MS;

const inventory = new InventoryStateMachine();

for (const product of products) {
  inventory.registerProduct(
    product.id,
    product.initialStock
  );
}

let nextOrderId = 1;
let rejectedOrders = 0;
let revenue = 0;

let saleExpired = false;
let isSimulating = false;

let activeReservationId: string | null = null;

// 3. HELPER FUNCTIONS

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function discountPercent(product: Product): number {
  return Math.round(
    ((product.price - product.salePrice) /
      product.price) *
      100
  );
}

function formatCountdown(ms: number): string {
  const value = Math.max(0, Math.floor(ms));

  const hours = Math.floor(value / 3600000);
  const minutes = Math.floor(
    (value % 3600000) / 60000
  );
  const seconds = Math.floor(
    (value % 60000) / 1000
  );
  const milliseconds = value % 1000;

  return (
    [hours, minutes, seconds]
      .map((number) =>
        String(number).padStart(2, "0")
      )
      .join(":") +
    "." +
    String(milliseconds).padStart(3, "0")
  );
}

function formatLockTime(ms: number): string {
  const remaining = Math.max(0, Math.floor(ms));

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor(
    (remaining % 60000) / 1000
  );
  const milliseconds = remaining % 1000;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(milliseconds).padStart(3, "0")
  );
}

function getRemainingSaleMs(): number {
  return Math.max(
    0,
    saleEndTime - Date.now()
  );
}

function getProduct(
  productId: number
): Product | undefined {
  return products.find(
    (product) => product.id === productId
  );
}

// 4. RENDER FLASHMART INTERFACE

const app =
  document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app");
}

app.innerHTML = `
  <div class="app-shell">

    <!-- HEADER -->
    <header class="header">
      <a class="logo" href="#home">
        ⚡ FlashMart
      </a>

      <nav aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#products">Flash Deals</a>
        <a href="#inventory">Inventory</a>
      </nav>

      <span class="header-badge">
        FLASH SALE ENGINE
      </span>
    </header>

    <main>

      <!-- HERO -->
      <section class="hero" id="home">
        <div class="hero-content">
          <span class="tag">
            LIMITED TIME OFFER
          </span>

          <h1>
            Big Deals.<br>
            Small Prices.
          </h1>

          <p>
            Experience limited-stock deals with
            optimistic inventory locking and
            temporary product reservations.
          </p>

          <a href="#products" class="hero-button">
            Explore Flash Deals →
          </a>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="flash-circle">⚡</div>
        </div>
      </section>

      <!-- ZERO-DRIFT TIMER -->
      <section class="sale-banner">
        <div>
          <span class="eyebrow">
            FLASH SALE EVENT
          </span>

          <h2>Today's Hot Deals</h2>

          <p id="sale-status">
            Limited stock available.
          </p>
        </div>

        <div class="countdown-box">
          <span>Precision countdown</span>

          <strong id="countdown">
            01:00:00.000
          </strong>
        </div>
      </section>

      <!-- PRODUCT LIST -->
      <section
        class="products-section"
        id="products"
      >
        <div class="section-heading">
          <div>
            <span class="eyebrow">
              EXCLUSIVE OFFERS
            </span>

            <h2>Flash Sale Products</h2>
          </div>

          <span class="product-count">
            ${products.length} Products
          </span>
        </div>

        <div class="product-grid">

          ${products.map((product) => `
            <article
              class="product-card"
              data-product-id="${product.id}"
            >
              <div class="product-image">
                <span class="discount-badge">
                  -${discountPercent(product)}%
                </span>

                <span class="product-emoji">
                  ${product.icon}
                </span>
              </div>

              <div class="product-content">
                <span class="category">
                  ${product.category}
                </span>

                <h3>${product.name}</h3>

                <p class="original-price">
                  ${formatPrice(product.price)}
                </p>

                <p class="sale-price">
                  ${formatPrice(product.salePrice)}
                </p>

                <div class="stock-info">
                  <span>Available stock</span>

                  <strong id="stock-${product.id}">
                    ${product.initialStock} left
                  </strong>
                </div>

                <div class="stock-bar">
                  <div
                    class="stock-fill"
                    id="bar-${product.id}"
                    style="width: 100%"
                  ></div>
                </div>

                <button
                  type="button"
                  class="buy-button"
                  data-buy-id="${product.id}"
                >
                  Reserve Now
                </button>
              </div>
            </article>
          `).join("")}

        </div>

        <p
          id="order-message"
          class="order-message"
          role="status"
          aria-live="polite"
        >
          Click Reserve Now to hold one item
          for 15 seconds.
        </p>
      </section>

      <!-- RESERVATION AND CHECKOUT -->
      <section
        class="inventory-panel"
        id="reservation"
      >
        <div class="section-heading">
          <div>
            <span class="eyebrow">
              OPTIMISTIC INVENTORY LOCK
            </span>

            <h2>Reservation & Checkout</h2>
          </div>

          <span
            class="status"
            id="lock-status"
          >
            No reservation
          </span>
        </div>

        <p
          class="info-note"
          id="reservation-details"
        >
          Reserve a product to begin checkout.
        </p>

        <div class="reservation-stats">

          <div class="stat-card">
            <span>Reservation state</span>

            <strong id="reservation-state">
              AVAILABLE
            </strong>
          </div>

          <div class="stat-card">
            <span>Lock expires in</span>

            <strong id="lock-countdown">
              00:15.000
            </strong>
          </div>

          <div class="stat-card">
            <span>Inventory version</span>

            <strong id="inventory-version">
              0
            </strong>
          </div>

        </div>

        <div class="reservation-actions">

          <button
            id="checkout-btn"
            type="button"
            class="simulate-button"
            disabled
          >
            Confirm Checkout
          </button>

          <button
            id="cancel-reservation-btn"
            type="button"
            class="reservation-cancel-btn"
            disabled
          >
            Cancel Reservation
          </button>

        </div>

        <p class="info-note">
          AVAILABLE → RESERVED → CHECKED_OUT
          or EXPIRED / CANCELLED.
        </p>
      </section>

      <!-- INVENTORY DASHBOARD -->
      <section
        class="inventory-panel"
        id="inventory"
      >
        <div class="section-heading">
          <div>
            <span class="eyebrow">
              INVENTORY OVERVIEW
            </span>

            <h2>Stock Monitoring</h2>
          </div>

          <span
            class="status"
            id="inventory-status"
          >
            Sale Active
          </span>
        </div>

        <div class="inventory-grid">

          <div class="stat-card">
            <span>Available</span>
            <strong id="total-stock">41</strong>
          </div>

          <div class="stat-card">
            <span>Reserved</span>
            <strong id="total-reserved">0</strong>
          </div>

          <div class="stat-card">
            <span>Sold</span>
            <strong id="orders-processed">0</strong>
          </div>

        </div>

        <p class="info-note">
          Revenue:
          <strong id="total-revenue">
            0 ₫
          </strong>
        </p>

        <p class="info-note">
          Rejected orders:
          <strong id="rejected-orders">0</strong>
        </p>
      </section>

      <!-- CONCURRENT ORDER SIMULATOR -->
      <section
        class="inventory-panel"
        id="simulation"
      >
        <div class="section-heading">
          <div>
            <span class="eyebrow">
              CONCURRENT ORDER TEST
            </span>

            <h2>Order Processing Simulator</h2>
          </div>

          <span
            class="status"
            id="simulation-status"
          >
            Ready
          </span>
        </div>

        <p class="info-note">
          Simulate 10 orders for Bluetooth Speaker.
          Each order reserves stock,
          then checks out.
        </p>

        <button
          id="simulate-btn"
          type="button"
          class="simulate-button"
        >
          ⚡ Simulate 10 Orders
        </button>

        <div class="simulation-results">

          <div class="stat-card">
            <span>Requests</span>
            <strong id="sim-total">0</strong>
          </div>

          <div class="stat-card">
            <span>Successful</span>
            <strong id="sim-success">0</strong>
          </div>

          <div class="stat-card">
            <span>Rejected</span>
            <strong id="sim-rejected">0</strong>
          </div>

        </div>

        <p
          class="info-note"
          id="simulation-message"
          role="status"
          aria-live="polite"
        >
          Press the button to test stock safety.
        </p>
      </section>

    </main>

    <footer class="footer">
      FlashMart · TypeScript + Vite · HW3
    </footer>

  </div>
`;

// 5. DOM HELPER

function getElement<T extends Element>(
  selector: string
): T {
  const element =
    document.querySelector<T>(selector);

  if (!element) {
    throw new Error(
      `Missing element: ${selector}`
    );
  }

  return element;
}

// 6. DOM REFERENCES

const countdownElement =
  getElement<HTMLElement>("#countdown");

const saleStatusElement =
  getElement<HTMLElement>("#sale-status");

const inventoryStatusElement =
  getElement<HTMLElement>("#inventory-status");

const orderMessage =
  getElement<HTMLElement>("#order-message");

const lockStatus =
  getElement<HTMLElement>("#lock-status");

const reservationDetails =
  getElement<HTMLElement>("#reservation-details");

const reservationState =
  getElement<HTMLElement>("#reservation-state");

const lockCountdown =
  getElement<HTMLElement>("#lock-countdown");

const inventoryVersion =
  getElement<HTMLElement>("#inventory-version");

const checkoutButton =
  getElement<HTMLButtonElement>("#checkout-btn");

const cancelButton =
  getElement<HTMLButtonElement>(
    "#cancel-reservation-btn"
  );

const totalStockElement =
  getElement<HTMLElement>("#total-stock");

const totalReservedElement =
  getElement<HTMLElement>("#total-reserved");

const ordersElement =
  getElement<HTMLElement>("#orders-processed");

const revenueElement =
  getElement<HTMLElement>("#total-revenue");

const rejectedElement =
  getElement<HTMLElement>("#rejected-orders");

const simulateButton =
  getElement<HTMLButtonElement>("#simulate-btn");

const simulationStatus =
  getElement<HTMLElement>("#simulation-status");

const simulationMessage =
  getElement<HTMLElement>("#simulation-message");

const simTotal =
  getElement<HTMLElement>("#sim-total");

const simSuccess =
  getElement<HTMLElement>("#sim-success");

const simRejected =
  getElement<HTMLElement>("#sim-rejected");

// 7. INVENTORY RENDERING

function updateInventoryUI(): void {
  let available = 0;
  let reserved = 0;
  let sold = 0;

  for (const product of products) {
    const snapshot =
      inventory.getInventory(product.id);

    available += snapshot.available;
    reserved += snapshot.reserved;
    sold += snapshot.sold;

    const stockLabel = getElement<HTMLElement>(
      `#stock-${product.id}`
    );

    const stockBar = getElement<HTMLElement>(
      `#bar-${product.id}`
    );

    const button =
      getElement<HTMLButtonElement>(
        `[data-buy-id="${product.id}"]`
      );

    stockLabel.textContent =
      `${snapshot.available} left`;

    stockBar.style.width =
      `${
        (snapshot.available /
          product.initialStock) *
        100
      }%`;

    button.disabled =
      saleExpired ||
      snapshot.available === 0;

    button.textContent = saleExpired
      ? "Sale Ended"
      : snapshot.available === 0
        ? "Sold Out"
        : "Reserve Now";
  }

  totalStockElement.textContent =
    String(available);

  totalReservedElement.textContent =
    String(reserved);

  ordersElement.textContent =
    String(sold);

  revenueElement.textContent =
    formatPrice(revenue);

  rejectedElement.textContent =
    String(rejectedOrders);
}

// 8. RESERVATION RENDERING

function updateReservationUI(): void {
  if (!activeReservationId) {
    lockStatus.textContent = "No reservation";

    reservationState.textContent =
      "AVAILABLE";

    lockCountdown.textContent =
      "00:15.000";

    reservationDetails.textContent =
      "Reserve a product to begin checkout.";

    checkoutButton.disabled = true;
    cancelButton.disabled = true;

    return;
  }

  const reservation =
    inventory.getReservation(activeReservationId);

  if (!reservation) {
    activeReservationId = null;
    updateReservationUI();
    return;
  }

  const product =
    getProduct(reservation.productId);

  const remaining = Math.max(
    0,
    reservation.expiresAt - Date.now()
  );

  reservationState.textContent =
    reservation.status;

  lockStatus.textContent =
    reservation.status;

  lockCountdown.textContent =
    formatLockTime(remaining);

  inventoryVersion.textContent =
    String(
      inventory.getInventory(
        reservation.productId
      ).version
    );

  reservationDetails.textContent =
    `${product?.name ?? "Product"} · Quantity: ` +
    `${reservation.quantity} · ${reservation.status}`;

  const canCheckout =
    reservation.status === "RESERVED" &&
    remaining > 0 &&
    !saleExpired;

  checkoutButton.disabled = !canCheckout;

  cancelButton.disabled =
    reservation.status !== "RESERVED" ||
    remaining <= 0;
}

// 9. INVENTORY CHANGE NOTIFICATION

inventory.onChange = () => {
  updateInventoryUI();
  updateReservationUI();
};

// 10. RESERVE PRODUCT

const productSection =
  getElement<HTMLElement>("#products");

productSection.addEventListener(
  "click",
  (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button =
      target.closest<HTMLButtonElement>(
        ".buy-button"
      );

    if (!button || button.disabled) {
      return;
    }

    if (getRemainingSaleMs() <= 0) {
      endSale();
      return;
    }

    // Only one active reservation in this demo
    if (activeReservationId) {
      const existing =
        inventory.getReservation(
          activeReservationId
        );

      if (existing?.status === "RESERVED") {
        orderMessage.textContent =
          "Checkout or cancel your current " +
          "reservation first.";

        return;
      }
    }

    const productId =
      Number(button.dataset.buyId);

    if (!Number.isInteger(productId)) {
      return;
    }

    // Read current version for optimistic locking
    const snapshot =
      inventory.getInventory(productId);

    const result = inventory.reserve(
      productId,
      1,
      snapshot.version,
      LOCK_DURATION_MS
    );

    if (
      !result.success ||
      !result.reservation
    ) {
      rejectedOrders += 1;
      updateInventoryUI();

      orderMessage.textContent =
        `Reservation rejected: ${result.reason}`;

      return;
    }

    activeReservationId =
      result.reservation.id;

    orderMessage.textContent =
      "Product reserved for 15 seconds. " +
      "Confirm checkout!";

    updateReservationUI();

    getElement<HTMLElement>("#reservation")
      .scrollIntoView({
        behavior: "smooth"
      });
  }
);

// 11. CONFIRM CHECKOUT

checkoutButton.addEventListener(
  "click",
  () => {
    if (!activeReservationId) {
      return;
    }

    if (getRemainingSaleMs() <= 0) {
      endSale();

      orderMessage.textContent =
        "Sale has ended.";

      return;
    }

    const reservation =
      inventory.getReservation(
        activeReservationId
      );

    if (
      !reservation ||
      reservation.status !== "RESERVED"
    ) {
      updateReservationUI();
      return;
    }

    const success =
      inventory.checkout(reservation.id);

    if (success) {
      const product =
        getProduct(reservation.productId);

      revenue +=
        (product?.salePrice ?? 0) *
        reservation.quantity;

      orderMessage.textContent =
        "Checkout successful! " +
        "Inventory committed.";
    } else {
      orderMessage.textContent =
        "Checkout rejected: " +
        "reservation expired.";
    }

    updateInventoryUI();
    updateReservationUI();
  }
);

// 12. CANCEL RESERVATION

cancelButton.addEventListener(
  "click",
  () => {
    if (!activeReservationId) {
      return;
    }

    const success =
      inventory.cancelReservation(
        activeReservationId
      );

    orderMessage.textContent = success
      ? "Reservation cancelled. Stock released."
      : "Reservation cannot be cancelled.";

    updateInventoryUI();
    updateReservationUI();
  }
);

// 13. PROCESS ORDER USING INVENTORY LOCK

function processOrder(
  request: OrderRequest
): OrderResult {
  const product =
    getProduct(request.productId);

  if (
    !product ||
    getRemainingSaleMs() <= 0
  ) {
    rejectedOrders++;

    return {
      orderId: request.id,
      productId: request.productId,
      success: false,
      reason:
        "Product missing or sale ended",
    };
  }

  const snapshot =
    inventory.getInventory(
      request.productId
    );

  const result = inventory.reserve(
    request.productId,
    request.quantity,
    snapshot.version,
    LOCK_DURATION_MS
  );

  if (
    !result.success ||
    !result.reservation
  ) {
    rejectedOrders++;

    return {
      orderId: request.id,
      productId: request.productId,
      success: false,
      reason: result.reason,
    };
  }

  const success =
    inventory.checkout(
      result.reservation.id
    );

  if (!success) {
    rejectedOrders++;

    return {
      orderId: request.id,
      productId: request.productId,
      success: false,
      reason: "Checkout failed",
    };
  }

  revenue +=
    product.salePrice * request.quantity;

  return {
    orderId: request.id,
    productId: request.productId,
    success: true,
    reason: "Checkout successful",
  };
}

const orderQueue =
  new OrderQueue(processOrder);

// 14. SIMULATE CONCURRENT ORDERS

simulateButton.addEventListener(
  "click",
  async () => {
    if (
      isSimulating ||
      saleExpired
    ) {
      return;
    }

    isSimulating = true;
    simulateButton.disabled = true;

    simulationStatus.textContent =
      "Processing";

    simulationMessage.textContent =
      "Submitting 10 order requests...";

    try {
      const requests: OrderRequest[] =
        Array.from(
          { length: 10 },
          () => ({
            id: nextOrderId++,
            productId: 4,
            quantity: 1,
          })
        );

      const results = await Promise.all(
        requests.map((request) =>
          orderQueue.enqueue(request)
        )
      );

      const successful =
        results.filter(
          (result) => result.success
        ).length;

      const rejected =
        results.length - successful;

      simTotal.textContent =
        String(results.length);

      simSuccess.textContent =
        String(successful);

      simRejected.textContent =
        String(rejected);

      simulationStatus.textContent =
        "Completed";

      simulationMessage.textContent =
        `${successful} successful, ` +
        `${rejected} rejected.`;

      console.table(results);

      updateInventoryUI();
    } catch (error) {
      console.error(error);

      simulationStatus.textContent =
        "Error";

      simulationMessage.textContent =
        "Simulation failed. Check Console.";
    } finally {
      isSimulating = false;

      simulateButton.disabled =
        saleExpired;
    }
  }
);

// 15. FLASH SALE EXPIRATION

function endSale(): void {
  if (saleExpired) {
    return;
  }

  saleExpired = true;

  saleStatusElement.textContent =
    "The Flash Sale has ended.";

  inventoryStatusElement.textContent =
    "Sale Ended";

  countdownElement.textContent =
    "00:00:00.000";

  simulateButton.disabled = true;

  updateInventoryUI();
  updateReservationUI();
}

// 16. INITIAL RENDER

updateInventoryUI();
updateReservationUI();

// 17. ZERO-DRIFT COUNTDOWN

const stopSaleTimer =
  createAntiDriftTimer(
    getRemainingSaleMs(),
    (remaining) => {
      if (remaining <= 0) {
        endSale();
      } else {
        countdownElement.textContent =
          formatCountdown(remaining);
      }
    }
  );

// 18. RESERVATION COUNTDOWN

// Calculate from actual expiry timestamp
const reservationClock =
  window.setInterval(() => {
    updateReservationUI();
  }, 50);

// 19. RACE CONDITION TEST

mountRaceConditionTest();

// 20. CLEANUP

window.addEventListener(
  "pagehide",
  () => {
    stopSaleTimer();

    window.clearInterval(
      reservationClock
    );

    inventory.dispose();
  }
);
