import { 
  getDocument, 
  setDocument, 
  getTimestamp
} from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { UserSettings } from "../types"

/**
 * Service to manage User Profile and Application Settings in Firestore.
 */
export const SettingsService = {
  /**
   * Retrieves preferences settings for a specific user ID.
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    return getDocument(FIRESTORE_COLLECTIONS.USERS, userId) as Promise<UserSettings | null>
  },

  /**
   * Updates or initializes user settings/preferences.
   */
  async saveUserSettings(
    userId: string, 
    settings: Omit<UserSettings, "userId" | "createdAt" | "updatedAt">
  ): Promise<void> {
    const updatedSettings: Omit<UserSettings, "userId"> = {
      ...settings,
      updatedAt: getTimestamp()
    }
    await setDocument(FIRESTORE_COLLECTIONS.USERS, updatedSettings, userId)
  }
}
