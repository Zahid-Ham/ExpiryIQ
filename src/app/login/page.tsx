"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { loginSchema, LoginInput } from "@/features/auth/schemas"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthHeader } from "@/features/auth/components/auth-header"
import { OAuthButton } from "@/features/auth/components/oauth-button"
import { AuthDivider } from "@/features/auth/components/auth-divider"
import { AuthFormContainer } from "@/features/auth/components/auth-form-container"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { ROUTES } from "@/constants"

export default function LoginPage() {
  const { logIn, loading } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      await logIn(data.email, data.password)
      toast.success("Successfully logged in!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log in."
      toast.error(message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Sign in to your account"
          subtitle="Welcome back to ExpiryIQ renewal intelligence"
        />

        {/* OAuth Provider sign-in */}
        <OAuthButton />

        <AuthDivider />

        {/* Login Form Container */}
        <AuthFormContainer onSubmit={handleSubmit(onSubmit)}>
          {/* Email Address */}
          <div className="space-y-1 text-left">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              aria-invalid={!!errors.email}
              className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-bold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className="h-10 text-sm pr-10 focus-visible:ring-1 focus-visible:ring-primary/50"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2 pt-1 text-left">
            <Checkbox
              id="remember"
              onCheckedChange={() => {
                // Persistent sessions are set default by LocalPersistence in AuthService.
                // We keep checkbox visual option for UX completeness.
              }}
            />
            <Label
              htmlFor="remember"
              className="text-xs font-semibold cursor-pointer select-none leading-none"
            >
              Remember me on this browser
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 font-bold text-sm shadow-sm hover:shadow-md mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </Button>

          {/* Footer sign-up navigation link */}
          <p className="text-sm font-semibold text-muted-foreground text-center pt-2">
            Don&apos;t have an account?{" "}
            <Link href={ROUTES.SIGNUP} className="text-primary hover:underline font-extrabold">
              Get Started
            </Link>
          </p>
        </AuthFormContainer>
      </AuthCard>
    </AuthLayout>
  )
}
