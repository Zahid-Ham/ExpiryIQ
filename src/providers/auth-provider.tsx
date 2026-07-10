"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { subscribeToAuthChanges } from "@/lib/auth"
import { User } from "firebase/auth"
import { ROUTES } from "@/constants"
import { AuthContextType, UserSession, AuthState } from "@/features/auth/types"
import { AuthService } from "@/features/auth/services/auth-service"
import { getDocument, setDocument } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"


export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    loading: false,
    initialized: false,
    error: null,
  })

  const router = useRouter()
  const pathname = usePathname()

  // Track Firebase Auth Changes
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser: User | null) => {
      let sessionUser: UserSession | null = null
      if (firebaseUser) {
        let isOnboarded = false
        try {
          const userDoc = await getDocument(FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid)
          if (userDoc && typeof userDoc === "object" && "isOnboarded" in userDoc) {
            isOnboarded = !!userDoc.isOnboarded
          }
        } catch (err) {
          console.error("Failed to query user onboarding state:", err)
        }

        sessionUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          isOnboarded,
        }
      }
      setState((prev) => ({
        ...prev,
        user: sessionUser,
        initialized: true,
        loading: false,
      }))
    })

    return () => unsubscribe()
  }, [])

  // Routing Guard Checks
  React.useEffect(() => {
    if (!state.initialized) return

    const isAuthRoute = pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP || pathname === ROUTES.FORGOT_PASSWORD
    const isOnboardingRoute = pathname === ROUTES.ONBOARDING
    const isProtectedRoute = pathname.startsWith(ROUTES.DASHBOARD)

    if (state.user) {
      if (state.user.isOnboarded) {
        if (isAuthRoute || isOnboardingRoute) {
          router.replace(ROUTES.DASHBOARD)
        }
      } else {
        if (pathname !== ROUTES.ONBOARDING) {
          router.replace(ROUTES.ONBOARDING)
        }
      }
    } else {
      if (isProtectedRoute || isOnboardingRoute) {
        router.replace(ROUTES.LOGIN)
      }
    }
  }, [state.user, state.initialized, pathname, router])

  // Context Operations Actions
  const logIn = React.useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const credential = await AuthService.logIn(email, password)
      if (credential.user) {
        await AuthService.syncUserProfile(credential.user)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [])

  const signUp = React.useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const credential = await AuthService.signUp(email, password)
      if (credential.user) {
        await AuthService.syncUserProfile(credential.user)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [])

  const logOut = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await AuthService.logOut()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signout failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [])

  const resetPassword = React.useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await AuthService.resetPassword(email)
      setState((prev) => ({ ...prev, loading: false }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [])

  const signInWithGoogle = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const credential = await AuthService.signInWithGoogle()
      if (credential.user) {
        await AuthService.syncUserProfile(credential.user)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google Authentication failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [])

  const completeOnboarding = React.useCallback(async (onboardingData: {
    orgName: string
    department: string
    role: string
    reminderWindow: string
    theme: string
  }) => {
    if (!state.user) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await setDocument(FIRESTORE_COLLECTIONS.USERS, {
        orgName: onboardingData.orgName,
        department: onboardingData.department,
        role: onboardingData.role,
        reminderWindow: onboardingData.reminderWindow,
        theme: onboardingData.theme,
        isOnboarded: true,
      }, state.user.uid)

      setState((prev) => {
        if (!prev.user) return prev
        return {
          ...prev,
          user: {
            ...prev.user,
            isOnboarded: true,
          },
          loading: false,
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Onboarding failed"
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      throw err
    }
  }, [state.user])

  // Loading indicator for uninitialized session states
  const isAuthRoute = pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP || pathname === ROUTES.FORGOT_PASSWORD
  const isOnboardingRoute = pathname === ROUTES.ONBOARDING
  const isProtectedRoute = pathname.startsWith(ROUTES.DASHBOARD)
  const isRedirecting = state.initialized && (
    (state.user && state.user.isOnboarded && (isAuthRoute || isOnboardingRoute)) ||
    (state.user && !state.user.isOnboarded && pathname !== ROUTES.ONBOARDING) ||
    (!state.user && (isProtectedRoute || isOnboardingRoute))
  )

  if (!state.initialized || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground animate-pulse">Securing session...</span>
        </div>
      </div>
    )
  }

  const contextValue: AuthContextType = {
    ...state,
    logIn,
    signUp,
    logOut,
    resetPassword,
    signInWithGoogle,
    completeOnboarding,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
