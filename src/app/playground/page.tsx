"use client"

import * as React from "react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function PlaygroundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground transition-colors duration-200">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Theme Playground</h1>
            <p className="text-sm text-muted-foreground">Verify the ExpiryIQ theme system</p>
          </div>
          <ThemeToggle />
        </div>

        <Card className="border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enterprise SaaS Card</CardTitle>
              <Badge variant="secondary">Preview</Badge>
            </div>
            <CardDescription>
              Demonstrating active CSS variable styling and subtle borders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sample-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sample Input
              </label>
              <Input id="sample-input" placeholder="Type something..." className="w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Confirm Action
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span>Primary Accent: Blue</span>
          <span>•</span>
          <span>Background: White / Dark Slate</span>
        </div>
      </div>
    </div>
  )
}
