
const products = [
  { id: "P001", name: "Modern Fabric Sofa", category: "Sofas", price: 699, stock: 24 },
  { id: "P002", name: "Oak Dining Table", category: "Tables", price: 499, stock: 12 },
  { id: "P003", name: "Nordic Accent Chair", category: "Chairs", price: 199, stock: 8 },
  { id: "P004", name: "Queen Bed Frame", category: "Beds", price: 599, stock: 15 },
  { id: "P005", name: "Wooden Sideboard", category: "Storage", price: 299, stock: 5 },
];

export default function App() {
  return (
    <div className="site-container">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#home">🛋 FurniPro</a>

        <nav aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#products">Products</a>
        </nav>
      </header>

      <main id="home">
        {/* Hero Banner */}
        <section className="hero">
          <div className="hero-content">
            <span className="tag">FRONT-END HOMEWORK</span>

            <h1>HW1: Production Enterprise Data-Grid</h1>

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

          <div className="hero-image" role="img"
               aria-label="Modern furniture showroom" />
        </section>

        {/* Data-Grid Layout */}
        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <h2>Furniture Products</h2>
              <p>Manage and browse furniture inventory.</p>
            </div>
            <span className="total-count">
              {products.length} Products
            </span>
          </div>

          {/* Controls: functionality added later */}
          <div className="toolbar">
            <input
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              disabled
            />

            <select aria-label="Filter by category" disabled>
              <option>All Categories</option>
            </select>

            <select aria-label="Sort products" disabled>
              <option>Sort by name</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td className="product-name">
                      {product.name}
                    </td>
                    <td>
                      <span className="category-badge">
                        {product.category}
                      </span>
                    </td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={
                        product.stock <= 10
                          ? "status low-stock"
                          : "status in-stock"
                      }>
                        {product.stock <= 10
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {products.length} products</span>
            <span>Pagination coming in Task 1.6</span>
          </div>
        </section>
      </main>

      <footer className="footer">
        FurniPro · Enterprise Data-Grid Homework
      </footer>
    </div>
  );
}
