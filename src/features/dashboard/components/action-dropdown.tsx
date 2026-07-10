"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ActionItem } from "../types"
import { cn } from "@/lib/utils"

interface ActionDropdownProps<T> {
  item: T
  actions: ActionItem<T>[]
  triggerIcon?: React.ReactNode
}

export function ActionDropdown<T>({
  item,
  actions,
  triggerIcon = <MoreHorizontal className="h-4 w-4" />
}: ActionDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted/50 cursor-pointer"
        >
          <span className="sr-only">Open actions menu</span>
          {triggerIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 border border-border bg-card/95 backdrop-blur-md shadow-md"
      >
        {actions.map((act, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={() => act.onClick(item)}
            disabled={act.disabled}
            className={cn(
              "text-xs font-bold transition-colors cursor-pointer",
              act.variant === "destructive" 
                ? "text-rose-500 focus:bg-rose-500/10 focus:text-rose-500" 
                : "text-foreground focus:bg-muted"
            )}
          >
            {act.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
