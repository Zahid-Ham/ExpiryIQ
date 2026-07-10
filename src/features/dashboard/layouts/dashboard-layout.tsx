"use client"

import * as React from "react"
import { Sidebar } from "../components/sidebar"
import { Topbar } from "../components/topbar"
import { 
  X, 
  Bell, 
  Search, 
  Calendar, 
  Building, 
  ArrowUpRight, 
  Check, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Sparkles, 
  Inbox
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { RecordsService } from "../services/records-service"
import { 
  NotificationsService, 
  NotificationItem 
} from "../services/notifications-service"
import { ExpiryRecord } from "../types"
import { useRouter } from "next/navigation"
import { format, addDays, parseISO } from "date-fns"
import { CommandPalette } from "../components/command-palette"
import { RecordFormDialog } from "../components/record-form-dialog"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logOut } = useAuth()
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  
  // Sidebar Width & Collapsed States
  const [sidebarWidth, setSidebarWidth] = React.useState(256)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  
  // Overlay/Drawer/Search Modal States
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  
  // Search palette states
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  // Live Firestore notifications states
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [notificationFilter, setNotificationFilter] = React.useState<"all" | "unread">("all")

  const sidebarRef = React.useRef<HTMLDivElement>(null)

  // Load search history
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("expiry_iq_recent_searches")
      if (stored) {
        const timer = setTimeout(() => {
          setRecentSearches(JSON.parse(stored))
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Subscribe to live notifications stream
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = NotificationsService.subscribeUserNotifications(
      user.uid,
      (data) => setNotifications(data),
      (err) => console.error("Firestore user notifications sync error:", err)
    )
    return () => unsubscribe()
  }, [user?.uid])

  // Subscribe to live records stream
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => setRecords(data),
      (err) => console.error("Firestore search layouts records sync error:", err)
    )
    return () => unsubscribe()
  }, [user?.uid])

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setSelectedIndex(0)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter records based on debounce query matching across fields
  const filteredRecords = React.useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    return records.filter((r) => {
      return (
        r.title.toLowerCase().includes(q) ||
        (r.vendor && r.vendor.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        (r.tags && r.tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    })
  }, [debouncedQuery, records])

  const handleSelectRecord = React.useCallback((record: ExpiryRecord) => {
    const queryTerm = searchQuery.trim()
    if (queryTerm) {
      const updated = [queryTerm, ...recentSearches.filter(q => q !== queryTerm)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem("expiry_iq_recent_searches", JSON.stringify(updated))
    }

    setSearchOpen(false)
    setSearchQuery("")
    router.push(`/dashboard/records?id=${record.id}`)
  }, [searchQuery, recentSearches, router])

  // Keyboard shortcut listener (Cmd+K / Ctrl+K) and list navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }

      if (!searchOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < filteredRecords.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const activeItem = filteredRecords[selectedIndex]
        if (activeItem) {
          handleSelectRecord(activeItem)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen, filteredRecords, selectedIndex, handleSelectRecord])

  const handleClearHistory = () => {
    setRecentSearches([])
    localStorage.removeItem("expiry_iq_recent_searches")
    toast.success("Search history cleared")
  }

  // Highlight matches helper
  const highlightMatch = (text: string, queryText: string) => {
    if (!queryText.trim()) return <span>{text}</span>
    const regex = new RegExp(`(${escapeRegExp(queryText)})`, "gi")
    const parts = text.split(regex)
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-foreground font-extrabold rounded px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  const escapeRegExp = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  // Drag handles for sidebar resizing
  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = React.useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return
    let newWidth = e.clientX
    if (newWidth < 200) newWidth = 200
    if (newWidth > 400) newWidth = 400
    setSidebarWidth(newWidth)
  }, [isResizing])

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize)
      window.addEventListener("mouseup", stopResizing)
    }
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  // Notifications Handlers
  const handleMarkRead = async (id: string) => {
    try {
      await NotificationsService.markAsRead(id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await NotificationsService.markAllAsRead(user?.uid || "", unreadIds)
      toast.success("All notifications marked as read")
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await NotificationsService.deleteNotification(id)
      toast.success("Notification deleted")
    } catch (err) {
      console.error(err)
    }
  }

  // Filter notifications list
  const filteredNotifications = React.useMemo(() => {
    if (notificationFilter === "unread") {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, notificationFilter])

  // Group notifications chronologically: Today, Yesterday, Earlier
  const groupedNotifications = React.useMemo(() => {
    const todayList: NotificationItem[] = []
    const yesterdayList: NotificationItem[] = []
    const earlierList: NotificationItem[] = []
    
    const now = new Date()
    const todayStr = format(now, "yyyy-MM-dd")
    const yesterdayStr = format(addDays(now, -1), "yyyy-MM-dd")

    filteredNotifications.forEach((item) => {
      try {
        const datePart = item.createdAt.substring(0, 10)
        if (datePart === todayStr) {
          todayList.push(item)
        } else if (datePart === yesterdayStr) {
          yesterdayList.push(item)
        } else {
          earlierList.push(item)
        }
      } catch {
        earlierList.push(item)
      }
    })

    return { 
      today: todayList, 
      yesterday: yesterdayList, 
      earlier: earlierList 
    }
  }, [filteredNotifications])

  const hasUnread = notifications.some((n) => !n.read)

  // Notification Icon color mapper
  const getNotificationStyles = (category: string) => {
    switch (category) {
      case "warning":
        return { bg: "bg-rose-500/10 text-rose-500", icon: AlertTriangle }
      case "success":
        return { bg: "bg-emerald-500/10 text-emerald-500", icon: CheckSquare }
      default:
        return { bg: "bg-primary/10 text-primary", icon: Sparkles }
    }
  }

  const handleToggleTheme = () => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.toggle("dark")
      localStorage.setItem("theme", isDark ? "dark" : "light")
      toast.success(isDark ? "Dark theme enabled" : "Light theme enabled")
    }
  }

  const handleLogout = async () => {
    try {
      await logOut()
      router.push("/login")
      toast.success("Logged out successfully")
    } catch (err) {
      toast.error("Logout failed")
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar wrapper */}
      <aside 
        ref={sidebarRef}
        style={{ width: sidebarCollapsed ? 72 : sidebarWidth }}
        className="hidden md:flex md:flex-col border-r border-border bg-card/45 backdrop-blur-md shrink-0 relative transition-all duration-150 ease-out select-none"
      >
        <Sidebar collapsed={sidebarCollapsed} />

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          onDoubleClick={() => {
            setSidebarCollapsed(!sidebarCollapsed)
          }}
          className={`absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-primary/50 transition-colors z-20 ${
            isResizing ? "bg-primary w-[5px]" : "bg-transparent"
          }`}
        />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform md:hidden transition-transform duration-300 ease-in-out flex flex-col justify-between ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <Sidebar collapsed={false} onCloseMobile={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          hasUnreadNotifications={hasUnread}
        />

        {/* Dashboard Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          {children}
        </main>
      </div>

      {/* Slide-out Notification Drawer on the Right */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            {/* Drawer Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setNotificationsOpen(false)}
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col select-none text-left"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-primary shrink-0" />
                  <h3 className="text-sm font-extrabold text-foreground">Notifications</h3>
                </div>
                <div className="flex items-center gap-1">
                  {hasUnread && (
                    <Button 
                      variant="ghost" 
                      onClick={handleMarkAllRead} 
                      className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      Mark All Read
                    </Button>
                  )}
                  <button 
                    onClick={() => setNotificationsOpen(false)} 
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="px-4 py-2 border-b border-border/50 bg-muted/10 flex gap-2">
                <button
                  onClick={() => setNotificationFilter("all")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    notificationFilter === "all" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setNotificationFilter("unread")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    notificationFilter === "unread" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unread
                </button>
              </div>

              {/* Scrollable List feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredNotifications.length > 0 ? (
                  <>
                    {/* Today Group */}
                    {groupedNotifications.today.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest px-0.5">Today</p>
                        <div className="space-y-2">
                          {groupedNotifications.today.map((notif) => {
                            const styles = getNotificationStyles(notif.category)
                            const Icon = styles.icon
                            return (
                              <div 
                                key={notif.id} 
                                className={`group p-3 rounded-xl border transition-all flex gap-3 text-left relative ${
                                  !notif.read ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 h-fit mt-0.5 ${styles.bg}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5 flex-1 pr-6">
                                  <h4 className="text-xs font-bold text-foreground leading-snug">{notif.title}</h4>
                                  <p className="text-[11px] font-semibold text-muted-foreground/90 leading-normal">{notif.description}</p>
                                  <span className="text-[9px] font-bold text-muted-foreground/80 block">
                                    {format(parseISO(notif.createdAt), "h:mm a")}
                                  </span>
                                </div>
                                
                                {/* Hover buttons */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.read && (
                                    <button
                                      onClick={() => handleMarkRead(notif.id)}
                                      className="p-1 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                      title="Mark read"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 rounded bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Yesterday Group */}
                    {groupedNotifications.yesterday.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest px-0.5">Yesterday</p>
                        <div className="space-y-2">
                          {groupedNotifications.yesterday.map((notif) => {
                            const styles = getNotificationStyles(notif.category)
                            const Icon = styles.icon
                            return (
                              <div 
                                key={notif.id} 
                                className={`group p-3 rounded-xl border transition-all flex gap-3 text-left relative ${
                                  !notif.read ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 h-fit mt-0.5 ${styles.bg}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5 flex-1 pr-6">
                                  <h4 className="text-xs font-bold text-foreground leading-snug">{notif.title}</h4>
                                  <p className="text-[11px] font-semibold text-muted-foreground/90 leading-normal">{notif.description}</p>
                                  <span className="text-[9px] font-bold text-muted-foreground/80 block">
                                    {format(parseISO(notif.createdAt), "h:mm a")}
                                  </span>
                                </div>
                                
                                {/* Hover buttons */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.read && (
                                    <button
                                      onClick={() => handleMarkRead(notif.id)}
                                      className="p-1 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                      title="Mark read"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 rounded bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Earlier Group */}
                    {groupedNotifications.earlier.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest px-0.5">Earlier</p>
                        <div className="space-y-2">
                          {groupedNotifications.earlier.map((notif) => {
                            const styles = getNotificationStyles(notif.category)
                            const Icon = styles.icon
                            return (
                              <div 
                                key={notif.id} 
                                className={`group p-3 rounded-xl border transition-all flex gap-3 text-left relative ${
                                  !notif.read ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                                }`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 h-fit mt-0.5 ${styles.bg}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5 flex-1 pr-6">
                                  <h4 className="text-xs font-bold text-foreground leading-snug">{notif.title}</h4>
                                  <p className="text-[11px] font-semibold text-muted-foreground/90 leading-normal">{notif.description}</p>
                                  <span className="text-[9px] font-bold text-muted-foreground/80 block">
                                    {format(parseISO(notif.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                                
                                {/* Hover buttons */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.read && (
                                    <button
                                      onClick={() => handleMarkRead(notif.id)}
                                      className="p-1 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                      title="Mark read"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 rounded bg-muted hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 text-center text-xs text-muted-foreground/80 font-bold select-none flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-7 w-7 text-muted-foreground/50" />
                    <span>No notifications found</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Command Palette Smart Search Modal */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        records={records}
        onQuickAdd={() => setFormOpen(true)}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
      />

      {/* Quick Add Record Form Dialog */}
      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="add"
      />
    </div>
  )
}
