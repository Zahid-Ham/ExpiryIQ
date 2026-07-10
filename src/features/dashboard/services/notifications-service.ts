import { 
  setDocument, 
  updateDocument, 
  deleteDocument, 
  db
} from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  writeBatch
} from "firebase/firestore"

export interface NotificationItem {
  id: string
  userId: string
  title: string
  description: string
  type: "expiring_soon" | "expired" | "renewed" | "new_record" | "reminder_sent"
  category: "warning" | "info" | "success"
  read: boolean
  createdAt: string
}

export const NotificationsService = {
  /**
   * Create a new notification document in Firestore.
   */
  async createNotification(
    userId: string, 
    data: Omit<NotificationItem, "id" | "userId" | "createdAt" | "read">
  ): Promise<string> {
    const id = Math.random().toString(36).substring(2, 15)
    const newNotification: NotificationItem = {
      ...data,
      id,
      userId,
      read: false,
      createdAt: new Date().toISOString()
    }
    await setDocument(FIRESTORE_COLLECTIONS.NOTIFICATIONS, newNotification, id)
    return id
  },

  /**
   * Subscribe to real-time notifications updates for a specific user.
   */
  subscribeUserNotifications(
    userId: string,
    onUpdate: (notifications: NotificationItem[]) => void,
    onError?: (err: unknown) => void
  ) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where("userId", "==", userId)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications: NotificationItem[] = []
        snapshot.forEach((doc) => {
          notifications.push(doc.data() as NotificationItem)
        })
        // Sort in memory by createdAt descending to avoid index constraint requirements
        notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        onUpdate(notifications)
      },
      onError
    )
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    await updateDocument(FIRESTORE_COLLECTIONS.NOTIFICATIONS, {
      read: true
    }, notificationId)
  },

  /**
   * Mark all notifications for a specific user as read in batch.
   */
  async markAllAsRead(userId: string, notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return
    const batch = writeBatch(db)
    
    for (const id of notificationIds) {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, id)
      batch.update(docRef, { read: true })
    }
    
    await batch.commit()
  },

  /**
   * Delete a single notification.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await deleteDocument(FIRESTORE_COLLECTIONS.NOTIFICATIONS, notificationId)
  }
}
