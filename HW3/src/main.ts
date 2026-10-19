
import "./style.css";

// ==========================================
// HW3 - TASK 3.3: FLASH SALE LOGIC
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

// 2. FLASH SALE STATE

interface SaleState {
  ordersProcessed: number;
  revenue: number;
  isProcessing: boolean;
  isExpired: boolean;
}

const saleState: SaleState = {
  ordersProcessed: 0,
  revenue: 0,
  isProcessing: false,
  isExpired: false,
};

// Countdown lasts 60 minutes from page load
const SALE_DURATION = 60 * 60 * 1000;
const saleEndTime = Date.now() + SALE_DURATION;

// 3. HELPER FUNCTIONS

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function discountPercent(product: Product): number {
  return Math.round(
    ((product.price - product.salePrice) /
      product.price) *
      100
  );
}

function getTotalStock(): number {
  return products.reduce(
    (total, product) => total + product.stock,
    0
  );
}

function getRemainingSeconds(): number {
  return Math.max(
    0,
    Math.ceil((saleEndTime - Date.now()) / 1000)
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

// 4. APPLICATION ROOT

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root #app not found");
}

// 5. RENDER FLASHMART INTERFACE

app.innerHTML = `
  <div class="app-shell">

    <!-- NAVIGATION -->
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

      <!-- HERO BANNER -->
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

      <!-- FLASH SALE COUNTDOWN -->
      <section class="sale-banner">
        <div>
          <span class="eyebrow">FLASH SALE EVENT</span>
          <h2>Today's Hot Deals</h2>

          <p id="sale-status">
            Limited stock available.
          </p>
        </div>

        <div class="countdown-box">
          <span>Sale ends in</span>
          <strong id="countdown">01:00:00</strong>
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

                  <strong
                    class="stock-value"
                    data-stock-id="${product.id}"
                  >
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

      <!-- INVENTORY MONITORING -->
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
          This is a frontend simulation.
          Real multi-user inventory requires
          server-side transaction control.
        </p>

      </section>

    </main>

    <footer class="footer">
      FlashMart · TypeScript + Vite · HW3
    </footer>

  </div>
`;

// 6. REQUIRED DOM ELEMENTS

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

const orderMessageElement =
  getElement<HTMLElement>("#order-message");

const productSection =
  getElement<HTMLElement>("#products");

// 7. UPDATE PRODUCT CARD

function updateProductUI(product: Product): void {
  const stockElement =
    getElement<HTMLElement>(
      `[data-stock-id="${product.id}"]`
    );

  const stockBar =
    getElement<HTMLElement>(
      `[data-bar-id="${product.id}"]`
    );

  const buyButton =
    getElement<HTMLButtonElement>(
      `[data-buy-id="${product.id}"]`
    );

  stockElement.textContent =
    `${product.stock} left`;

  const percentage =
    (product.stock / product.initialStock) * 100;

  stockBar.style.width = `${percentage}%`;

  if (saleState.isExpired) {
    buyButton.disabled = true;
    buyButton.textContent = "Sale Ended";
  } else if (product.stock <= 0) {
    buyButton.disabled = true;
    buyButton.textContent = "Sold Out";
  } else {
    buyButton.disabled = saleState.isProcessing;
    buyButton.textContent = "Buy Now";
  }
}

// 8. UPDATE INVENTORY DASHBOARD

function updateInventoryUI(): void {
  totalStockElement.textContent =
    String(getTotalStock());

  ordersProcessedElement.textContent =
    String(saleState.ordersProcessed);

  totalRevenueElement.textContent =
    formatPrice(saleState.revenue);

  for (const product of products) {
    updateProductUI(product);
  }
}

// 9. PROCESS A DEMO ORDER

function buyProduct(productId: number): void {
  if (saleState.isProcessing) {
    return;
  }

  saleState.isProcessing = true;

  try {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      orderMessageElement.textContent =
        "Product not found.";
      return;
    }

    // Always check the real deadline
    if (getRemainingSeconds() <= 0) {
      endSale();

      orderMessageElement.textContent =
        "Flash Sale has ended.";
      return;
    }

    // Prevent negative inventory
    if (product.stock <= 0) {
      orderMessageElement.textContent =
        `${product.name} is sold out.`;
      return;
    }

    // Process one successful order
    product.stock -= 1;

    saleState.ordersProcessed += 1;
    saleState.revenue += product.salePrice;

    orderMessageElement.textContent =
      `Order successful! Purchased ${product.name} ` +
      `for ${formatPrice(product.salePrice)}.`;

    console.log("Order processed:", {
      productId: product.id,
      productName: product.name,
      remainingStock: product.stock,
      totalOrders: saleState.ordersProcessed,
    });
  } finally {
    saleState.isProcessing = false;
    updateInventoryUI();
  }
}

// 10. EVENT DELEGATION FOR BUY BUTTONS

productSection.addEventListener("click", (event) => {
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

  const productId = Number(button.dataset.buyId);

  if (!Number.isInteger(productId)) {
    return;
  }

  buyProduct(productId);
});

// 11. END FLASH SALE

function endSale(): void {
  if (saleState.isExpired) {
    return;
  }

  saleState.isExpired = true;

  saleStatusElement.textContent =
    "The Flash Sale has ended.";

  inventoryStatusElement.textContent =
    "Sale Ended";

  countdownElement.textContent =
    "00:00:00";

  updateInventoryUI();
}

// 12. DRIFT-RESISTANT COUNTDOWN

function updateCountdown(): void {
  const remainingSeconds = getRemainingSeconds();

  if (remainingSeconds <= 0) {
    endSale();
    return;
  }

  countdownElement.textContent =
    formatTime(remainingSeconds);
}

updateInventoryUI();
updateCountdown();

const countdownInterval = window.setInterval(() => {
  updateCountdown();

  if (saleState.isExpired) {
    window.clearInterval(countdownInterval);
  }
}, 1000);

// Recalculate countdown when returning to the tab
document.addEventListener(
  "visibilitychange",
  updateCountdown
);

// 13. CLEAN UP

window.addEventListener("pagehide", () => {
  window.clearInterval(countdownInterval);

  document.removeEventListener(
    "visibilitychange",
    updateCountdown
  );
});
