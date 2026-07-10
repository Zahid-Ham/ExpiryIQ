"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Sparkles, 
  Inbox,
  Clock,
  CheckCircle2
} from "lucide-react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { 
  NotificationsService, 
  NotificationItem 
} from "@/features/dashboard/services/notifications-service"
import toast from "react-hot-toast"
import { format, addDays, parseISO } from "date-fns"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [filter, setFilter] = React.useState<"all" | "unread">("all")
  const [isLoading, setIsLoading] = React.useState(true)

  // Subscribe to live notifications from Firestore
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = NotificationsService.subscribeUserNotifications(
      user.uid,
      (data) => {
        setNotifications(data)
        setIsLoading(false)
      },
      (err) => {
        console.error("Firestore page notifications subscription error:", err)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [user?.uid])

  const handleMarkRead = async (id: string) => {
    try {
      await NotificationsService.markAsRead(id)
      toast.success("Marked as read")
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) {
      toast.error("All notifications are already read")
      return
    }
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

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, filter])

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

  const getNotificationStyles = (category: string) => {
    switch (category) {
      case "warning":
        return { bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: AlertTriangle }
      case "success":
        return { bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckSquare }
      default:
        return { bg: "bg-primary/10 text-primary border-primary/20", icon: Sparkles }
    }
  }

  const hasUnread = notifications.some((n) => !n.read)

  return (
    <DashboardLayout>
      <PageHeader
        title="Notification Center"
        description="Review audit logs, automated contract warnings, and system action logs."
        actions={
          hasUnread && (
            <Button 
              onClick={handleMarkAllRead} 
              variant="outline" 
              className="h-10 text-sm font-bold gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark All Read</span>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none text-left">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 space-y-1.5 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-1 pb-1">Filter Notifications</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setFilter("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  filter === "all" ? "bg-primary/10 text-primary font-extrabold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span>All Alerts</span>
                <span className="bg-muted px-1.5 py-0.5 rounded border border-border/80 text-[10px] text-muted-foreground font-extrabold">{notifications.length}</span>
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  filter === "unread" ? "bg-primary/10 text-primary font-extrabold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span>Unread</span>
                <span className="bg-muted px-1.5 py-0.5 rounded border border-border/80 text-[10px] text-muted-foreground font-extrabold">
                  {notifications.filter((n) => !n.read).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm min-h-[350px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-6">
                
                {/* Today */}
                {groupedNotifications.today.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-1">Today</p>
                    <div className="divide-y divide-border/50 border border-border/80 rounded-xl overflow-hidden bg-background/30">
                      {groupedNotifications.today.map((notif, idx) => {
                        const styles = getNotificationStyles(notif.category)
                        const Icon = styles.icon
                        return (
                          <div 
                            key={notif.id || `today_${idx}`}
                            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                              !notif.read ? "bg-primary/5" : "hover:bg-muted/5"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${styles.bg}`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{notif.title}</h4>
                                  {!notif.read && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-normal font-semibold max-w-xl">{notif.description}</p>
                                <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{format(parseISO(notif.createdAt), "h:mm a")}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <Button 
                                  variant="ghost" 
                                  onClick={() => handleMarkRead(notif.id)} 
                                  className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Mark read</span>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                onClick={() => handleDeleteNotification(notif.id)} 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Yesterday */}
                {groupedNotifications.yesterday.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-1">Yesterday</p>
                    <div className="divide-y divide-border/50 border border-border/80 rounded-xl overflow-hidden bg-background/30">
                      {groupedNotifications.yesterday.map((notif, idx) => {
                        const styles = getNotificationStyles(notif.category)
                        const Icon = styles.icon
                        return (
                          <div 
                            key={notif.id || `yesterday_${idx}`}
                            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                              !notif.read ? "bg-primary/5" : "hover:bg-muted/5"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${styles.bg}`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{notif.title}</h4>
                                  {!notif.read && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-normal font-semibold max-w-xl">{notif.description}</p>
                                <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{format(parseISO(notif.createdAt), "h:mm a")}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <Button 
                                  variant="ghost" 
                                  onClick={() => handleMarkRead(notif.id)} 
                                  className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Mark read</span>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                onClick={() => handleDeleteNotification(notif.id)} 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Earlier */}
                {groupedNotifications.earlier.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-1">Earlier</p>
                    <div className="divide-y divide-border/50 border border-border/80 rounded-xl overflow-hidden bg-background/30">
                      {groupedNotifications.earlier.map((notif, idx) => {
                        const styles = getNotificationStyles(notif.category)
                        const Icon = styles.icon
                        return (
                          <div 
                            key={notif.id || `earlier_${idx}`}
                            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                              !notif.read ? "bg-primary/5" : "hover:bg-muted/5"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${styles.bg}`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{notif.title}</h4>
                                  {!notif.read && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-normal font-semibold max-w-xl">{notif.description}</p>
                                <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{format(parseISO(notif.createdAt), "MMM d, yyyy")}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <Button 
                                  variant="ghost" 
                                  onClick={() => handleMarkRead(notif.id)} 
                                  className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Mark read</span>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                onClick={() => handleDeleteNotification(notif.id)} 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3 animate-bounce" />
                <h4 className="text-sm font-bold text-foreground mb-1">Feed Inbox Empty</h4>
                <p className="text-xs text-muted-foreground/80 leading-normal font-semibold">
                  No notifications matching &quot;{filter}&quot; filters were found.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
