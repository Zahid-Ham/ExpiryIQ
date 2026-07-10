
export interface UserSession {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  isOnboarded: boolean
}

export interface AuthState {
  user: UserSession | null
  loading: boolean
  initialized: boolean
  error: string | null
}

export type AuthContextType = AuthState & {
  logIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  completeOnboarding: (data: {
    orgName: string
    department: string
    role: string
    reminderWindow: string
    theme: string
  }) => Promise<void>
}
