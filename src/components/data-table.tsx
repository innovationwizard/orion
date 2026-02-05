import type { ReactNode } from "react";

type DataTableProps = {
  columns: string[];
  children: ReactNode;
  emptyState?: string;
};

export default function DataTable({ columns, children, emptyState }: DataTableProps) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hasRows ? (
          children
        ) : (
          <tr>
            <td colSpan={columns.length}>
              <div className="empty-state">{emptyState ?? "No hay datos disponibles."}</div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
