
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  DataGridProps,
} from "../types/data-grid-contract";

export default function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
  onRowSelect,
}: DataGridProps<T>) {
  // Sorting
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  // Filtering and pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Keyboard focus and selection
  const [activeCell, setActiveCell] = useState({
    row: 0,
    col: 0,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );

  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(
    new Map()
  );

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        data.map((item) =>
          String(
            (item as Record<string, unknown>).category ?? ""
          )
        )
      )
    )
      .filter(Boolean)
      .sort();
  }, [data]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setActiveCell({ row: 0, col: 0 });
  };

  const processedData = useMemo(() => {
    const filtered = data.filter((item) => {
      const record = item as Record<string, unknown>;
      const query = search.trim().toLowerCase();

      const matchesSearch =
        String(record.name ?? "")
          .toLowerCase()
          .includes(query) ||
        String(record.id ?? "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" ||
        String(record.category ?? "") === category;

      return matchesSearch && matchesCategory;
    });

    if (sortKey === null) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (
        typeof aValue === "number" &&
        typeof bValue === "number"
      ) {
        const result = aValue - bValue;
        return sortDirection === "asc" ? result : -result;
      }

      const result = String(aValue ?? "").localeCompare(
        String(bValue ?? ""),
        undefined,
        { numeric: true, sensitivity: "base" }
      );

      return sortDirection === "asc" ? result : -result;
    });
  }, [data, search, category, sortKey, sortDirection]);

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

  // Stable row identifier
  const getRowId = (item: T, index: number) => {
    const record = item as Record<string, unknown>;
    return String(record.id ?? `row-${index}`);
  };

  // Keep keyboard position inside visible rows
  useEffect(() => {
    setActiveCell((previous) => ({
      row: Math.min(
        previous.row,
        Math.max(0, pageData.length - 1)
      ),
      col: Math.min(
        previous.col,
        Math.max(0, columns.length - 1)
      ),
    }));
  }, [pageData.length, columns.length]);

  const focusCell = (row: number, col: number) => {
    if (pageData.length === 0 || columns.length === 0) {
      return;
    }

    const nextRow = Math.max(
      0,
      Math.min(row, pageData.length - 1)
    );

    const nextCol = Math.max(
      0,
      Math.min(col, columns.length - 1)
    );

    setActiveCell({ row: nextRow, col: nextCol });

    const key = `${nextRow}-${nextCol}`;
    cellRefs.current.get(key)?.focus();
  };

  const toggleRowSelection = (item: T, rowIndex: number) => {
    const id = getRowId(item, rowIndex);

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleCellKeyDown = (
    event: React.KeyboardEvent<HTMLTableCellElement>,
    rowIndex: number,
    colIndex: number,
    item: T
  ) => {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        focusCell(rowIndex - 1, colIndex);
        break;

      case "ArrowDown":
        event.preventDefault();
        focusCell(rowIndex + 1, colIndex);
        break;

      case "ArrowLeft":
        event.preventDefault();
        focusCell(rowIndex, colIndex - 1);
        break;

      case "ArrowRight":
        event.preventDefault();
        focusCell(rowIndex, colIndex + 1);
        break;

      case "Enter":
        event.preventDefault();
        onRowSelect?.(item);
        break;

      case " ":
        event.preventDefault();
        toggleRowSelection(item, rowIndex);
        break;
    }
  };

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
      {/* Search and filtering */}
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
            setActiveCell({ row: 0, col: 0 });
          }}
        />

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
            setActiveCell({ row: 0, col: 0 });
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
            setActiveCell({ row: 0, col: 0 });
          }}
        >
          <option value={5}>5 rows per page</option>
          <option value={10}>10 rows per page</option>
          <option value={20}>20 rows per page</option>
        </select>
      </div>

      <p className="grid-instructions" id="grid-instructions">
        Use arrow keys to navigate cells, Enter to activate
        a row, and Space to toggle row selection.
      </p>

      {/* Accessible Data Grid */}
      <div className="table-wrapper">
        <table
          role="grid"
          aria-label={ariaLabel}
          aria-describedby="grid-instructions"
          aria-multiselectable="true"
        >
          <thead>
            <tr role="row">
              {columns.map((column) => {
                const isSorted =
                  sortKey === column.accessorKey;

                return (
                  <th
                    key={String(column.accessorKey)}
                    scope="col"
                    role="columnheader"
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
              pageData.map((item, rowIndex) => {
                const rowId = getRowId(
                  item,
                  (currentPage - 1) * pageSize + rowIndex
                );

                const isSelected = selectedIds.has(rowId);

                return (
                  <tr
                    key={rowId}
                    role="row"
                    aria-selected={isSelected}
                    className={
                      isSelected ? "selected-row" : ""
                    }
                  >
                    {columns.map((column, colIndex) => {
                      const refKey = `${rowIndex}-${colIndex}`;

                      return (
                        <td
                          key={String(column.accessorKey)}
                          role="gridcell"
                          tabIndex={
                            activeCell.row === rowIndex &&
                            activeCell.col === colIndex
                              ? 0
                              : -1
                          }
                          ref={(element) => {
                            if (element) {
                              cellRefs.current.set(
                                refKey,
                                element
                              );
                            } else {
                              cellRefs.current.delete(refKey);
                            }
                          }}
                          onFocus={() =>
                            setActiveCell({
                              row: rowIndex,
                              col: colIndex,
                            })
                          }
                          onKeyDown={(event) =>
                            handleCellKeyDown(
                              event,
                              rowIndex,
                              colIndex,
                              item
                            )
                          }
                          className={
                            column.accessorKey === "name"
                              ? "product-name"
                              : ""
                          }
                        >
                          {renderCell(item, column.accessorKey)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr role="row">
                <td
                  role="gridcell"
                  colSpan={columns.length}
                >
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
            onClick={() => {
              setPage(currentPage - 1);
              setActiveCell({ row: 0, col: 0 });
            }}
          >
            Previous
          </button>

          <span aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => {
              setPage(currentPage + 1);
              setActiveCell({ row: 0, col: 0 });
            }}
          >
            Next
          </button>
        </nav>
      </div>
    </>
  );
}
