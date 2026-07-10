"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { setDocument } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  ShieldAlert, 
  FileText, 
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from "lucide-react"
import toast from "react-hot-toast"

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: "How do I add a new contract?",
    answer: "Navigate to the Records page and click on the 'Add Record' button in the upper right. Provide the contract title, expiry date, category, priority, and vendor. You can also upload supporting files directly in the upload panel."
  },
  {
    question: "What file formats are supported for document upload?",
    answer: "We support PDF documents, Microsoft Word files (.docx), PNG images, and JPEG/JPG photographs. The maximum size per file is 10MB."
  },
  {
    question: "How do I export my contract registry data?",
    answer: "Go to the Records page and click the 'Export' button. You can choose to export all records or only your currently filtered records. You can customize the exported columns and choose between CSV, Excel (.xls), and PDF Summary print layouts."
  },
  {
    question: "How does the auto-save setting work?",
    answer: "All configuration preferences under your Settings page automatically sync with your Firestore user profile in real-time as soon as you toggle a preference switch or click out of an input field."
  },
  {
    question: "How do I manage my notifications?",
    answer: "Go to Settings and select the Notifications tab. Here you can configure email notifications, expiry warning thresholds, and digest frequency preferences."
  }
]

export default function HelpSupportPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null)
  
  // Ticket Form States
  const [ticketSubject, setTicketSubject] = React.useState("")
  const [ticketMessage, setTicketMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const ticketId = `ticket_${Date.now()}`
      await setDocument("support_tickets", {
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous@expiryiq.com",
        subject: ticketSubject,
        message: ticketMessage,
        status: "open",
        createdAt: new Date().toISOString()
      }, ticketId)

      setSubmitted(true)
      setTicketSubject("")
      setTicketMessage("")
      toast.success("Support ticket submitted successfully!")
    } catch (err) {
      console.error("Failed to submit support ticket:", err)
      toast.error("Failed to submit ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Help & Support"
        description="Search our documentation database, view frequently asked questions, or contact our engineering support team."
      />

      <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 select-none text-left">
        
        {/* Left 2 Columns: Search and FAQs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search help articles, FAQs, and guidebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs font-semibold text-foreground placeholder-muted-foreground outline-none border-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-extrabold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Guides Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex gap-3.5 hover:border-primary/30 transition-all">
              <div className="p-2.5 rounded-lg bg-primary/5 text-primary h-fit">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Getting Started Guide</h4>
                <p className="text-[10px] font-semibold text-muted-foreground">Learn the fundamentals of contract ingestion and warning thresholds.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex gap-3.5 hover:border-primary/30 transition-all">
              <div className="p-2.5 rounded-lg bg-primary/5 text-primary h-fit">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Document Management</h4>
                <p className="text-[10px] font-semibold text-muted-foreground">Manage file attachments, document previews, and download pathways.</p>
              </div>
            </div>
          </div>

          {/* FAQ list */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Frequently Asked Questions</h3>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quick answers to common scenarios</p>
            </div>

            <div className="divide-y divide-border/60">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  return (
                    <div key={index} className="py-3 first:pt-0 last:pb-0">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between text-left cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <p className="mt-2 text-xs font-semibold text-muted-foreground/90 leading-relaxed animate-in fade-in duration-200">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                  No FAQs matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Contact support ticket form */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-sm font-extrabold text-foreground">Contact Support</h3>
            </div>
            
            <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
              Cannot find what you are looking for? Send a ticket directly to our engineers and we will reply as soon as possible.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Ticket Submitted!</p>
                <p className="text-[10px] font-semibold text-muted-foreground">Our team has been notified. We will contact you at your account email.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[10px] font-extrabold text-primary hover:underline cursor-pointer pt-2 block mx-auto"
                >
                  Submit another ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Export error, file size error"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-background text-xs font-bold focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white hover:bg-primary/95 text-xs font-extrabold cursor-pointer rounded-lg h-9 shadow-sm"
                >
                  {isSubmitting ? "Submitting..." : "Send Ticket"}
                </Button>
              </form>
            )}
          </div>

          {/* Quick contact info */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Mail className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Direct Support Email</p>
              <p className="text-xs font-bold text-foreground">support@expiryiq.com</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
