"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  X, 
  Filter, 
  Calendar, 
  Tag, 
  Bookmark, 
  Trash2, 
  RefreshCw,
  Building,
  Mail,
  Sliders
} from "lucide-react"
import toast from "react-hot-toast"

export interface FilterState {
  category: string
  department: string
  priority: string
  owner: string
  status: string
  startDate: string
  endDate: string
  reminderDays: number[]
  tags: string[]
}

export const initialFilterState: FilterState = {
  category: "",
  department: "",
  priority: "",
  owner: "",
  status: "",
  startDate: "",
  endDate: "",
  reminderDays: [],
  tags: []
}

interface AdvancedFiltersDrawerProps {
  open: boolean
  onClose: () => void
  activeFilters: FilterState
  onApplyFilters: (filters: FilterState) => void
  onResetFilters: () => void
}

interface SavedPreset {
  id: string
  name: string
  filters: FilterState
}

export function AdvancedFiltersDrawer({
  open,
  onClose,
  activeFilters,
  onApplyFilters,
  onResetFilters
}: AdvancedFiltersDrawerProps) {
  const [filters, setFilters] = React.useState<FilterState>({ ...activeFilters })
  const [tagInput, setTagInput] = React.useState("")
  const [presetName, setPresetName] = React.useState("")
  const [presets, setPresets] = React.useState<SavedPreset[]>([])

  // Keep internal state in sync with external updates
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setFilters({ ...activeFilters })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, activeFilters])

  // Load saved presets from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("expiry_iq_filter_presets")
      if (stored) {
        const timer = setTimeout(() => {
          setPresets(JSON.parse(stored))
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Input handlers
  const handleInputChange = (field: keyof FilterState, value: string | number[] | string[]) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleReminderDay = (day: number) => {
    const current = filters.reminderDays
    if (current.includes(day)) {
      setFilters((prev) => ({ ...prev, reminderDays: current.filter((d) => d !== day) }))
    } else {
      setFilters((prev) => ({ ...prev, reminderDays: [...current, day].sort((a, b) => a - b) }))
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!filters.tags.includes(tagInput.trim())) {
        setFilters((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFilters((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({ ...initialFilterState })
    onResetFilters()
    onClose()
  }

  // Presets handlers
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!presetName.trim()) return

    const newPreset: SavedPreset = {
      id: Math.random().toString(36).substring(2, 9),
      name: presetName.trim(),
      filters: { ...filters }
    }

    const updated = [...presets, newPreset]
    setPresets(updated)
    localStorage.setItem("expiry_iq_filter_presets", JSON.stringify(updated))
    setPresetName("")
    toast.success(`Preset "${newPreset.name}" saved successfully`)
  }

  const handleLoadPreset = (preset: SavedPreset) => {
    setFilters({ ...preset.filters })
    onApplyFilters(preset.filters)
    toast.success(`Loaded preset "${preset.name}"`)
    onClose()
  }

  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    localStorage.setItem("expiry_iq_filter_presets", JSON.stringify(updated))
    toast.success(`Preset "${name}" deleted`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer Wrapper */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col select-none text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4.5 w-4.5 text-primary shrink-0" />
                <h3 className="text-sm font-extrabold text-foreground">Advanced Filters</h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Filters form content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="Software">Software</option>
                  <option value="Security">Security</option>
                  <option value="Domain">Domain Name</option>
                  <option value="Legal">Legal Contract</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Marketing">Marketing Tools</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="expiring_soon">Expiring Soon</option>
                  <option value="renewed">Renewed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  <span>Department</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales, IT, Engineering"
                  value={filters.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Owner Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Owner Email</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. manager@company.com"
                  value={filters.owner}
                  onChange={(e) => handleInputChange("owner", e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Expiry Date Range */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Expiry Date Range</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-bold text-foreground focus:outline-none focus:border-primary transition-all font-sans"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-bold text-foreground focus:outline-none focus:border-primary transition-all font-sans"
                  />
                </div>
              </div>

              {/* Reminder Windows checkboxes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Reminder Windows</label>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 border border-border bg-background/50 rounded-lg p-2">
                  {[3, 7, 14, 30, 60, 90].map((day) => (
                    <label key={day} className="flex items-center gap-1 text-[11px] font-bold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.reminderDays.includes(day)}
                        onChange={() => handleToggleReminderDay(day)}
                        className="rounded border-border accent-primary h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>{day}d</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Tags (Press Enter)</span>
                </label>
                <input
                  type="text"
                  placeholder="Type tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all font-sans"
                />
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {filters.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-border/50 my-2" />

              {/* Saved Presets Manager */}
              <div className="space-y-3">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Saved Presets</span>
                </p>

                {/* Save Current Preset Form */}
                <form onSubmit={handleSavePreset} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Preset name (e.g. IT renewals)"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-lg border border-border bg-background text-xs font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-8 text-[10px] font-extrabold px-2.5 cursor-pointer"
                  >
                    Save
                  </Button>
                </form>

                {/* Presets lists */}
                {presets.length > 0 ? (
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between border border-border bg-background/50 rounded-lg p-2 text-xs font-semibold text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          className="flex-1 truncate hover:text-foreground text-left font-bold cursor-pointer"
                        >
                          {preset.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id, preset.name)}
                          className="text-muted-foreground hover:text-rose-500 ml-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-semibold text-muted-foreground/80 pl-0.5">No saved presets yet.</p>
                )}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-border/50 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-9 text-xs font-bold gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                className="flex-1 h-9 text-xs font-bold gap-1 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Apply Filters</span>
              </Button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
