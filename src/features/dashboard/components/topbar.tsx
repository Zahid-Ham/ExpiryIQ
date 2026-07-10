"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/use-auth"

import { 
  Menu, 
  Bell, 
  Search, 
  User as UserIcon,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  ChevronDown,
  Plus,
  Briefcase,
  Building,
  LogOut,
  Settings,
  HelpCircle,
  Sparkles,
  Command
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import toast from "react-hot-toast"

interface TopbarProps {
  onOpenMobileSidebar: () => void
  onOpenNotifications: () => void
  onOpenSearch: () => void
  hasUnreadNotifications: boolean
}

export function Topbar({
  onOpenMobileSidebar,
  onOpenNotifications,
  onOpenSearch,
  hasUnreadNotifications
}: TopbarProps) {
  const { user, logOut } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  
  // Workspaces list
  const [activeWorkspace, setActiveWorkspace] = React.useState("Personal Workspace")
  const workspaces = [
    { name: "Personal Workspace", icon: Briefcase },
    { name: "Acme Corporation", icon: Building },
    { name: "Operations Team", icon: Building }
  ]

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  // Parse path to create dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean)
    return parts.map((part, idx) => {
      const href = "/" + parts.slice(0, idx + 1).join("/")
      const label = part.charAt(0).toUpperCase() + part.slice(1)
      return { label, href, isLast: idx === parts.length - 1 }
    })
  }

  const breadcrumbs = getBreadcrumbs()
  const ActiveWorkspaceIcon = workspaces.find(w => w.name === activeWorkspace)?.icon || Briefcase

  return (
    <header className="sticky top-0 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 select-none">
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile Sidebar Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground md:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Workspace Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 border border-border/80 bg-background/50 hover:bg-muted/50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground cursor-pointer transition-colors max-w-[160px] sm:max-w-none truncate outline-none focus-visible:ring-1 focus-visible:ring-primary">
              <ActiveWorkspaceIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate hidden sm:inline">{activeWorkspace}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 border border-border bg-card/95 backdrop-blur-md shadow-md">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Switch Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            {workspaces.map((ws) => {
              const Icon = ws.icon
              const isSelected = activeWorkspace === ws.name
              return (
                <DropdownMenuItem
                  key={ws.name}
                  onClick={() => {
                    setActiveWorkspace(ws.name)
                    toast.success(`Switched to ${ws.name}`)
                  }}
                  className={`text-xs font-bold transition-colors cursor-pointer px-2 py-2 ${
                    isSelected ? "text-primary bg-primary/5" : "text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Vertical divider */}
        <div className="h-4 w-[1px] bg-border/80 hidden md:block shrink-0" />

        {/* Dynamic Breadcrumbs */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-muted-foreground min-w-0">
          <Link href="/dashboard" className="hover:text-foreground cursor-pointer transition-colors shrink-0">App</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {breadcrumbs.map((bc) => (
            <React.Fragment key={bc.href}>
              <Link
                href={bc.href}
                className={`hover:text-foreground truncate transition-colors ${bc.isLast ? "text-foreground font-extrabold" : ""}`}
              >
                {bc.label}
              </Link>
              {!bc.isLast && <ChevronRight className="h-3 w-3 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Add Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8.5 rounded-lg text-xs font-bold px-2.5 gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Quick Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border border-border bg-card/95 backdrop-blur-md shadow-md">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              onClick={() => toast.success("Opening Add Record dialog...")}
              className="text-xs font-bold transition-colors cursor-pointer py-2 px-2.5"
            >
              <Plus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>Add Expiry Record</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toast.success("Opening AI assistant query...")}
              className="text-xs font-bold transition-colors cursor-pointer py-2 px-2.5"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
              <span>Ask AI Renewal</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 border border-border/80 bg-background/50 hover:bg-muted/50 rounded-lg px-2.5 py-1.5 w-10 sm:w-48 text-muted-foreground hover:border-border transition-colors text-left cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary h-8.5"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold select-none hidden sm:inline">Search expiries...</span>
          <kbd className="ml-auto text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded border border-border items-center gap-0.5 hidden sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <div className="flex items-center border border-border/80 bg-background/50 rounded-lg p-0.5 h-8.5">
          {[
            { key: "light", icon: Sun },
            { key: "dark", icon: Moon },
            { key: "system", icon: Laptop }
          ].map((opt) => {
            const Icon = opt.icon
            const isSelected = theme === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={`Switch to ${opt.key} theme`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
              </button>
            )
          })}
        </div>

        {/* Notification Bell */}
        <button 
          type="button"
          onClick={onOpenNotifications}
          className="p-2 rounded-lg border border-border/80 bg-background/50 text-muted-foreground hover:text-foreground relative transition-colors cursor-pointer h-8.5 w-8.5 flex items-center justify-center"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4 shrink-0" />
          {hasUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8.5 w-8.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary overflow-hidden">
              {user?.photoURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.photoURL} alt="Avatar" className="h-full w-full rounded-full" />
              ) : (
                <UserIcon className="h-4 w-4 text-primary" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border border-border bg-card/95 backdrop-blur-md shadow-md">
            <div className="flex flex-col px-3 py-2 text-left">
              <span className="text-xs font-bold text-foreground truncate">{user?.displayName || "User Session"}</span>
              <span className="text-[10px] font-semibold text-muted-foreground truncate">{user?.email || "email@domain.com"}</span>
            </div>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              onClick={() => toast.success("Navigating to Profile Settings...")}
              className="text-xs font-bold transition-colors cursor-pointer px-3 py-2"
            >
              <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toast.success("Navigating to Support Center...")}
              className="text-xs font-bold transition-colors cursor-pointer px-3 py-2"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>Help & Feedback</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-xs font-bold transition-colors text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 cursor-pointer px-3 py-2"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
