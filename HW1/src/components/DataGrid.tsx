
import { useMemo, useState } from "react";
import type {
  DataGridProps,
} from "../types/data-grid-contract";

export default function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>) {
  // Store the current sorting configuration
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  // Handle sorting when clicking a column header
  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Create a sorted copy without modifying original data
  const sortedData = useMemo(() => {
    if (sortKey === null) {
      return data;
    }

    return [...data].sort((a, b) => {
      const valueA = a[sortKey];
      const valueB = b[sortKey];

      // Sort numbers numerically
      if (
        typeof valueA === "number" &&
        typeof valueB === "number"
      ) {
        return sortDirection === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      // Sort text alphabetically
      const comparison = String(valueA ?? "").localeCompare(
        String(valueB ?? ""),
        undefined,
        { numeric: true, sensitivity: "base" }
      );

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  // Render formatted cell content
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
    <div className="table-wrapper">
      <table aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sortKey === column.accessorKey;

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
          {sortedData.map((item, rowIndex) => (
            <tr key={rowIndex}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
