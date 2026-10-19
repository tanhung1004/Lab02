
import "./style.css";

// ==========================================
// HW3 - TASK 3.2: FLASH SALE DASHBOARD UI
// ==========================================

// Product data for the UI demonstration
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  salePrice: number;
  stock: number;
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
    icon: "🎧",
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Wearables",
    price: 3200000,
    salePrice: 1990000,
    stock: 8,
    icon: "⌚",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: 1800000,
    salePrice: 990000,
    stock: 15,
    icon: "⌨️",
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    category: "Audio",
    price: 1600000,
    salePrice: 790000,
    stock: 6,
    icon: "🔊",
  },
];

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

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

// ==========================================
// RENDER MAIN INTERFACE
// ==========================================

app.innerHTML = `
  <div class="app-shell">

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

      <section class="sale-banner">
        <div>
          <span class="eyebrow">FLASH SALE EVENT</span>
          <h2>Today's Hot Deals</h2>
          <p>Limited stock available.</p>
        </div>

        <div class="countdown-box">
          <span>Demo countdown</span>
          <strong id="countdown">01:00:00</strong>
        </div>
      </section>

      <section class="products-section" id="products">
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
          ${products
            .map(
              (product) => `
                <article class="product-card">
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
                      <strong>${product.stock} left</strong>
                    </div>

                    <div class="stock-bar">
                      <div
                        class="stock-fill"
                        style="width: ${
                          Math.min(product.stock / 20, 1) * 100
                        }%"
                      ></div>
                    </div>

                    <button
                      type="button"
                      class="buy-button"
                      disabled
                      title="Ordering will be implemented later"
                    >
                      Buy Now
                    </button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="inventory-panel" id="inventory">
        <div class="section-heading">
          <div>
            <span class="eyebrow">INVENTORY OVERVIEW</span>
            <h2>Stock Monitoring</h2>
          </div>

          <span class="status">Demo Data</span>
        </div>

        <div class="inventory-grid">
          <div class="stat-card">
            <span>Total Products</span>
            <strong>${products.length}</strong>
          </div>

          <div class="stat-card">
            <span>Total Stock</span>
            <strong>
              ${products.reduce(
                (total, item) => total + item.stock,
                0
              )}
            </strong>
          </div>

          <div class="stat-card">
            <span>Orders Processed</span>
            <strong>0</strong>
          </div>
        </div>

        <p class="info-note">
          Ordering and inventory synchronization
          will be implemented in later tasks.
        </p>
      </section>
    </main>

    <footer class="footer">
      FlashMart · TypeScript + Vite · HW3
    </footer>
  </div>
`;

// ==========================================
// DEMO COUNTDOWN
// ==========================================

const countdown = document.querySelector<HTMLElement>(
  "#countdown"
);

let remainingSeconds = 60 * 60;

function renderCountdown(): void {
  if (!countdown) return;

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor(
    (remainingSeconds % 3600) / 60
  );
  const seconds = remainingSeconds % 60;

  countdown.textContent = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

renderCountdown();

const countdownInterval = window.setInterval(() => {
  if (remainingSeconds <= 0) {
    window.clearInterval(countdownInterval);
    return;
  }

  remainingSeconds -= 1;
  renderCountdown();
}, 1000);

window.addEventListener(
  "pagehide",
  () => window.clearInterval(countdownInterval),
  { once: true }
);
