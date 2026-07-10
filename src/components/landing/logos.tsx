"use client"

import * as React from "react"
import { Factory, Briefcase, HeartPulse, HardHat, Zap, Truck, Landmark } from "lucide-react"

export function Logos() {
  const industries = [
    { name: "Manufacturing", icon: <Factory className="h-4 w-4" /> },
    { name: "Consulting", icon: <Briefcase className="h-4 w-4" /> },
    { name: "Healthcare", icon: <HeartPulse className="h-4 w-4" /> },
    { name: "Construction", icon: <HardHat className="h-4 w-4" /> },
    { name: "Energy", icon: <Zap className="h-4 w-4" /> },
    { name: "Logistics", icon: <Truck className="h-4 w-4" /> },
    { name: "Finance", icon: <Landmark className="h-4 w-4" /> },
  ]

  // Double the array to make the scroll seamless
  const marqueeItems = [...industries, ...industries, ...industries]

  return (
    <section className="border-y border-border bg-muted/20 py-12 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 flex flex-col items-center text-center space-y-8">
        {/* Caption Header */}
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          Trusted by operations teams across industries
        </p>

        {/* Sliding Infinite Marquee */}
        <div className="w-full relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
          <div className="flex w-max items-center space-x-12 animate-marquee">
            {marqueeItems.map((ind, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 text-muted-foreground/75 hover:text-foreground transition-colors duration-200"
              >
                <div className="p-2 rounded-lg border border-border bg-card">
                  {ind.icon}
                </div>
                <span className="text-xs font-bold tracking-wide">
                  {ind.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
