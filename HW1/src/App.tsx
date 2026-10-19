
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



          {/* Furniture Hero Image */}
          <div className="hero-image">
  <img
    src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0"
    alt="Modern living room interior"
  />
</div>
        </section>

        {/* Furniture Products Section */}
        <section
          className="products-section"
          id="products"
          aria-labelledby="products-heading"
        >

          {/* Section Header */}
          <div className="section-heading">
            <div>
              <h2 id="products-heading">
                Furniture Products
              </h2>

              <p>
                Manage and browse furniture inventory.
              </p>
            </div>

            <span className="total-count">
              {products.length} Products
            </span>
          </div>

          {/* Task 1.6 - Reusable DataGrid
              Includes:
              - Search
              - Category Filtering
              - Column Sorting
              - Pagination
              - Rows per page
          */}
          <DataGrid<Product>
            data={products}
            columns={productColumns}
            ariaLabel="Furniture products data grid"
          />

        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        FurniPro · Enterprise Data-Grid Homework
      </footer>

    </div>
  );
}
