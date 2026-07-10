"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp
} from "lucide-react"
import { motion } from "framer-motion"

export function DashboardPreview() {
  return (
    <section className="bg-muted/10 py-24 border-y border-border relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Clear visibility over active expirations
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            A minimalist, professional operations interface designed to speed up audits, eliminate manual spreadsheets, and keep departments aligned.
          </p>
        </div>

        {/* Mockup Frame with Soft Glow shadow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-5xl rounded-xl border border-border bg-background shadow-2xl dark:shadow-[0_0_50px_rgba(99,102,241,0.08)] overflow-hidden text-left"
        >
          {/* OS Window Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground font-semibold">
              <span>app.expiryiq.com</span>
            </div>
            <div className="w-12" />
          </div>

          <div className="flex h-[685px] overflow-hidden">
            {/* Sidebar Mockup */}
            <aside className="w-52 border-r border-border bg-card p-4 hidden md:flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 px-2">
                  <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">ExpiryIQ</span>
                </div>
                <nav className="space-y-1">
                  <span className="flex items-center space-x-2.5 rounded-lg bg-primary/10 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 px-3 py-2 text-xs font-bold text-primary">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Dashboard</span>
                  </span>
                  <span className="flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Records</span>
                  </span>
                  <span className="flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Calendar</span>
                  </span>
                  <span className="flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </span>
                </nav>
              </div>
              <div className="border-t border-border/80 pt-4 flex items-center space-x-2.5 px-2">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold border border-border">
                  OP
                </div>
                <div>
                  <div className="text-[11px] font-bold">Ops Team</div>
                  <div className="text-[9px] text-muted-foreground font-semibold">Premium Plan</div>
                </div>
              </div>
            </aside>

            {/* Main Area Mockup */}
            <main className="flex-1 flex flex-col bg-background/40 overflow-hidden">
              {/* Top Controls */}
              <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/40 shrink-0">
                <div className="relative w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    className="pl-8 h-8 text-xs focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-100"
                    disabled
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Record</span>
                  </Button>
                </div>
              </header>

              {/* Main Content Area */}
              <div className="p-5 space-y-5 flex-1 overflow-hidden">
                {/* Stats Grid */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                  {[
                    { title: "Total Records", val: "142", border: "border-border bg-card/30" },
                    { title: "Active", val: "122", border: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 dark:bg-emerald-950/10" },
                    { title: "Warning", val: "12", border: "border-amber-500/20 bg-amber-500/5 text-amber-500 dark:bg-amber-950/10" },
                    { title: "Critical", val: "5", border: "border-rose-500/20 bg-rose-500/5 text-rose-500 dark:bg-rose-950/10" },
                    { title: "Expired", val: "3", border: "border-zinc-500/20 bg-zinc-500/5 text-zinc-500 dark:bg-zinc-950/10" }
                  ].map((card, idx) => (
                    <Card key={idx} className={`shadow-none border ${card.border}`}>
                      <CardContent className="p-4">
                        <p className="text-[9px] uppercase font-bold tracking-wider opacity-85">{card.title}</p>
                        <p className="text-2xl font-black mt-0.5 tracking-tight">{card.val}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Grid Split */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Left Column: Table & Audit logs */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-none border border-border bg-card/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold">Upcoming Renewals</CardTitle>
                        <CardDescription className="text-xs">Expirations requiring review</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0 border-t border-border bg-card/10">
                        <div className="divide-y divide-border">
                          {[
                            { name: "Acme Web Services", cat: "Subscription", cost: "$1,200/mo", left: "12 Days", status: "warning", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-950/20" },
                            { name: "HQ Facilities Rent", cat: "Lease Contract", cost: "$14,500/yr", left: "94 Days", status: "active", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-950/20" },
                            { name: "Global SSL Authority", cat: "Certificate", cost: "$350/yr", left: "3 Days", status: "critical", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-950/20" },
                            { name: "Dev Database Server", cat: "Software License", cost: "$4,500/yr", left: "Expired", status: "expired", badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-950/20" }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2.5 px-4 text-xs hover:bg-muted/5 transition-colors">
                              <div className="space-y-1">
                                <div className="font-bold text-foreground">{item.name}</div>
                                <div className="text-muted-foreground text-[10px] font-medium">{item.cat} • {item.cost}</div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className={item.badge}>
                                  {item.left}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audit Logs */}
                    <Card className="shadow-none border border-border bg-card/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span>Recent Activity</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-3.5">
                        <div className="flex items-start space-x-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold text-foreground">Ops Admin</span> uploaded verification attachment for <span className="font-semibold text-primary">HQ Facilities Rent</span>
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">2 hours ago</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-foreground">Automated Engine</span> dispatched Warning Alert for <span className="font-semibold text-primary">Acme Web Services</span>
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">1 day ago</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Donut & Calendar */}
                  <div className="space-y-6">
                    {/* SVG Pie Chart */}
                    <Card className="shadow-none border border-border bg-card/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>Category Distribution</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center py-4">
                        <div className="relative h-28 w-28">
                          <svg className="h-full w-full" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="3" />
                            {/* Blue Accent */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="oklch(0.585 0.233 252.89)" strokeWidth="3.5" strokeDasharray="45 100" strokeDashoffset="25" />
                            {/* Emerald */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="30 100" strokeDashoffset="80" />
                            {/* Amber */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="15 100" strokeDashoffset="110" />
                            {/* Rose */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="10 100" strokeDashoffset="125" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-bold text-foreground">Categories</span>
                            <span className="text-[9px] text-muted-foreground">Top 4</span>
                          </div>
                        </div>

                        <div className="w-full mt-6 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                            <span className="text-muted-foreground/80 font-bold">Software (30%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-muted-foreground/80 font-bold">Leases (45%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                            <span className="text-muted-foreground/80 font-bold">Contracts (15%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                            <span className="text-muted-foreground/80 font-bold">Certificates (10%)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mini Calendar Widget */}
                    <Card className="shadow-none border border-border bg-card/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold">Renewal Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="text-[10px] p-4 pt-0">
                        <div className="flex justify-between font-bold mb-2">
                          <span>July 2026</span>
                          <span className="text-muted-foreground">Next Month</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-muted-foreground font-semibold mb-1">
                          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center font-bold">
                          <span className="text-muted-foreground/20">28</span>
                          <span className="text-muted-foreground/20">29</span>
                          <span className="text-muted-foreground/20">30</span>
                          <span>1</span><span>2</span>
                          <span className="relative flex flex-col items-center">
                            <span>3</span>
                            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500" />
                          </span>
                          <span>4</span>
                          <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                          <span className="relative flex flex-col items-center">
                            <span>12</span>
                            <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-500" />
                          </span>
                          <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
                          <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                          <span>27</span><span>28</span><span>29</span><span>30</span><span>31</span>
                          <span className="text-muted-foreground/20">1</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
