"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ExpiryRecord } from "../types"
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem, 
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command"
import { 
  Calendar, 
  Layers, 
  Activity, 
  Bell, 
  FileText, 
  LogOut, 
  Moon, 
  Plus, 
  Search,
  LayoutDashboard,
  TrendingUp,
  History
} from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: ExpiryRecord[]
  onQuickAdd: () => void
  onToggleTheme: () => void
  onLogout: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  records,
  onQuickAdd,
  onToggleTheme,
  onLogout
}: CommandPaletteProps) {
  const router = useRouter()
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  // Load recent searches
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("expiry_iq_cmd_recent")
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch {
          // Fallback
        }
      }
    }
  }, [open])

  const handleSelectRecord = (id: string, title: string) => {
    // Save to recent searches
    const updated = [title, ...recentSearches.filter(t => t !== title)].slice(0, 3)
    setRecentSearches(updated)
    localStorage.setItem("expiry_iq_cmd_recent", JSON.stringify(updated))

    onOpenChange(false)
    router.push(`/dashboard/records/${id}`)
  }

  const handleSelectPage = (path: string, label: string) => {
    onOpenChange(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search contracts..." />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>
        
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((term, idx) => (
              <CommandItem 
                key={idx} 
                onSelect={() => {
                  const matched = records.find(r => r.title === term)
                  if (matched && matched.id) {
                    handleSelectRecord(matched.id, term)
                  }
                }}
                className="text-xs cursor-pointer font-semibold flex items-center gap-2"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{term}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search Records Matches */}
        {records.length > 0 && (
          <CommandGroup heading="Contracts / Expiries">
            {records.slice(0, 5).map((rec) => (
              <CommandItem
                key={rec.id}
                onSelect={() => rec.id && handleSelectRecord(rec.id, rec.title)}
                className="text-xs cursor-pointer font-bold flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{rec.title}</span>
                  <span className="text-[9px] font-extrabold uppercase bg-muted px-1.5 py-0.2 rounded text-muted-foreground/80">
                    {rec.category}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground shrink-0">{rec.expiryDate}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation Pages */}
        <CommandGroup heading="Pages Navigation">
          <CommandItem onSelect={() => handleSelectPage("/dashboard", "Dashboard")} className="text-xs cursor-pointer font-bold">
            <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => handleSelectPage("/dashboard/records", "Records Registry")} className="text-xs cursor-pointer font-bold">
            <Layers className="h-3.5 w-3.5 mr-2" />
            <span>Records Registry</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => handleSelectPage("/dashboard/calendar", "Calendar Grid")} className="text-xs cursor-pointer font-bold">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            <span>Calendar View</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => handleSelectPage("/dashboard/activity", "Activity Timeline")} className="text-xs cursor-pointer font-bold">
            <Activity className="h-3.5 w-3.5 mr-2" />
            <span>Activity Logs</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => handleSelectPage("/dashboard/analytics", "Analytics Dashboard")} className="text-xs cursor-pointer font-bold">
            <TrendingUp className="h-3.5 w-3.5 mr-2" />
            <span>Analytics Insights</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Commands / System Controls */}
        <CommandGroup heading="Quick Controls">
          <CommandItem 
            onSelect={() => {
              onOpenChange(false)
              onQuickAdd()
            }} 
            className="text-xs cursor-pointer font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-2 text-emerald-500" />
            <span>Quick Add Record</span>
          </CommandItem>

          <CommandItem 
            onSelect={() => {
              onOpenChange(false)
              onToggleTheme()
            }} 
            className="text-xs cursor-pointer font-bold"
          >
            <Moon className="h-3.5 w-3.5 mr-2 text-amber-500" />
            <span>Toggle Dark/Light Mode</span>
          </CommandItem>

          <CommandItem 
            onSelect={() => {
              onOpenChange(false)
              onLogout()
            }} 
            className="text-xs cursor-pointer font-bold text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            <span>Logout Account</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
