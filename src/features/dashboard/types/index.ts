import * as React from "react"

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface StatData {
  title: string
  value: string | number
  change?: string | number
  changeType?: "increase" | "decrease" | "neutral"
  timeframe?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface TableColumn<T> {
  header: React.ReactNode
  accessorKey: keyof T | string
  cell?: (item: T) => React.ReactNode
  className?: string
}

export interface ActionItem<T> {
  label: React.ReactNode
  onClick: (item: T) => void
  disabled?: boolean
  className?: string
  variant?: "default" | "destructive"
}

export type { ExpiryRecord } from "../schemas"

export interface NotificationLog {
  id?: string
  userId: string
  title: string
  description: string
  type: "info" | "warning" | "success"
  unread: boolean
  createdAt?: unknown
}

export interface ActivityLog {
  id?: string
  userId: string
  message: string
  type: "create" | "update" | "delete" | "renew"
  createdAt?: unknown
}

export interface UserSettings {
  userId: string
  orgName: string
  department: string
  role: string
  reminderWindow: string
  theme: string
  createdAt?: unknown
  updatedAt?: unknown
}
