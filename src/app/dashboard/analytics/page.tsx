"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"
import { ExpiryRecord } from "@/features/dashboard/schemas"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from "recharts"
import { 
  Download, 
  TrendingUp, 
  Layers, 
  Building2, 
  Activity,
  CheckCircle2,
  DollarSign,
  AlertTriangle
} from "lucide-react"
import toast from "react-hot-toast"
import { format, parseISO, addMonths } from "date-fns"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Sync with Firestore user records
  React.useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => {
        setRecords(data)
        setIsLoading(false)
      },
      (err) => {
        console.error("Error loading analytics records:", err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  // Pure JS SVG to PNG Export Helper
  const exportChartAsPng = (containerId: string, filename: string) => {
    const container = document.getElementById(containerId)
    if (!container) {
      toast.error("Chart container not found")
      return
    }
    const svg = container.querySelector("svg")
    if (!svg) {
      toast.error("SVG chart data not resolved")
      return
    }
    
    try {
      const svgString = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = (svg.clientWidth || 500) * 2 // Double scale for higher resolution
        canvas.height = (svg.clientHeight || 300) * 2
        const context = canvas.getContext("2d")
        if (context) {
          context.scale(2, 2)
          context.fillStyle = "#1e293b" // Sleek dark corporate background
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0)
          
          const png = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          downloadLink.href = png
          downloadLink.download = `${filename}.png`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          toast.success(`Chart exported as ${filename}.png`)
        }
        URL.revokeObjectURL(blobURL)
      }
      image.src = blobURL
    } catch (err) {
      console.error("Export error:", err)
      toast.error("Failed to export chart.")
    }
  }

  // 1. Monthly Renewals Volume Projection (Next 12 Months)
  const monthlyRenewalsData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return Array.from({ length: 12 }).map((_, idx) => {
      const targetDate = addMonths(new Date(), idx)
      const label = `${months[targetDate.getMonth()]} ${format(targetDate, "yy")}`
      const yearMonth = format(targetDate, "yyyy-MM")
      
      const matched = records.filter(r => r.expiryDate.startsWith(yearMonth))
      const cost = matched.reduce((acc, curr) => acc + (curr.cost || 0), 0)
      return {
        month: label,
        volume: matched.length,
        cost: cost
      }
    })
  }, [records])

  // 2. Category Distribution Data
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [records])

  // 3. Department Distribution Data
  const departmentData = React.useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach(r => {
      if (r.department) {
        counts[r.department] = (counts[r.department] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [records])

  // 4. Expiry Trend Over Time (Active vs Warning vs Expired)
  const expiryTrendData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return Array.from({ length: 6 }).map((_, idx) => {
      const targetDate = addMonths(new Date(), idx)
      const label = months[targetDate.getMonth()]
      const yearMonth = format(targetDate, "yyyy-MM")
      
      const matched = records.filter(r => r.expiryDate.startsWith(yearMonth))
      const critical = matched.filter(r => r.status === "expired" || r.status === "expiring_soon").length
      const active = matched.filter(r => r.status === "active" || r.status === "renewed").length
      return {
        month: label,
        active,
        critical
      }
    })
  }, [records])

  // 5. Renewal Success Rate Data (Active/Renewed vs Expired)
  const successRateData = React.useMemo(() => {
    const renewed = records.filter(r => r.status === "renewed" || r.status === "active").length
    const expired = records.filter(r => r.status === "expired").length
    const total = renewed + expired
    const rate = total > 0 ? Math.round((renewed / total) * 100) : 100
    
    return [
      { name: "Renewal Success", value: rate, fill: "#10b981" },
      { name: "Overdue Expiry", value: 100 - rate, fill: "#ef4444" }
    ]
  }, [records])

  // 6. Average Remaining Days per Category
  const averageDaysData = React.useMemo(() => {
    const sums: Record<string, { totalDays: number; count: number }> = {}
    records.forEach(r => {
      const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
      if (remainingDays > 0) {
        if (!sums[r.category]) {
          sums[r.category] = { totalDays: 0, count: 0 }
        }
        sums[r.category].totalDays += remainingDays
        sums[r.category].count += 1
      }
    })
    return Object.entries(sums).map(([name, val]) => ({
      name,
      avgDays: Math.round(val.totalDays / val.count)
    }))
  }, [records])

  // 7. Top Vendors by Cycle budget Cost Spend
  const topVendorsData = React.useMemo(() => {
    const spends: Record<string, number> = {}
    records.forEach(r => {
      if (r.vendor) {
        spends[r.vendor] = (spends[r.vendor] || 0) + (r.cost || 0)
      }
    })
    return Object.entries(spends)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)
  }, [records])

  // 8. Highest Risk Departments (Ratio of Warning/Expired items)
  const highestRiskDepts = React.useMemo(() => {
    const depts: Record<string, { total: number; warning: number }> = {}
    records.forEach(r => {
      if (r.department) {
        if (!depts[r.department]) {
          depts[r.department] = { total: 0, warning: 0 }
        }
        depts[r.department].total += 1
        if (r.status === "expired" || r.status === "expiring_soon") {
          depts[r.department].warning += 1
        }
      }
    })
    return Object.entries(depts)
      .map(([name, val]) => ({
        name,
        riskScore: val.total > 0 ? Math.round((val.warning / val.total) * 100) : 0,
        total: val.total,
        warning: val.warning
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
  }, [records])

  // Overview Stats metrics
  const totalSpend = records.reduce((acc, curr) => acc + (curr.cost || 0), 0)
  const activeCount = records.filter(r => r.status === "active" || r.status === "renewed").length
  const successRate = successRateData[0].value

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <span className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics & Insights"
        description="Comprehensive audit visualizers tracking category spreads, renewal trends, and risk segmentations."
      />

      {/* Top statistics summary panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Consolidated Budget Spend"
          value={`$${totalSpend.toLocaleString()}`}
          change="Lifetime tracked cycles"
          changeType="increase"
          icon={DollarSign}
        />
        <StatCard
          title="Active Contracts"
          value={String(activeCount)}
          change="Healthy / Renewed statuses"
          changeType="increase"
          icon={CheckCircle2}
        />
        <StatCard
          title="Renewal Success"
          value={`${successRate}%`}
          change="Non-expired ratio"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Audits Logged"
          value={String(records.length)}
          change="Registry assets"
          changeType="increase"
          icon={Layers}
        />
      </div>

      {/* Charts Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        
        {/* Chart 1: Monthly Renewals Volume Projection */}
        <div id="chart-monthly-renewals" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Monthly Renewals</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Projected volume and cost over the next 12 months</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-monthly-renewals", "monthly_renewals_volume")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRenewalsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="month" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                <YAxis tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                <Bar dataKey="volume" name="Volume Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Est. Budget Spend ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expiry Trend Over Time */}
        <div id="chart-expiry-trends" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Expiry Volume Trend</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">6-month projections mapping active vs critical warnings</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-expiry-trends", "expiry_volume_trend")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expiryTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="month" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                <YAxis tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                <Line type="monotone" dataKey="active" name="Active Expiries" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="critical" name="Critical Warnings" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Distribution Pie */}
        <div id="chart-category-pie" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Category Distribution</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Contracts segments mapped across business categories</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-category-pie", "category_distribution")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "9px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground/80 font-bold">No records categorized yet.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Department Distribution Horizontal Bar */}
        <div id="chart-department-bar" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Department Distribution</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Volume of expiries owned across corporate departments</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-department-bar", "department_distribution")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis type="number" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                  />
                  <Bar dataKey="value" name="Records Count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground/80 font-bold">No department data.</div>
            )}
          </div>
        </div>

        {/* Chart 5: Renewal Success Rate Radial */}
        <div id="chart-success-radial" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Renewal Success Rate</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Ratio of successfully renewed/active items vs expired</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-success-radial", "success_rate_radial")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="40%" 
                outerRadius="90%" 
                barSize={15} 
                data={successRateData}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: '9px', fontWeight: 'bold' }}
                  background
                  dataKey="value"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Average Remaining Days per Category */}
        <div id="chart-avg-days" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Average Remaining Days</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Average lifespan duration until expiration per category</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-avg-days", "average_remaining_days")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            {averageDaysData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={averageDaysData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="name" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <YAxis tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                  />
                  <Bar dataKey="avgDays" name="Avg Remaining Days" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground/80 font-bold">No expiration lifespans logged.</div>
            )}
          </div>
        </div>

        {/* Chart 7: Top Vendors by Spend */}
        <div id="chart-top-vendors" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Top Vendors by Spend</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Consolidated budget cycle costs spent across primary vendors</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-top-vendors", "top_vendors_spend")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            {topVendorsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendorsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="name" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <YAxis tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                  />
                  <Bar dataKey="spend" name="Spend Budget ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground/80 font-bold">No vendor budget spend logged.</div>
            )}
          </div>
        </div>

        {/* Chart 8: Highest Risk Departments */}
        <div id="chart-risk-departments" className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Highest Risk Departments</h3>
              <p className="text-[10px] font-semibold text-muted-foreground/80">Percentage of warning/expired profiles mapped by department</p>
            </div>
            <Button
              onClick={() => exportChartAsPng("chart-risk-departments", "highest_risk_departments")}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-bold gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span>PNG</span>
            </Button>
          </div>
          <div className="h-64 w-full pt-2">
            {highestRiskDepts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={highestRiskDepts} layout="vertical" margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis type="number" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" tickLine={false} className="text-[9px] font-bold fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }} 
                  />
                  <Bar dataKey="riskScore" name="Risk Percentage (%)" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground/80 font-bold">No departmental warning metrics.</div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
