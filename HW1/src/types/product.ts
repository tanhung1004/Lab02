
import type {
  Product,
  ColumnDef,
} from "../types/data-grid-contract";

// Sample furniture product data
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
    price: 499,
    stock: 12,
    status: "In Stock",
  },
  {
    id: "P003",
    name: "Nordic Accent Chair",
    category: "Chairs",
    price: 199,
    stock: 8,
    status: "Low Stock",
  },
  {
    id: "P004",
    name: "Queen Bed Frame",
    category: "Beds",
    price: 599,
    stock: 15,
    status: "In Stock",
  },
  {
    id: "P005",
    name: "Wooden Sideboard",
    category: "Storage",
    price: 299,
    stock: 5,
    status: "Low Stock",
  },
  {
    id: "P006",
    name: "Luxury Office Desk",
    category: "Desks",
    price: 849,
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "P007",
    name: "Minimalist Bookshelf",
    category: "Storage",
    price: 249,
    stock: 18,
    status: "In Stock",
  },
  {
    id: "P008",
    name: "Velvet Lounge Chair",
    category: "Chairs",
    price: 329,
    stock: 0,
    status: "Out of Stock",
  },
];

// Configuration for reusable DataGrid
export const productColumns: ColumnDef<Product>[] = [
  {
    header: "ID",
    accessorKey: "id",
    sortable: true,
  },
  {
    header: "Product",
    accessorKey: "name",
    sortable: true,
  },
  {
    header: "Category",
    accessorKey: "category",
    sortable: true,
  },
  {
    header: "Price",
    accessorKey: "price",
    sortable: true,
  },
  {
    header: "Stock",
    accessorKey: "stock",
    sortable: true,
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: false,
  },
];
