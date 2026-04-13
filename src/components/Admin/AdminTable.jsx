import React from "react";

function AdminTable({ columns = [], rows = [], getRowKey, emptyMessage = "No records found." }) {
  if (!rows.length) {
    return <p className="mt-2 text-sm text-dark/70 dark:text-light/80">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-beige dark:border-light/20">
      <table className="min-w-full text-sm">
        <thead className="bg-background dark:bg-background text-dark/80 dark:text-light/80">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const key = getRowKey ? getRowKey(row, rowIndex) : rowIndex;
            return (
              <tr key={key} className="border-t border-beige dark:border-light/20">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={
                      column.cellClassName ||
                      "px-4 py-3 text-dark/80 dark:text-light/80"
                    }
                  >
                    {typeof column.render === "function"
                      ? column.render(row, rowIndex)
                      : row?.[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(AdminTable);
