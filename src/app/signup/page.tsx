"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { signupSchema, SignupInput } from "@/features/auth/schemas"
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

export default function SignUpPage() {
  const { signUp, loading } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  // Watch password field to compute strength score
  const passwordVal = watch("password", "")

  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (!pwd) return { score, label: "", color: "bg-muted" }
    
    if (pwd.length >= 8) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score, label: "Weak", color: "bg-rose-500" }
    if (score <= 3) return { score, label: "Medium", color: "bg-amber-500" }
    return { score, label: "Strong", color: "bg-emerald-500" }
  }

  const pwdStrength = getPasswordStrength(passwordVal)

  const onSubmit = async (data: SignupInput) => {
    try {
      await signUp(data.email, data.password)
      toast.success("Account created successfully!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account."
      toast.error(message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Create your account"
          subtitle="Get started with ExpiryIQ to automate renewals"
        />

        {/* OAuth Provider sign-in */}
        <OAuthButton />

        <AuthDivider />

        {/* Signup Form Container */}
        <AuthFormContainer onSubmit={handleSubmit(onSubmit)}>
          {/* Full Name */}
          <div className="space-y-1 text-left">
            <Label htmlFor="fullName" className="text-sm font-semibold">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Alex Johnson"
              aria-invalid={!!errors.fullName}
              className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">
                {errors.fullName.message}
              </p>
            )}
          </div>

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
            <Label htmlFor="password" className="text-sm font-semibold">
              Password
            </Label>
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

            {/* Password Strength Meter */}
            {passwordVal && (
              <div className="space-y-1 pt-1.5">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                    style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                  <span>Strength: {pwdStrength.label}</span>
                  <span>Min. 6 chars</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1 text-left">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                aria-invalid={!!errors.confirmPassword}
                className="h-10 text-sm pr-10 focus-visible:ring-1 focus-visible:ring-primary/50"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 font-semibold mt-0.5">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start space-x-2 pt-1 text-left">
            <Checkbox
              id="terms"
              className="mt-1"
              onCheckedChange={(checked) => setValue("terms", !!checked, { shouldValidate: true })}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-normal cursor-pointer select-none text-foreground"
              >
                I agree to the{" "}
                <Link href="#" className="text-primary hover:underline font-bold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-primary hover:underline font-bold">
                  Privacy Policy
                </Link>
                .
              </label>
              {errors.terms && (
                <p className="text-xs text-rose-500 font-semibold mt-0.5">
                  {errors.terms.message}
                </p>
              )}
            </div>
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
              <span>Create Account</span>
            )}
          </Button>

          {/* Footer sign-in navigation link */}
          <p className="text-sm font-semibold text-muted-foreground text-center pt-2">
            Already have an account?{" "}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-extrabold">
              Log In
            </Link>
          </p>
        </AuthFormContainer>
      </AuthCard>
    </AuthLayout>
  )
}
