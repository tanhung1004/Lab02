
import "./style.css";
import { OrderQueue } from "./order-queue";
import type { OrderRequest, OrderResult } from "./order-queue";
import { mountRaceConditionTest } from "./race-condition-test";
import { createAntiDriftTimer } from "./anti-drift-timer";

// ==========================================
// HW3 - TASK 3.6: ZERO-DRIFT COUNTDOWN TIMER
// ==========================================

// 1. PRODUCT DATA

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  salePrice: number;
  stock: number;
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
    stock: 12,
    initialStock: 12,
    icon: "🎧",
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Wearables",
    price: 3200000,
    salePrice: 1990000,
    stock: 8,
    initialStock: 8,
    icon: "⌚",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: 1800000,
    salePrice: 990000,
    stock: 15,
    initialStock: 15,
    icon: "⌨️",
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    category: "Audio",
    price: 1600000,
    salePrice: 790000,
    stock: 6,
    initialStock: 6,
    icon: "🔊",
  },
];

// 2. SALE STATE

interface SaleState {
  ordersProcessed: number;
  rejectedOrders: number;
  revenue: number;
  isExpired: boolean;
  isSimulating: boolean;
}

const saleState: SaleState = {
  ordersProcessed: 0,
  rejectedOrders: 0,
  revenue: 0,
  isExpired: false,
  isSimulating: false,
};

// Fixed sale deadline in milliseconds
const SALE_DURATION_MS = 60 * 60 * 1000;
const saleEndTime = Date.now() + SALE_DURATION_MS;

let nextOrderId = 1;

// 3. HELPERS

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function discountPercent(product: Product): number {
  return Math.round(
    ((product.price - product.salePrice) / product.price) * 100
  );
}

function getTotalStock(): number {
  return products.reduce(
    (total, product) => total + product.stock,
    0
  );
}

function getRemainingMs(): number {
  return Math.max(0, saleEndTime - Date.now());
}

function formatTime(remainingMs: number): string {
  const ms = Math.max(0, Math.floor(remainingMs));

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const clock = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return (
    clock +
    "." +
    String(milliseconds).padStart(3, "0")
  );
}

// 4. RENDER FLASHMART INTERFACE

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root #app not found");
}

app.innerHTML = `
  <div class="app-shell">

    <header class="header">
      <a class="logo" href="#home">⚡ FlashMart</a>

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
          <span class="tag">LIMITED TIME OFFER</span>

          <h1>
            Big Deals.<br>
            Small Prices.
          </h1>

          <p>
            Experience our flash sale storefront
            with limited inventory and exclusive deals.
          </p>

          <a href="#products" class="hero-button">
            Explore Flash Deals →
          </a>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="flash-circle">⚡</div>
        </div>
      </section>

      <!-- ANTI-DRIFT COUNTDOWN -->
      <section class="sale-banner">
        <div>
          <span class="eyebrow">FLASH SALE EVENT</span>
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

      <!-- PRODUCT CARDS -->
      <section class="products-section" id="products">
        <div class="section-heading">
          <div>
            <span class="eyebrow">EXCLUSIVE OFFERS</span>
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

                  <strong data-stock-id="${product.id}">
                    ${product.stock} left
                  </strong>
                </div>

                <div class="stock-bar">
                  <div
                    class="stock-fill"
                    data-bar-id="${product.id}"
                    style="width: 100%"
                  ></div>
                </div>

                <button
                  type="button"
                  class="buy-button"
                  data-buy-id="${product.id}"
                >
                  Buy Now
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
          Choose a product to place a demo order.
        </p>
      </section>

      <!-- INVENTORY -->
      <section class="inventory-panel" id="inventory">
        <div class="section-heading">
          <div>
            <span class="eyebrow">INVENTORY OVERVIEW</span>
            <h2>Stock Monitoring</h2>
          </div>

          <span class="status" id="inventory-status">
            Sale Active
          </span>
        </div>

        <div class="inventory-grid">
          <div class="stat-card">
            <span>Total Products</span>
            <strong>${products.length}</strong>
          </div>

          <div class="stat-card">
            <span>Total Stock</span>
            <strong id="total-stock">
              ${getTotalStock()}
            </strong>
          </div>

          <div class="stat-card">
            <span>Orders Processed</span>
            <strong id="orders-processed">0</strong>
          </div>
        </div>

        <p class="info-note">
          Demo revenue:
          <strong id="total-revenue">
            ${formatPrice(0)}
          </strong>
        </p>

        <p class="info-note">
          Rejected orders:
          <strong id="rejected-orders">0</strong>
        </p>
      </section>

      <!-- CONCURRENT ORDER SIMULATOR -->
      <section class="inventory-panel" id="simulation">
        <div class="section-heading">
          <div>
            <span class="eyebrow">
              CONCURRENT ORDER TEST
            </span>

            <h2>Order Processing Simulator</h2>
          </div>

          <span class="status" id="simulation-status">
            Ready
          </span>
        </div>

        <p class="info-note">
          Simulate 10 order requests for Bluetooth Speaker.
          Inventory is checked before accepting each order.
        </p>

        <button
          type="button"
          id="simulate-btn"
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
          Press the button to test inventory safety.
        </p>
      </section>

    </main>

    <footer class="footer">
      FlashMart · TypeScript + Vite · HW3
    </footer>
  </div>
`;

