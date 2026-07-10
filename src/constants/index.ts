/**
 * Global Constants for ExpiryIQ Application
 */

export const APP_NAME = "ExpiryIQ" as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  RECORDS: "/dashboard/records",
  CALENDAR: "/dashboard/calendar",
  ANALYTICS: "/dashboard/analytics",
  SETTINGS: "/dashboard/settings",
  AI_ASSISTANT: "/dashboard/ai",
  ACTIVITY: "/dashboard/activity",
  HELP: "/dashboard/help",
  NOTIFICATIONS: "/dashboard/notifications",
  PLAYGROUND: "/playground",
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type ThemeType = typeof THEME[keyof typeof THEME];

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  RECORDS: "records",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings",
  AUDIT_LOGS: "audit_logs",
  ACTIVITY: "activity",
} as const;

export type FirestoreCollection = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];

export const RECORD_CATEGORIES = {
  SOFTWARE_LICENSE: "software_license",
  DOMAIN_NAME: "domain_name",
  SUBSCRIPTION: "subscription",
  CERTIFICATION: "certification",
  CONTRACT: "contract",
  INSURANCE: "insurance",
  OTHER: "other",
} as const;

export type RecordCategory = typeof RECORD_CATEGORIES[keyof typeof RECORD_CATEGORIES];

export const RECORD_CATEGORY_LABELS: Record<RecordCategory, string> = {
  [RECORD_CATEGORIES.SOFTWARE_LICENSE]: "Software License",
  [RECORD_CATEGORIES.DOMAIN_NAME]: "Domain Name",
  [RECORD_CATEGORIES.SUBSCRIPTION]: "Subscription",
  [RECORD_CATEGORIES.CERTIFICATION]: "Certification",
  [RECORD_CATEGORIES.CONTRACT]: "Contract",
  [RECORD_CATEGORIES.INSURANCE]: "Insurance",
  [RECORD_CATEGORIES.OTHER]: "Other",
};

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  [PRIORITY_LEVELS.LOW]: "Low",
  [PRIORITY_LEVELS.MEDIUM]: "Medium",
  [PRIORITY_LEVELS.HIGH]: "High",
  [PRIORITY_LEVELS.CRITICAL]: "Critical",
};

export const EXPIRY_THRESHOLDS = {
  WARNING_DAYS: 30,    // Threshold when status becomes "warning"
  CRITICAL_DAYS: 7,    // Threshold when status becomes "critical"
} as const;

export const RECORD_STATUS = {
  ACTIVE: "active",
  WARNING: "warning",
  CRITICAL: "critical",
  EXPIRED: "expired",
} as const;

export type RecordStatus = typeof RECORD_STATUS[keyof typeof RECORD_STATUS];

export interface StatusStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_STYLES: Record<RecordStatus, StatusStyle> = {
  [RECORD_STATUS.ACTIVE]: {
    label: "Active",
    badgeClass: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  [RECORD_STATUS.WARNING]: {
    label: "Warning",
    badgeClass: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  [RECORD_STATUS.CRITICAL]: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border-rose-500/20",
    dotClass: "bg-rose-500",
  },
  [RECORD_STATUS.EXPIRED]: {
    label: "Expired",
    badgeClass: "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/15 border-zinc-500/20",
    dotClass: "bg-zinc-500",
  },
};

export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  FULL: "MMMM dd, yyyy, h:mm a",
} as const;

export interface NavItem {
  label: string;
  href: RoutePath;
  iconName: string; // Used to reference Lucide icons dynamically
}

export const NAVIGATION_ITEMS: readonly NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    iconName: "LayoutDashboard",
  },
  {
    label: "Records",
    href: ROUTES.RECORDS,
    iconName: "FileText",
  },
  {
    label: "Calendar",
    href: ROUTES.CALENDAR,
    iconName: "Calendar",
  },
  {
    label: "Analytics",
    href: ROUTES.ANALYTICS,
    iconName: "BarChart3",
  },
  {
    label: "Settings",
    href: ROUTES.SETTINGS,
    iconName: "Settings",
  },
] as const;
