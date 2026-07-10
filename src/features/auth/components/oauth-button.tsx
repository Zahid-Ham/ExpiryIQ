"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "../hooks/use-auth"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"

export function OAuthButton() {
  const { signInWithGoogle, loading } = useAuth()
  const [localLoading, setLocalLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    setLocalLoading(true)
    try {
      await signInWithGoogle()
      toast.success("Successfully authenticated with Google.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google authentication failed."
      toast.error(message)
    } finally {
      setLocalLoading(false)
    }
  }

  const isPending = loading || localLoading

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={isPending}
      className="w-full h-10 font-bold text-sm gap-2 border-border/80 bg-background/50 hover:bg-muted/50 transition-colors focus-visible:ring-1 focus-visible:ring-primary"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
      ) : (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#ea4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.354 0 3.373 2.736 1.545 6.727l3.721 3.038z"
          />
          <path
            fill="#34a853"
            d="M16.04 15.345c-1.072.73-2.5 1.164-4.04 1.164-2.955 0-5.5-2.036-6.4-4.782L1.87 14.773C3.7 18.782 7.8 21.6 12 21.6c3.127 0 5.964-1.09 8.073-3l-4.036-3.255z"
          />
          <path
            fill="#4285f4"
            d="M23.49 12.273c0-.818-.08-1.609-.218-2.364H12v4.51h6.464c-.29 1.482-1.145 2.736-2.427 3.564l4.036 3.255c2.373-2.19 3.418-5.4 3.418-8.964z"
          />
          <path
            fill="#fbbc05"
            d="M5.6 11.727A6.958 6.958 0 0 1 5.273 12c0-.445.036-.882.1-1.309L1.655 7.655A11.954 11.954 0 0 0 1 12c0 1.545.29 3.027.818 4.4l3.782-2.91a7.127 7.127 0 0 1-.6-1.763z"
          />
        </svg>
      )}
      <span>Continue with Google</span>
    </Button>
  )
}