// 5. DOM REFERENCES

function getElement<T extends Element>(
  selector: string
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

const countdownElement =
  getElement<HTMLElement>("#countdown");

const saleStatusElement =
  getElement<HTMLElement>("#sale-status");

const inventoryStatusElement =
  getElement<HTMLElement>("#inventory-status");

const totalStockElement =
  getElement<HTMLElement>("#total-stock");

const ordersProcessedElement =
  getElement<HTMLElement>("#orders-processed");

const totalRevenueElement =
  getElement<HTMLElement>("#total-revenue");

const rejectedOrdersElement =
  getElement<HTMLElement>("#rejected-orders");

const orderMessageElement =
  getElement<HTMLElement>("#order-message");

const productSection =
  getElement<HTMLElement>("#products");

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

// 6. UPDATE PRODUCT UI

function updateProductUI(product: Product): void {
  const stockElement = getElement<HTMLElement>(
    `[data-stock-id="${product.id}"]`
  );

  const stockBar = getElement<HTMLElement>(
    `[data-bar-id="${product.id}"]`
  );

  const button = getElement<HTMLButtonElement>(
    `[data-buy-id="${product.id}"]`
  );

  stockElement.textContent = `${product.stock} left`;

  const percentage =
    (product.stock / product.initialStock) * 100;

  stockBar.style.width = `${percentage}%`;

  button.disabled =
    saleState.isExpired || product.stock <= 0;

  button.textContent = saleState.isExpired
    ? "Sale Ended"
    : product.stock <= 0
      ? "Sold Out"
      : "Buy Now";
}

function updateInventoryUI(): void {
  totalStockElement.textContent =
    String(getTotalStock());

  ordersProcessedElement.textContent =
    String(saleState.ordersProcessed);

  rejectedOrdersElement.textContent =
    String(saleState.rejectedOrders);

  totalRevenueElement.textContent =
    formatPrice(saleState.revenue);

  products.forEach(updateProductUI);
}

// 7. SALE EXPIRATION

function endSale(): void {
  if (saleState.isExpired) return;

  saleState.isExpired = true;

  saleStatusElement.textContent =
    "The Flash Sale has ended.";

  inventoryStatusElement.textContent =
    "Sale Ended";

  countdownElement.textContent =
    "00:00:00.000";

  simulateButton.disabled = true;

  updateInventoryUI();
}

// 8. SAFE ORDER PROCESSING

function processOrder(
  request: OrderRequest
): OrderResult {
  const product = products.find(
    (item) => item.id === request.productId
  );

  if (!product) {
    saleState.rejectedOrders++;

    return {
      orderId: request.id,
      productId: request.productId,
      success: false,
      reason: "Product not found",
    };
  }

  // Validate against actual deadline, not UI timer
  if (getRemainingMs() <= 0) {
    endSale();
    saleState.rejectedOrders++;

    return {
      orderId: request.id,
      productId: product.id,
      success: false,
      reason: "Flash Sale ended",
    };
  }

  if (
    !Number.isInteger(request.quantity) ||
    request.quantity <= 0
  ) {
    saleState.rejectedOrders++;

    return {
      orderId: request.id,
      productId: product.id,
      success: false,
      reason: "Invalid quantity",
    };
  }

  if (product.stock < request.quantity) {
    saleState.rejectedOrders++;

    return {
      orderId: request.id,
      productId: product.id,
      success: false,
      reason: "Insufficient stock",
    };
  }

  // No await between stock check and decrement
  product.stock -= request.quantity;

  saleState.ordersProcessed++;
  saleState.revenue +=
    product.salePrice * request.quantity;

  return {
    orderId: request.id,
    productId: product.id,
    success: true,
    reason: "Order successful",
  };
}

const orderQueue = new OrderQueue(processOrder);

// 9. SINGLE CUSTOMER PURCHASE

productSection.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button =
    target.closest<HTMLButtonElement>(".buy-button");

  if (!button || button.disabled) return;

  const productId = Number(button.dataset.buyId);

  if (!Number.isInteger(productId)) return;

  const request: OrderRequest = {
    id: nextOrderId++,
    productId,
    quantity: 1,
  };

  button.disabled = true;

  orderMessageElement.textContent =
    "Processing your order...";

  void orderQueue
    .enqueue(request)
    .then((result) => {
      orderMessageElement.textContent =
        result.success
          ? "Order successful! Inventory updated."
          : `Order rejected: ${result.reason}`;

      updateInventoryUI();
    })
    .catch((error: unknown) => {
      console.error("Order processing failed:", error);

      orderMessageElement.textContent =
        "An unexpected order error occurred.";
    })
    .finally(() => {
      updateInventoryUI();
    });
});

