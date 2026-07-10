"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { APP_NAME, ROUTES } from "@/constants"
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Bell, 
  Sparkles, 
  BarChart3, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  User as UserIcon,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarSubItem {
  title: string
  href: string
}

interface SidebarItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SidebarSubItem[]
  badge?: string
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onCloseMobile?: () => void
}

export function Sidebar({ collapsed, onCloseMobile }: SidebarProps) {
  const { user, logOut } = useAuth()
  const pathname = usePathname()
  
  // Track which subItem groups are expanded
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    Settings: pathname.startsWith(ROUTES.SETTINGS)
  })

  const toggleGroup = (title: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  const items: SidebarItem[] = [
    { title: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { title: "Records", href: ROUTES.RECORDS, icon: FileText },
    { title: "Calendar", href: ROUTES.CALENDAR, icon: Calendar },
    { title: "Notifications", href: ROUTES.NOTIFICATIONS, icon: Bell, badge: "3" },
    { title: "Activity Log", href: ROUTES.ACTIVITY, icon: Clock },
    { title: "AI Assistant", href: ROUTES.AI_ASSISTANT, icon: Sparkles },
    { title: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3 },
    { title: "Settings", href: ROUTES.SETTINGS, icon: SettingsIcon },
    { title: "Help & Support", href: ROUTES.HELP, icon: HelpCircle },
  ]

  // Render navigation links
  const renderItem = (item: SidebarItem) => {
    const Icon = item.icon
    const isGroup = !!item.subItems
    const isGroupExpanded = expandedGroups[item.title]
    
    // Check if the item or any of its sub-items are active
    const isDirectActive = item.href ? pathname === item.href : false
    const isSubActive = item.subItems?.some(sub => pathname === sub.href) || false
    const isActive = isDirectActive || isSubActive

    // Keyboard handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        if (isGroup) {
          toggleGroup(item.title)
        } else if (item.href) {
          window.location.href = item.href
        }
      }
    }

    if (isGroup && !collapsed) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            type="button"
            onClick={(e) => toggleGroup(item.title, e)}
            onKeyDown={handleKeyDown}
            aria-expanded={isGroupExpanded}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-primary ${
              isActive 
                ? "bg-primary/5 text-primary" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.title}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-250 shrink-0 ${
              isGroupExpanded ? "rotate-180" : ""
            }`} />
          </button>

          <AnimatePresence initial={false}>
            {isGroupExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden pl-7.5 space-y-1"
              >
                {item.subItems?.map((sub) => {
                  const isSubItemActive = pathname === sub.href
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                        isSubItemActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>•</span>
                      <span>{sub.title}</span>
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href || "#"}
        onClick={onCloseMobile}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? item.title : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </div>
        {!collapsed && item.badge && (
          <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shrink-0">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Branding header */}
        <div className={`h-16 flex items-center border-b border-border gap-2.5 px-6 ${
          collapsed ? "justify-center px-0" : "px-6"
        }`}>
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 animate-pulse" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground truncate">{APP_NAME}</span>
          )}
        </div>

        {/* Navigation list */}
        <nav className="px-3 py-6 space-y-1.5 overflow-y-auto">
          {items.map(renderItem)}
        </nav>
      </div>

      {/* Sidebar Footer User Details */}
      <div className="p-3 border-t border-border flex flex-col gap-3 shrink-0">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            {user?.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.photoURL} alt="Avatar" className="h-full w-full rounded-full" />
            ) : (
              <UserIcon className="h-4.5 w-4.5 text-primary" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-foreground">
                {user?.displayName || "User Session"}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate">
                {user?.email || "email@domain.com"}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start h-9 text-xs font-bold text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-colors gap-2.5 cursor-pointer ${
            collapsed ? "justify-center p-0" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
