import { ExpiryRecord } from "../types"
import { calculateExpiry } from "../utils/expiry-engine"

export interface ExportColumnConfig {
  key: keyof ExpiryRecord | "remainingDays"
  label: string
  enabled: boolean
}

// 1. Export CSV
export function exportToCSV(records: ExpiryRecord[], columns: ExportColumnConfig[]) {
  const activeCols = columns.filter(c => c.enabled)
  const headers = activeCols.map(c => `"${c.label}"`).join(",")
  
  const rows = records.map(r => {
    return activeCols.map(col => {
      let val = ""
      if (col.key === "remainingDays") {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        val = String(remainingDays)
      } else {
        const rawVal = r[col.key as keyof ExpiryRecord]
        val = rawVal !== undefined ? String(rawVal) : ""
      }
      // Escape double quotes
      return `"${val.replace(/"/g, '""')}"`
    }).join(",")
  })

  const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n") // UTF-8 BOM
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `records_export_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 2. Export Excel (HTML spreadsheet wrapper)
export function exportToExcel(records: ExpiryRecord[], columns: ExportColumnConfig[]) {
  const activeCols = columns.filter(c => c.enabled)
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head>
    <body>
    <table border="1">
      <tr style="background-color: #3b82f6; color: #ffffff; font-weight: bold;">
        ${activeCols.map(col => `<th>${col.label}</th>`).join("")}
      </tr>
  `
  
  records.forEach(r => {
    html += "<tr>"
    activeCols.forEach(col => {
      let val = ""
      if (col.key === "remainingDays") {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        val = remainingDays < 0 ? `Expired (${Math.abs(remainingDays)}d ago)` : remainingDays === 0 ? "Expires Today" : `${remainingDays} days`
      } else {
        const rawVal = r[col.key as keyof ExpiryRecord]
        val = rawVal !== undefined ? String(rawVal) : ""
      }
      html += `<td>${val}</td>`
    })
    html += "</tr>"
  })
  
  html += `</table></body></html>`
  const blob = new Blob([html], { type: "application/vnd.ms-excel" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `records_export_${Date.now()}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 3. Export PDF summary using native browser window.print()
export function exportToPDF(records: ExpiryRecord[], columns: ExportColumnConfig[]) {
  const activeCols = columns.filter(c => c.enabled)
  const printWindow = window.open("", "_blank")
  if (!printWindow) return
  
  let html = `
    <html>
    <head>
      <title>ExpiryIQ - Records Summary Report</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 25px; color: #0f172a; background-color: #ffffff; }
        h1 { color: #1e3a8a; margin-bottom: 4px; font-size: 20px; font-weight: 800; }
        .meta { font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 10px; }
        th { background-color: #f1f5f9; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; display: inline-block; text-transform: uppercase; }
        .critical { background-color: #fee2e2; color: #ef4444; }
        .warning { background-color: #fef3c7; color: #d97706; }
        .normal { background-color: #d1fae5; color: #059669; }
      </style>
    </head>
    <body>
      <h1>ExpiryIQ Summary Report</h1>
      <div className="meta">Generated on ${new Date().toLocaleDateString()} • Records Count: ${records.length}</div>
      <table>
        <thead>
          <tr>
            ${activeCols.map(col => `<th>${col.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `
  
  records.forEach(r => {
    html += "<tr>"
    activeCols.forEach(col => {
      let cellHtml = ""
      if (col.key === "remainingDays") {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        const lbl = remainingDays < 0 ? `Expired (${Math.abs(remainingDays)}d)` : remainingDays === 0 ? "Today" : `${remainingDays}d`
        const cls = remainingDays < 0 ? "critical" : remainingDays <= 30 ? "warning" : "normal"
        cellHtml = `<span class="badge ${cls}">${lbl}</span>`
      } else if (col.key === "status") {
        const cls = r.status === "expired" ? "critical" : r.status === "expiring_soon" ? "warning" : "normal"
        cellHtml = `<span class="badge ${cls}">${r.status}</span>`
      } else if (col.key === "priority") {
        const cls = r.priority === "critical" ? "critical" : r.priority === "high" ? "warning" : "normal"
        cellHtml = `<span class="badge ${cls}">${r.priority}</span>`
      } else {
        const rawVal = r[col.key as keyof ExpiryRecord]
        cellHtml = rawVal !== undefined ? String(rawVal) : ""
      }
      html += `<td>${cellHtml}</td>`
    })
    html += "</tr>"
  })
  
  html += `
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
          window.close();
        }
      </script>
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
}
