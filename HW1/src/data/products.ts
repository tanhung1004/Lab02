
import type {
  Product,
  ColumnDef,
} from "../types/data-grid-contract";

// Sample furniture products
export const products: Product[] = [
  {
    id: "P001",
    name: "Modern Fabric Sofa",
    category: "Sofas",
    price: 699,
    stock: 24,
    status: "In Stock",
  },
  {
    id: "P002",
    name: "Oak Dining Table",
    category: "Tables",
    price: 450,
    stock: 12,
    status: "In Stock",
  },
  {
    id: "P003",
    name: "Wooden Bed Frame",
    category: "Beds",
    price: 850,
    stock: 5,
    status: "Low Stock",
  },
  {
    id: "P004",
    name: "Ergonomic Office Chair",
    category: "Chairs",
    price: 180,
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "P005",
    name: "Storage Cabinet",
    category: "Cabinets",
    price: 320,
    stock: 18,
    status: "In Stock",
  },
  {
    id: "P006",
    name: "Coffee Table",
    category: "Tables",
    price: 210,
    stock: 16,
    status: "In Stock",
  },
  {
    id: "P007",
    name: "Leather Lounge Chair",
    category: "Chairs",
    price: 540,
    stock: 3,
    status: "Low Stock",
  },
  {
    id: "P008",
    name: "Minimalist Bookshelf",
    category: "Cabinets",
    price: 275,
    stock: 9,
    status: "In Stock",
  },
  {
    id: "P009",
    name: "Queen Size Bed",
    category: "Beds",
    price: 980,
    stock: 7,
    status: "In Stock",
  },
  {
    id: "P010",
    name: "Corner Sofa",
    category: "Sofas",
    price: 1150,
    stock: 2,
    status: "Low Stock",
  },
];

// DataGrid column configuration
export const productColumns: ColumnDef<Product>[] = [
  { header: "ID", accessorKey: "id", sortable: true },
  { header: "Product", accessorKey: "name", sortable: true },
  { header: "Category", accessorKey: "category", sortable: true },
  { header: "Price", accessorKey: "price", sortable: true },
  { header: "Stock", accessorKey: "stock", sortable: true },
  { header: "Status", accessorKey: "status" },
];
