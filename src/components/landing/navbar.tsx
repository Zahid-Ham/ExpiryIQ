"use client"

import * as React from "react"
import Link from "next/link"
import { APP_NAME, ROUTES } from "@/constants"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu, X, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("")

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Highlight active section on scroll
  React.useEffect(() => {
    const sections = ["features", "how-it-works", "benefits", "faq"]
    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -50% 0px",
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.unobserve(el)
      })
    }
  }, [])

  // Close mobile menu on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const navLinks = [
    { href: "#features", label: "Features", id: "features" },
    { href: "#how-it-works", label: "How It Works", id: "how-it-works" },
    { href: "#benefits", label: "Benefits", id: "benefits" },
    { href: "#faq", label: "FAQ", id: "faq" },
  ]

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out border-b backdrop-blur-md",
        isScrolled
          ? "bg-background/80 dark:bg-background/70 border-border/80 shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo (Left) */}
        <Link
          href={ROUTES.HOME}
          className="flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md group"
          aria-label={`${APP_NAME} Home`}
        >
          <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-primary/10 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 group-hover:scale-105 transition-transform duration-200">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {APP_NAME}
          </span>
        </Link>

        {/* Center Navigation */}
        <nav
          className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = activeSection === link.id
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1.5 hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                <span>{link.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={ROUTES.LOGIN}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Log In
            </Link>
          </Button>
          <Button size="sm" asChild className="shadow-sm hover:shadow-md transition-shadow">
            <Link
              href={ROUTES.SIGNUP}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Get Started
            </Link>
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center space-x-3 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close main menu" : "Open main menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-6 py-6 space-y-6"
          >
            <nav className="flex flex-col space-y-4 text-base font-medium text-muted-foreground">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-3 pt-4 border-t border-border">
              <Button variant="outline" className="w-full" asChild>
                <Link
                  href={ROUTES.LOGIN}
                  onClick={() => setIsOpen(false)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Log In
                </Link>
              </Button>
              <Button className="w-full" asChild>
                <Link
                  href={ROUTES.SIGNUP}
                  onClick={() => setIsOpen(false)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
