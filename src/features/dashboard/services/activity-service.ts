import { 
  setDocument, 
  db 
} from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from "firebase/firestore"

export interface ActivityItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string
  action: "create" | "update" | "delete" | "renew" | "reminder_sent" | "status_changed"
  recordId: string
  recordTitle: string
  message: string
  createdAt: string
}

export const ActivityService = {
  /**
   * Log an activity event to Firestore.
   */
  async logActivity(
    userId: string,
    userData: { name: string; email: string; avatarUrl?: string },
    data: Omit<ActivityItem, "id" | "userId" | "userName" | "userEmail" | "userAvatar" | "createdAt">
  ): Promise<string> {
    const id = Math.random().toString(36).substring(2, 15)
    const newActivity: ActivityItem = {
      ...data,
      id,
      userId,
      userName: userData.name || "Anonymous User",
      userEmail: userData.email,
      userAvatar: userData.avatarUrl || "",
      createdAt: new Date().toISOString()
    }
    await setDocument(FIRESTORE_COLLECTIONS.ACTIVITY, newActivity, id)
    return id
  },

  /**
   * Subscribe to real-time activity updates for a specific user.
   */
  subscribeActivity(
    userId: string,
    onUpdate: (activities: ActivityItem[]) => void,
    onError?: (err: unknown) => void
  ) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ACTIVITY),
      where("userId", "==", userId)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const activities: ActivityItem[] = []
        snapshot.forEach((doc) => {
          activities.push(doc.data() as ActivityItem)
        })
        // Sort in memory by createdAt descending
        activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        onUpdate(activities)
      },
      (err) => {
        if (onError) onError(err)
      }
    )
  }
}
