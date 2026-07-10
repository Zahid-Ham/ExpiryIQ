# ExpiryIQ - AI-Powered Contract & Expiry Tracking Workspace

<div align="center">

![ExpiryIQ](https://img.shields.io/badge/ExpiryIQ-Autonomous%20Tracking-blue?style=for-the-badge&logo=appveyor&logoColor=white)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

### 🤖 Intelligent Document Scans • 🎯 Interactive Risk Profiles • 📊 Executive Audits

</div>

---

## 🚀 Overview

**ExpiryIQ** is a state-of-the-art enterprise expiry and contract tracking workspace designed to prevent compliance vulnerabilities. Powered by **dynamic document intelligence**, ExpiryIQ extracts key parameters from PDFs or images, calculates risk profiles, and guides operations teams through automated mitigation actions.

### Why ExpiryIQ?

- **🧠 Document Intelligence**: Automatically parses contract metadata (title, dates, vendors) from uploads using browser-side extractors and Groq Vision model fallbacks.
- **⚡ Reactive Workspace**: Real-time Firestore synchronizations ensure dashboard metrics, statistics, and quick fixes adapt immediately to changes.
- **📈 Compliance & Risk Scores**: Features automated compliance scorings and executive risk reviews outlining database gaps.
- **🎨 Modern Design**: Custom tailored HSL colors, responsive grids, and professional micro-interactions built with vanilla CSS.
- **🛡️ Secure Cache Guards**: Secure client hashing prevents re-running expensive LLM queries for repeat documents and summaries.

---

## ✨ Features

### 🤖 Core Workspace Modules

| Module | Core Functionality | AI Capabilities | Live Actions |
|--------|-------------------|-----------------|--------------|
| **AI Copilot Chat** | Natural language queries | Contextual Llama-3 parsing | Ask about active cost, priority warning, or draft reminders |
| **Executive Audit** | Portfolio compliance review | Groq text compiling | Generates business-friendly PDF summary reports |
| **Risk Analysis** | Vulnerability diagnostics | Risk score metrics (0-100) | Displays department exposures and database gaps |
| **Recommendations** | Operational guidance | JSON layout generation | Direct action card triggers pre-filtering the registry |
| **Document Intelligence** | File metadata parsing | PDF text parsing / Groq Vision fallback | Prefills record forms from files with zero OCR duplicates |
| **Smart AI Search** | Registry query compiling | Dynamic search intent parsing | Enter queries like "expired contracts" to filter datatables |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            🎯 EXPIRYIQ WORKSPACE                             │
│                                                                              │
│  • Firestore Real-Time Streams     • Session Token Tracking                  │
│  • Local Hashing Cache Guards       • Multi-Tab AI Hub Interface              │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │  MODULE 1:   │  │  MODULE 2:   │  │  MODULE 3:   │
         │ DOCUMENT INT │─▶│ COMPLIANCE   │─▶│   REACTIVE   │
         │              │  │ AUDIT REPORT │  │  DATATABLE   │
         └──────────────┘  └──────────────┘  └──────────────┘
                │                  │                  │
        ┌───────┴────────┐  ┌──────┴──────┐  ┌───────┴─────────┐
        │                │  │             │  │                 │
    ┌───▼────┐     ┌─────▼──┐  ┌─────▼─────┐  ┌─────▼─────┐ ┌──▼──────┐
    │  PDF   │     │ Image  │  │  Executive│  │    AI     │ │   Smart │
    │ Reader │     │ Vision │  │  Summary  │  │   Risk    │ │  Search │
    │        │     │        │  │  Audits   │  │  Analysis │ │  Filters│
    │• Local │     │• Groq  │  │           │  │           │ │         │
    │  Text  │     │  Vision│  │• Category │  │• Scoring  │ │• Local  │
    │  Scan  │     │  Model │  │  Profiles │  │  Metrics  │ │  Regex  │
    └────────┘     └────────┘  └───────────┘  └───────────┘ └─────────┘
```

### Technology Stack

**Frontend & Logic:**
- Next.js 16 (React, TypeScript)
- TailwindCSS & Vanilla CSS
- Firebase JS Client SDK
- pdfjs-dist for text extraction
- Lucide React icons
- React Hot Toast

---

## 🛠️ Quick Start

### Prerequisites

- **Node.js 18+**
- **Firebase Project Config**
- **Groq API Key**

### Installation

1. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/Zahid-Ham/ExpiryIQ.git
   cd ExpiryIQ
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_GROQ_API_KEY=gsk_your_groq_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Best Practices

- **Zero API Key Leakage**: Groq operations proxy securely through Server-Side api routes, keeping backend authorization keys concealed from browser inspectors.
- **Robust Caching**: Document caches match SHA-256 byte signatures, ensuring no double billing or rate limit penalties on Groq free tiers.