// 10. CONCURRENT ORDER SIMULATION

simulateButton.addEventListener("click", async () => {
  if (saleState.isSimulating || saleState.isExpired) {
    return;
  }

  saleState.isSimulating = true;
  simulateButton.disabled = true;

  simulationStatus.textContent = "Processing";

  simulationMessage.textContent =
    "Submitting 10 concurrent order requests...";

  simTotal.textContent = "10";
  simSuccess.textContent = "0";
  simRejected.textContent = "0";

  try {
    const requests: OrderRequest[] = Array.from(
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

    const successful = results.filter(
      (result) => result.success
    ).length;

    const rejected = results.length - successful;

    simSuccess.textContent = String(successful);
    simRejected.textContent = String(rejected);

    simulationStatus.textContent = "Completed";

    simulationMessage.textContent =
      `${successful} successful, ${rejected} rejected. ` +
      "No negative stock allowed.";

    updateInventoryUI();
    console.table(results);
  } catch (error) {
    simulationStatus.textContent = "Error";

    simulationMessage.textContent =
      "Simulation failed. Check Console.";

    console.error("Simulation error:", error);
  } finally {
    saleState.isSimulating = false;
    simulateButton.disabled = saleState.isExpired;
  }
});

// 11. ZERO-DRIFT COUNTDOWN TIMER

updateInventoryUI();

// Both the countdown and order validation share
// the same absolute sale deadline.
const remainingDurationMs = getRemainingMs();

const stopTimer = createAntiDriftTimer(
  remainingDurationMs,
  (remainingMs: number) => {
    if (remainingMs <= 0) {
      endSale();
      return;
    }

    countdownElement.textContent =
      formatTime(remainingMs);
  }
);

// 12. RACE CONDITION TEST - TASK 3.5

mountRaceConditionTest();

// 13. CLEANUP

window.addEventListener("pagehide", () => {
  stopTimer();
});
