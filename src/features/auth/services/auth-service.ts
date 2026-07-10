import { 
  logInUser, 
  signUpUser, 
  logOutUser, 
  resetUserPassword,
  subscribeToAuthChanges,
  auth 
} from "@/lib/auth"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  UserCredential,
  User,
  getIdToken,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth"
import { getDocument, setDocument } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"

// Configure session persistence to local storage by default during import initialization
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Failed to configure session persistence:", err)
})

/**
 * Custom typed error to standardize authentication failures
 */
export class AuthError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = "AuthError"
    this.code = code
  }
}

/**
 * Translates Firebase Auth exception codes into user-friendly message strings
 */
function parseFirebaseError(error: unknown): AuthError {
  let code = "auth/unknown"
  if (error && typeof error === "object" && "code" in error) {
    code = String((error as Record<string, unknown>).code)
  }
  let message = "An unexpected authentication error occurred. Please try again."

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      message = "Invalid email or password. Please verify your credentials."
      break
    case "auth/email-already-in-use":
      message = "This email address is already registered."
      break
    case "auth/invalid-email":
      message = "Please enter a valid email address."
      break
    case "auth/weak-password":
      message = "Password is too weak. Please use at least 6 characters."
      break
    case "auth/user-disabled":
      message = "This user account has been disabled. Contact support."
      break
    case "auth/too-many-requests":
      message = "Too many login attempts. Access has been temporarily restricted."
      break
    case "auth/popup-closed-by-user":
      message = "Authentication popup was closed before completion."
      break
  }

  return new AuthError(message, code)
}

export const AuthService = {
  /**
   * Authenticate a user with email and password
   */
  async logIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await logInUser(email, password)
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Register a new user with email and password
   */
  async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      return await signUpUser(email, password)
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Disconnect user authentication session
   */
  async logOut(): Promise<void> {
    try {
      await logOutUser()
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Dispatches reset instructions to user's email address
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await resetUserPassword(email)
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Authenticate using Google OAuth
   */
  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider()
      return await signInWithPopup(auth, provider)
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Retrieves the current authenticated user session from Firebase
   */
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  /**
   * Subscribes to changes in authentication state
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return subscribeToAuthChanges(callback)
  },

  /**
   * Retrieves a refreshed JSON Web Token (JWT) for user API verification
   */
  async getAuthToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    try {
      return await getIdToken(user, forceRefresh)
    } catch (err) {
      throw parseFirebaseError(err)
    }
  },

  /**
   * Fetches user role from Firestore metadata to support role-based authorization
   */
  async getUserRole(uid: string): Promise<string> {
    try {
      const userDoc = await getDocument(FIRESTORE_COLLECTIONS.USERS, uid)
      if (userDoc && typeof userDoc === "object" && "role" in userDoc) {
        return (userDoc as { role: string }).role || "member"
      }
      return "member"
    } catch (err) {
      console.warn("Failed to retrieve user role from Firestore, defaulting to member:", err)
      return "member"
    }
  },

  /**
   * Syncs user profile parameters (uid, displayName, email, photoURL, provider) into Firestore
   */
  async syncUserProfile(user: User): Promise<void> {
    const uid = user.uid
    try {
      const userDoc = await getDocument(FIRESTORE_COLLECTIONS.USERS, uid)
      const now = new Date().toISOString()
      const providerId = user.providerData[0]?.providerId || "google.com"

      if (!userDoc) {
        // Register new user profile fields
        await setDocument(FIRESTORE_COLLECTIONS.USERS, {
          uid,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: now,
          lastLogin: now,
          provider: providerId,
          role: "member"
        }, uid)
      } else {
        // Update last login
        await setDocument(FIRESTORE_COLLECTIONS.USERS, {
          lastLogin: now
        }, uid)
      }
    } catch (err) {
      console.error("Failed to sync user profile inside Firestore:", err)
      throw parseFirebaseError(err)
    }
  }
}
