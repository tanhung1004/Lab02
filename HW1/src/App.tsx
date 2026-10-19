
import { products, productColumns } from "./data/products";
import type { Product } from "./types/data-grid-contract";
import DataGrid from "./components/DataGrid";

export default function App() {
  return (
    <div className="site-container">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">
          🛋 FurniPro
        </a>

        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#products">Products</a>
        </nav>
      </header>

      <main id="home">
        {/* Hero Banner */}
        <section className="hero">
          <div className="hero-content">
            <span className="tag">
              FRONT-END HOMEWORK
            </span>

            <h1>
              HW1: Production Enterprise Data-Grid
            </h1>

            <p>
              A modern furniture management dashboard
              with sorting, filtering, pagination,
              and accessible design.
            </p>

            <div className="hero-features">
              <span>✓ Sort & Filter</span>
              <span>✓ Pagination</span>
              <span>✓ Accessible UI</span>
            </div>
          </div>

          <div
            className="hero-image"
            role="img"
            aria-label="Modern furniture showroom"
          />
        </section>

        {/* Furniture Products Section */}
        <section
          className="products-section"
          id="products"
        >
          <div className="section-heading">
            <div>
              <h2>Furniture Products</h2>
              <p>
                Manage and browse furniture inventory.
              </p>
            </div>

            <span className="total-count">
              {products.length} Products
            </span>
          </div>

          {/* Search & Filter: Task 1.6 */}
          <div className="toolbar">
            <input
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              disabled
            />

            <select
              aria-label="Filter by category"
              disabled
            >
              <option>All Categories</option>
            </select>

            <select
              aria-label="Sort products"
              disabled
            >
              <option>Sort by name</option>
            </select>
          </div>

          {/* Data Table */}
          
{/* Reusable Data-Grid Component */}
<DataGrid<Product>
  data={products}
  columns={productColumns}
  ariaLabel="Furniture products data grid"
/>

          {/* Pagination: Task 1.6 */}
          <div className="table-footer">
            <span>
              Showing {products.length} products
            </span>
            <span>
              Pagination coming in Task 1.6
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        FurniPro · Enterprise Data-Grid Homework
      </footer>
    </div>
  );
}
