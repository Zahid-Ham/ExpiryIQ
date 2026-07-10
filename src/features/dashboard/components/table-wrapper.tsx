import * as React from "react"
import { cn } from "@/lib/utils"
import { TableColumn } from "../types"

interface TableWrapperProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (item: T) => void
  className?: string
}

export function TableWrapper<T>({
  data,
  columns,
  isLoading,
  emptyState,
  onRowClick,
  className
}: TableWrapperProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full border border-border/80 bg-card/45 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="h-6 w-1/4 bg-muted rounded" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center h-10 border-b border-border/50 last:border-0">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-4 w-1/4 bg-muted rounded" />
              <div className="h-4 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="w-full">{emptyState}</div>
  }

  return (
    <div className={cn("w-full border border-border/80 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col, colIdx) => {
                  const val = item[col.accessorKey as keyof T]
                  return (
                    <td
                      key={colIdx}
                      className={cn(
                        "p-4 text-sm font-semibold text-foreground align-middle",
                        col.className
                      )}
                    >
                      {col.cell ? col.cell(item) : (val as React.ReactNode)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
