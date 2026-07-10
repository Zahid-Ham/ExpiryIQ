"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthHeader } from "@/features/auth/components/auth-header"
import { AuthFormContainer } from "@/features/auth/components/auth-form-container"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight, ArrowLeft, Sun, Moon, Laptop, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import toast from "react-hot-toast"
import { ROUTES } from "@/constants"
import { motion, AnimatePresence } from "framer-motion"

export default function OnboardingPage() {
  const { completeOnboarding, loading } = useAuth()
  const { setTheme } = useTheme()
  const router = useRouter()
  
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({
    orgName: "",
    department: "",
    role: "",
    reminderWindow: "30",
    theme: "system",
  })


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "theme") {
      setTheme(value)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.orgName.trim() || !formData.department.trim()) {
        toast.error("Please fill out all fields to proceed.")
        return
      }
    }
    if (step === 2) {
      if (!formData.role.trim()) {
        toast.error("Please specify your role.")
        return
      }
    }
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      nextStep()
      return
    }

    try {
      await completeOnboarding(formData)
      toast.success("Welcome aboard! Let's get started.")
      router.replace(ROUTES.DASHBOARD)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile."
      toast.error(message)
    }
  }

  // Define steps configurations
  const stepTitles = [
    { title: "Organization Details", subtitle: "Tell us about your workplace" },
    { title: "Role & Preferences", subtitle: "Help us customize your workspace" },
    { title: "Visual Preferences", subtitle: "Select your default theme look" }
  ]

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title={stepTitles[step - 1].title}
          subtitle={stepTitles[step - 1].subtitle}
        />

        {/* Step Indicator Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AuthFormContainer onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-1">
                  <Label htmlFor="orgName" className="text-sm font-semibold">
                    Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    type="text"
                    required
                    placeholder="Acme Corporation"
                    value={formData.orgName}
                    onChange={(e) => handleInputChange("orgName", e.target.value)}
                    className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="department" className="text-sm font-semibold">
                    Department
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    required
                    placeholder="Legal / Operations / IT"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-left"
              >
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-sm font-semibold">
                    Your Role
                  </Label>
                  <Input
                    id="role"
                    type="text"
                    required
                    placeholder="Compliance Manager / General Counsel"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reminderWindow" className="text-sm font-semibold">
                    Preferred Reminder Window
                  </Label>
                  <select
                    id="reminderWindow"
                    value={formData.reminderWindow}
                    onChange={(e) => handleInputChange("reminderWindow", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 cursor-pointer text-foreground"
                  >
                    <option value="7" className="bg-background text-foreground">7 Days before expiry</option>
                    <option value="14" className="bg-background text-foreground">14 Days before expiry</option>
                    <option value="30" className="bg-background text-foreground">30 Days before expiry</option>
                    <option value="60" className="bg-background text-foreground">60 Days before expiry</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-left"
              >
                <Label className="text-sm font-semibold">Default Application Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "light", icon: Sun, label: "Light" },
                    { key: "dark", icon: Moon, label: "Dark" },
                    { key: "system", icon: Laptop, label: "System" }
                  ].map((themeOpt) => {
                    const Icon = themeOpt.icon
                    const isSelected = formData.theme === themeOpt.key
                    return (
                      <button
                        key={themeOpt.key}
                        type="button"
                        onClick={() => handleInputChange("theme", themeOpt.key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-xs font-bold gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{themeOpt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
                className="h-10 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-10 text-sm font-bold flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : step === 3 ? (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Finish Setup</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </AuthFormContainer>
      </AuthCard>
    </AuthLayout>
  )
}
