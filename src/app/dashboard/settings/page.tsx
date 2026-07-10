"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getDocument, setDocument } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { 
  User, 
  Building2, 
  Bell, 
  Clock, 
  Palette, 
  Shield, 
  Link as LinkIcon, 
  Trash2,
  Check,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import toast from "react-hot-toast"
import { updatePassword, sendPasswordResetEmail, getAuth } from "firebase/auth"

interface UserSettings {
  displayName: string
  role: string
  orgName: string
  department: string
  notifExpiringSoon: boolean
  notifExpired: boolean
  notifRenewed: boolean
  notifDigests: boolean
  defaultReminderDays: number[]
  theme: "light" | "dark" | "system"
  googleConnected: boolean
  microsoftConnected: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: "",
  role: "Administrator",
  orgName: "",
  department: "",
  notifExpiringSoon: true,
  notifExpired: true,
  notifRenewed: true,
  notifDigests: false,
  defaultReminderDays: [30, 15, 7],
  theme: "system",
  googleConnected: true,
  microsoftConnected: false
}

export default function SettingsPage() {
  const { user, logOut } = useAuth()
  
  const [activeSection, setActiveSection] = React.useState<string>("profile")
  const [settings, setSettings] = React.useState<UserSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load settings from Firestore
  React.useEffect(() => {
    if (!user?.uid) return

    const loadSettings = async () => {
      try {
        const doc = await getDocument(FIRESTORE_COLLECTIONS.USERS, user.uid)
        if (doc) {
          const docData = doc as any
          setSettings(prev => ({
            ...prev,
            ...docData,
            displayName: docData.displayName || user.displayName || "",
            role: docData.role || "Administrator",
            orgName: docData.orgName || "",
            department: docData.department || "",
            theme: (docData.theme as UserSettings["theme"]) || "system"
          }))
        } else {
          // If no doc, populate defaults
          setSettings(prev => ({
            ...prev,
            displayName: user.displayName || ""
          }))
        }
      } catch (err) {
        console.error("Failed to load user settings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user?.uid, user?.displayName])

  // Trigger Firestore Auto-save
  const autoSaveSettings = async (updated: UserSettings) => {
    if (!user?.uid) return
    setIsSaving(true)
    try {
      await setDocument(FIRESTORE_COLLECTIONS.USERS, updated, user.uid)
      // Subtle toast or status
    } catch (err) {
      console.error("Auto-save failed:", err)
      toast.error("Auto-save failed")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle individual toggle switches
  const handleToggle = (key: keyof UserSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key]
    }
    setSettings(updated)
    autoSaveSettings(updated)
  }

  // Handle inputs blur/change
  const handleInputChange = (key: keyof UserSettings, value: string) => {
    const updated = {
      ...settings,
      [key]: value
    }
    setSettings(updated)
    autoSaveSettings(updated)
  }

  // Handle reminder days checkboxes
  const handleReminderDaysToggle = (day: number) => {
    const current = settings.defaultReminderDays || []
    const updatedDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => b - a)

    const updated = {
      ...settings,
      defaultReminderDays: updatedDays
    }
    setSettings(updated)
    autoSaveSettings(updated)
  }

  // Handle theme select changes
  const handleThemeChange = (newTheme: UserSettings["theme"]) => {
    const updated = {
      ...settings,
      theme: newTheme
    }
    setSettings(updated)
    autoSaveSettings(updated)

    // Sync theme class
    if (typeof window !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else if (newTheme === "light") {
        document.documentElement.classList.remove("dark")
      } else {
        // System preference match
        const matches = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (matches) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }
    toast.success(`Theme updated to ${newTheme}`)
  }

  // Trigger password reset email via Firebase Auth
  const handlePasswordReset = async () => {
    if (!user?.email) return
    const auth = getAuth()
    const loadingToast = toast.loading("Sending password reset email...")
    try {
      await sendPasswordResetEmail(auth, user.email)
      toast.dismiss(loadingToast)
      toast.success("Password reset email sent. Please check your inbox.")
    } catch (err) {
      console.error(err)
      toast.dismiss(loadingToast)
      toast.error("Failed to send reset email.")
    }
  }

  // Trigger account deletion warning dialog
  const handleDeleteAccount = async () => {
    if (window.confirm("WARNING: This will permanently delete your account and all associated contract profiles. This action is irreversible. Proceed?")) {
      toast.error("Account deletion is restricted in evaluation sandbox mode.")
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <span className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const sectionsList = [
    { id: "profile", label: "Profile", icon: User },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "reminders", label: "Reminder Defaults", icon: Clock },
    { id: "theme", label: "Theme Preferences", icon: Palette },
    { id: "security", label: "Security & Passwords", icon: Shield },
    { id: "connected", label: "Connected Accounts", icon: LinkIcon },
    { id: "danger", label: "Danger Zone", icon: Trash2, color: "text-rose-500 hover:bg-rose-500/5" }
  ]

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Configure your workflow preferences, company variables, and security parameters."
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted/20 border border-border px-3 py-1.5 rounded-lg select-none">
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Saving preferences...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Preferences auto-saved</span>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-6 mt-6 max-w-5xl mx-auto select-none text-left">
        
        {/* Left Side: Navigation Links */}
        <div className="w-full md:w-60 shrink-0 bg-card border border-border rounded-xl p-2 h-fit space-y-0.5">
          {sectionsList.map((sec) => {
            const Icon = sec.icon
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : sec.color || "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{sec.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Side: Form Configuration Content Panel */}
        <div className="flex-1 bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm min-h-[350px]">
          
          {/* 1. Profile Section */}
          {activeSection === "profile" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Profile Parameters</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Update your personal account settings</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                    onBlur={(e) => handleInputChange("displayName", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-border bg-background/50 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Account Role</label>
                  <input
                    type="text"
                    value={settings.role}
                    onChange={(e) => setSettings(prev => ({ ...prev, role: e.target.value }))}
                    onBlur={(e) => handleInputChange("role", e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-border bg-background/50 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full h-10 px-3.5 rounded-lg border border-border bg-muted/40 text-xs font-semibold text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Organization Section */}
          {activeSection === "organization" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Organization Settings</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Configure corporate metrics and alignment</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Organization / Company Name</label>
                  <input
                    type="text"
                    value={settings.orgName}
                    onChange={(e) => setSettings(prev => ({ ...prev, orgName: e.target.value }))}
                    onBlur={(e) => handleInputChange("orgName", e.target.value)}
                    placeholder="Enter organization..."
                    className="w-full h-10 px-3.5 rounded-lg border border-border bg-background/50 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Default Corporate Department</label>
                  <input
                    type="text"
                    value={settings.department}
                    onChange={(e) => setSettings(prev => ({ ...prev, department: e.target.value }))}
                    onBlur={(e) => handleInputChange("department", e.target.value)}
                    placeholder="e.g. Procurement, Engineering..."
                    className="w-full h-10 px-3.5 rounded-lg border border-border bg-background/50 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Notification Preferences */}
          {activeSection === "notifications" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Notification Preferences</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Configure when to receive system alerts</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { key: "notifExpiringSoon", title: "Expiring Soon alerts", desc: "Notify when contracts enter a warning proximity window" },
                  { key: "notifExpired", title: "Expired alerts", desc: "Notify immediately when a contract timeline expires" },
                  { key: "notifRenewed", title: "Renewal cycle success", desc: "Notify when contract profiles are renewed" },
                  { key: "notifDigests", title: "Daily Digest emails", desc: "Send consolidated email summaries each morning" }
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!settings[item.key as keyof UserSettings]}
                      onChange={() => handleToggle(item.key as keyof UserSettings)}
                      className="rounded border-border bg-background h-4.5 w-4.5 cursor-pointer text-primary accent-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Reminder Defaults */}
          {activeSection === "reminders" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Reminder Defaults</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Set default warning day milestones for new profiles</p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Notification Milestones</label>
                <div className="grid grid-cols-2 gap-2 border border-border bg-muted/10 p-3.5 rounded-lg">
                  {[90, 60, 30, 15, 7, 3, 1].map((day) => {
                    const isSelected = settings.defaultReminderDays?.includes(day)
                    return (
                      <label key={day} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleReminderDaysToggle(day)}
                          className="rounded border-border bg-background h-4 w-4 cursor-pointer text-primary accent-primary"
                        />
                        <span>{day} days before</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. Theme Settings */}
          {activeSection === "theme" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Theme Preferences</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adjust your interface aesthetic appearance</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Select Theme Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleThemeChange(t)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold capitalize cursor-pointer transition-colors ${
                        settings.theme === t 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-border bg-background hover:bg-muted/30"
                      }`}
                    >
                      <Palette className="h-4 w-4 mb-1" />
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Security Section */}
          {activeSection === "security" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Security & Passwords</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Manage your credentials and encryption parameters</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 border border-border bg-muted/10 rounded-lg flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Reset Password</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">Send a secure password reset link to your email</p>
                  </div>
                  <Button
                    onClick={handlePasswordReset}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold shrink-0 cursor-pointer rounded-lg h-9 px-4"
                  >
                    Send Email Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 7. Connected Accounts */}
          {activeSection === "connected" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Connected Accounts</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Link single-sign-on integration providers</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { id: "Google", desc: "Single sign-on via Google workspace credentials", connected: settings.googleConnected },
                  { id: "Microsoft", desc: "Sync contract metrics from Outlook / Office 365", connected: settings.microsoftConnected }
                ].map((item) => (
                  <div key={item.id} className="p-3 border border-border bg-muted/10 rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-foreground">{item.id} Account</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">{item.desc}</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id === "Google" ? "googleConnected" : "microsoftConnected")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        item.connected 
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15" 
                          : "border-border bg-background hover:bg-muted/30"
                      }`}
                    >
                      {item.connected ? "Connected" : "Connect Account"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Danger Zone */}
          {activeSection === "danger" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-rose-500">Danger Zone</h3>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Destructive and irreversible account processes</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <p className="text-xs font-bold text-foreground">Delete Account Profile</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">Permanently delete your profile and purge all registered contracts from the database.</p>
                  </div>
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shrink-0 cursor-pointer rounded-lg h-9 px-4 mt-2 sm:mt-0"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  )
}
