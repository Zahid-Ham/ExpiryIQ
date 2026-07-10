"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExpiryRecord } from "../types"
import { exportToCSV, exportToExcel, exportToPDF, ExportColumnConfig } from "../services/export-service"
import { Download, FileSpreadsheet, FileText, Settings, Database, Filter } from "lucide-react"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allRecords: ExpiryRecord[]
  filteredRecords: ExpiryRecord[]
}

const INITIAL_COLUMNS: ExportColumnConfig[] = [
  { key: "title", label: "Title / Contract", enabled: true },
  { key: "category", label: "Category", enabled: true },
  { key: "status", label: "Status", enabled: true },
  { key: "expiryDate", label: "Expiry Date", enabled: true },
  { key: "remainingDays", label: "Remaining Days", enabled: true },
  { key: "priority", label: "Priority", enabled: true },
  { key: "department", label: "Department", enabled: true }
]

export function ExportModal({
  open,
  onOpenChange,
  allRecords,
  filteredRecords
}: ExportModalProps) {
  const [format, setFormat] = React.useState<"csv" | "excel" | "pdf">("csv")
  const [source, setSource] = React.useState<"all" | "filtered">("filtered")
  const [columns, setColumns] = React.useState<ExportColumnConfig[]>(INITIAL_COLUMNS)

  // Toggle single column visibility
  const toggleColumn = (key: string) => {
    setColumns(prev => prev.map(col => {
      if (col.key === key) {
        return { ...col, enabled: !col.enabled }
      }
      return col
    }))
  }

  // Execute export trigger
  const handleExport = () => {
    const targetData = source === "all" ? allRecords : filteredRecords
    
    if (targetData.length === 0) {
      alert("No data available to export.")
      return
    }

    if (format === "csv") {
      exportToCSV(targetData, columns)
    } else if (format === "excel") {
      exportToExcel(targetData, columns)
    } else if (format === "pdf") {
      exportToPDF(targetData, columns)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 border border-border bg-card shadow-2xl rounded-xl select-none text-left">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-extrabold text-foreground uppercase tracking-tight flex items-center gap-1.5">
            <Download className="h-4.5 w-4.5 text-primary shrink-0" />
            <span>Export Datatable</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Format, filter columns, and export contract reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3.5">
          {/* Format Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Export File Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold gap-1 cursor-pointer transition-colors ${
                  format === "csv" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold gap-1 cursor-pointer transition-colors ${
                  format === "excel" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold gap-1 cursor-pointer transition-colors ${
                  format === "pdf" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                <span>PDF Summary</span>
              </button>
            </div>
          </div>

          {/* Data Source Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Select Data Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSource("filtered")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                  source === "filtered" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <Filter className="h-4 w-4 shrink-0" />
                <span>Filtered ({filteredRecords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSource("all")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                  source === "all" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span>All Records ({allRecords.length})</span>
              </button>
            </div>
          </div>

          {/* Columns Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" />
              <span>Select Columns to Export</span>
            </label>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-border/80 bg-muted/10 p-3 rounded-lg max-h-40 overflow-y-auto">
              {columns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={col.enabled}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-border bg-background h-4 w-4 cursor-pointer text-primary accent-primary"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-5 mt-3.5 border-t border-border/60">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="bg-primary text-white hover:bg-primary/95 text-xs font-extrabold px-5 cursor-pointer shadow-sm rounded-lg"
          >
            Download Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
