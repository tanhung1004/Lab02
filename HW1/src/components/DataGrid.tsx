
import type { DataGridProps } from "../types/data-grid-contract";

export default function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>) {

  // Display each cell based on its column
  const renderCell = (item: T, key: keyof T) => {
    const value = item[key];

    // Format price
    if (key === "price" && typeof value === "number") {
      return `$${value.toFixed(2)}`;
    }

    // Format status
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

    // Format category
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
            {columns.map((column) => (
              <th
                key={String(column.accessorKey)}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, rowIndex) => (
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
