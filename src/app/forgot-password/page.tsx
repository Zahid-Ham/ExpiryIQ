"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthHeader } from "@/features/auth/components/auth-header"
import { AuthFormContainer } from "@/features/auth/components/auth-form-container"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { ROUTES } from "@/constants"

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

type ForgotInput = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const { resetPassword, loading } = useAuth()
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotInput) => {
    try {
      await resetPassword(data.email)
      setUserEmail(data.email)
      setIsSuccess(true)
      toast.success("Password reset email sent!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link."
      toast.error(message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        {!isSuccess ? (
          <>
            <AuthHeader
              title="Reset your password"
              subtitle="Enter your email to receive recovery instructions"
            />

            {/* Forgot Password form */}
            <AuthFormContainer onSubmit={handleSubmit(onSubmit)} className="pt-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                  className="h-11 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Submit reset trigger */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-bold text-sm shadow-sm hover:shadow-md mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </Button>

              {/* Back to Login link */}
              <div className="text-center pt-2">
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Log In</span>
                </Link>
              </div>
            </AuthFormContainer>
          </>
        ) : (
          <div className="text-center space-y-6 py-4 flex flex-col items-center">
            {/* Animated Success Illustration */}
            <div className="relative h-20 w-20 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              />
              <svg
                className="h-10 w-10 text-emerald-500 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Check your inbox
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-normal">
                We sent a secure password reset link to <strong className="text-foreground">{userEmail}</strong>. Follow the instructions in the email to restore access.
              </p>
            </div>

            {/* Success state back to login link */}
            <div className="pt-4 w-full">
              <Button asChild className="w-full h-11 font-bold text-sm">
                <Link href={ROUTES.LOGIN}>
                  <span>Return to Log In</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
