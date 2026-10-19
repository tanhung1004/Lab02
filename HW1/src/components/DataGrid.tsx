
import { useMemo, useState } from "react";
import type {
  DataGridProps,
} from "../types/data-grid-contract";

export default function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>) {
  // Sorting state
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  // Filtering and pagination state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Identify categories from the provided data
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        data.map((item) => {
          const record = item as Record<string, unknown>;
          return String(record.category ?? "");
        })
      )
    ).filter(Boolean).sort();
  }, [data]);

  // Handle sorting
  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Apply filtering, then sorting
  const processedData = useMemo(() => {
    const filtered = data.filter((item) => {
      const record = item as Record<string, unknown>;

      const name = String(record.name ?? "").toLowerCase();
      const id = String(record.id ?? "").toLowerCase();
      const itemCategory = String(record.category ?? "");

      const matchesSearch =
        name.includes(search.trim().toLowerCase()) ||
        id.includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "All" || itemCategory === category;

      return matchesSearch && matchesCategory;
    });

    if (sortKey === null) return filtered;

    return [...filtered].sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];

      if (
        typeof valueA === "number" &&
        typeof valueB === "number"
      ) {
        return sortDirection === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      const result = String(valueA ?? "").localeCompare(
        String(valueB ?? ""),
        undefined,
        { numeric: true, sensitivity: "base" }
      );

      return sortDirection === "asc" ? result : -result;
    });
  }, [data, search, category, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(processedData.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const pageData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const startIndex =
    processedData.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const endIndex = Math.min(
    currentPage * pageSize,
    processedData.length
  );

  // Format cell content
  const renderCell = (item: T, key: keyof T) => {
    const value = item[key];

    if (key === "price" && typeof value === "number") {
      return `$${value.toFixed(2)}`;
    }

    if (key === "status" && typeof value === "string") {
      const statusClass =
        value === "Out of Stock"
          ? "out-of-stock"
          : value === "Low Stock"
          ? "low-stock"
          : "in-stock";

      return (
        <span className={`status ${statusClass}`}>
          {value}
        </span>
      );
    }

    if (key === "category") {
      return (
        <span className="category-badge">
          {String(value ?? "")}
        </span>
      );
    }

    return String(value ?? "");
  };

  return (
    <>
      {/* Search and category filters */}
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5 rows per page</option>
          <option value={10}>10 rows per page</option>
          <option value={20}>20 rows per page</option>
        </select>
      </div>

      {/* Data Grid */}
      <div className="table-wrapper">
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => {
                const isSorted =
                  sortKey === column.accessorKey;

                return (
                  <th
                    key={String(column.accessorKey)}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="sort-button"
                        onClick={() =>
                          handleSort(column.accessorKey)
                        }
                      >
                        {column.header}
                        <span aria-hidden="true">
                          {isSorted
                            ? sortDirection === "asc"
                              ? " ↑"
                              : " ↓"
                            : " ↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pageData.length > 0 ? (
              pageData.map((item, rowIndex) => (
                <tr key={(currentPage - 1) * pageSize + rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={String(column.accessorKey)}
                      className={
                        column.accessorKey === "name"
                          ? "product-name"
                          : ""
                      }
                    >
                      {renderCell(item, column.accessorKey)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  No matching products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <span>
          Showing {startIndex}–{endIndex} of{" "}
          {processedData.length} products
        </span>

        <nav
          className="pagination"
          aria-label="Table pagination"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>

          <span aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    </>
  );
}
