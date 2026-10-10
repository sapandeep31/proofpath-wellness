# 🌿 ProofPath — Your Personal Product Journey Companion

> **A premium product-journey, skincare wellness, and community web application built for customers of Be Bodywise (Mosaic Wellness).**

🔗 **Live Demo:** [https://proofpath-wellness.sapandeep318.workers.dev/](https://proofpath-wellness.sapandeep318.workers.dev/)  
📁 **Fellowship Submission:** Mosaic Wellness Product & Engineering Fellowship

---

## 📖 Executive Summary

Customers frequently purchase skincare, hair-care, or wellness products with high expectations but struggle to maintain consistency, understand usage instructions, identify unwanted reactions, remember when products will run out, or decide on their next routine steps.

**ProofPath** bridges these disconnected experiences into an intelligent, personalized, and aesthetically refined platform:
- **Tracks Progress over Promises**: Encourages personal consistency and observable patterns over unrealistic overnight claims.
- **Predictive Replenishment**: Accurately projects depletion dates using mathematical consumption modeling.
- **Safety-First AI ("Ask Skin Guide")**: Powered by Google Gemini with strict guardrails against unverified medical diagnosis.
- **Consent-First Community**: A supportive peer circle where users share authentic timelines with clear disclaimers.

---

## ⚡ Core Features & 7 Main Sections

### 1. 🏠 Home Dashboard
- **Routine Momentum**: Tracks weekly consistency percentages and day streaks.
- **Quick Logging**: Fast one-tap usage and visual level check-in.
- **Supply Forecast**: Dynamic status cards displaying estimated days remaining before replenishment is required.
- **Weekly Reflection Summary**: Aggregated skin sentiment, consistency metrics, and progress notes.

### 2. 🧴 My Products (Inventory & Depletion Engine)
- **Visual Product Cards**: Custom packaging silhouettes (airless jars, dropper bottles, pumps, tubes) color-coded to category.
- **Consumption Math**:
  - Automatically calculates daily & weekly consumption based on application frequency and quantity per use.
  - Compares expected vs. actual depletion rates over time.
- **Multi-Tier Reminders**: First reminder (~7 days prior), second reminder (~3 days prior), and final replenishment alert.

### 3. 📈 My Journey (Reflective Tracking)
- **Goal-Oriented Pathways**: Focused tracking per concern (e.g., Barrier Repair, Scalp Health, Breakout Control).
- **Weekly Check-Ins**: Evaluates satisfaction ratings (1–5), symptom changes (*improved, same, worsened, unsure*), and reaction observations (*none, mild, moderate, severe*).
- **Privacy Controls**: Every journey defaults to private with opt-in community sharing.

### 4. 🤖 AI Skin Support ("Ask Skin Guide")
- **Google Gemini REST Integration**: Leverages Google Gemini 2.0 Flash / 1.5 Flash.
- **Safety Guardrails (Spec Part 9 Compliant)**:
  - Non-diagnostic: Explicitly framed as general educational guidance.
  - Emergency Red Flags: Automatically directs users to emergency care if severe symptoms (breathing difficulty, facial swelling, severe blistering) are mentioned.
  - Symptom Summary Generator: Formats a clean briefing card that users can take to a doctor or pharmacist.
  - Pluggable API Key: Users can bring their own Google Gemini API key or utilize the server-side environment key.

### 5. 👥 Community ("The ProofPath Circle")
- **Authentic Experience Sharing**: Peer posts organized by timeline stage (*Just started, 1 month, 3 months, Long term*).
- **Engagement**: Supportive reactions (*Supportive, Insightful, Been there*) and moderated discussion threads.
- **Safety Disclaimers**: Automatic badge indicating posts represent individual experiences, not medical advice.

### 6. 📚 Product Guide & Verified Ingredients
- **Educational Database**: Comprehensive guides for Be Bodywise formulations (Hydra Calm Moisturiser, Foaming Cleanser, Anti-Hairfall Shampoo, Body Butter).
- **Ingredient Functionality**: Transparent explanations of active and supporting ingredients (e.g., *Niacinamide, Ceramide NP, Squalane, Caffeine, Urea*).
- **Usage & Precautions**: Official application orders, patch-test recommendations, and FAQs.

### 7. ⚙️ Profile & Settings
- **Personalized Onboarding**: Tailored skin/hair interests and wellness goals.
- **Notification Matrix**: Granular toggles for replenishment, routine reminders, and community alerts.
- **AI Connection Manager**: Inspect, test, or update Google Gemini API key securely.
- **Explorable Demo Mode**: One-click demo reset with pre-populated sample records.

---

## 🏗️ Architecture & Tech Stack

```
               ┌────────────────────────────────────────────────────────┐
               │                  Cloudflare Global CDN                 │
               └───────────────────────────┬────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       [ Cloudflare Assets (SPA) ]                   [ Cloudflare Worker API ]
      Next.js 16 Client Application                     (src/worker.ts)
      Tailwind CSS v4 + Radix UI                                  │
      Zustand Reactive Store                                      ├──► [ Google Gemini API ]
                                                                  │    (Ask Skin Guide)
                                                                  └──► [ In-Memory / D1 Store ]
```

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16.1.3 (App Router) + React 19 | Core application structure and component lifecycle |
| **Styling** | Tailwind CSS v4, Lucide Icons, Framer Motion | Brand aesthetics (`#FAF8F3`, `#314C3C`, `#DCE7D8`) |
| **UI Components** | Radix UI Primitives, Sonner, Recharts | Accessible modals, sheets, progress rings, and charts |
| **State Management** | Zustand | Client-side reactive data synchronization & deep linking |
| **Database (Local)** | Prisma ORM + SQLite (`db/custom.db`) | Local development relational persistence |
| **AI Integration** | Google Gemini API (`generativelanguage.googleapis.com`) | Context-aware, safety-conscious educational guidance |
| **Edge Deployment** | Cloudflare Workers + Cloudflare Assets | Sub-second worldwide delivery with zero cold-starts |

---

## 🎨 Design Philosophy & Color Palette

The interface is styled after premium editorial wellness publications, emphasizing calm, warm minimalism:

| Color | Hex | Usage |
|---|---|---|
| **Warm Ivory** | `#FAF8F3` | Main canvas background |
| **Deep Forest Green** | `#314C3C` | Primary brand buttons, active accents, headers |
| **Soft Sage** | `#DCE7D8` | Progress indicators, wellness confirmations |
| **Muted Lavender** | `#E9E2F2` | AI support cards & reflection highlights |
| **Dusty Rose** | `#E8C9C5` | Subtle status badges & notifications |
| **Warm Charcoal** | `#343630` | High-contrast readable typography |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ or [Bun](https://bun.sh/) 1.2+
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install
```bash
git clone https://github.com/sapandeep31/proofpath-wellness.git
cd proofpath-wellness
bun install
# or: npm install --legacy-peer-deps
```

### 2. Configure Environment
Create a `.env` file from `.env.example`:
```env
DATABASE_URL="file:./db/custom.db"
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### 3. Run Locally
```bash
# Generate Prisma Client
bun run db:generate

# Start Next.js Development Server
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy to Cloudflare Workers
```bash
# Build static assets & deploy to Cloudflare
bun run deploy

# (Optional) Add your Gemini API key secret to Cloudflare:
bun run wrangler secret put GEMINI_API_KEY
```

---

## 🔒 Safety & Disclaimers

> **Medical Disclaimer:** ProofPath is a digital wellness companion concept intended solely for educational and routine tracking purposes. It does not provide medical diagnoses, treatment plans, or clinical prescriptions. Users experiencing severe or persistent adverse reactions are directed to consult licensed healthcare practitioners.

---

## 📄 License
MIT License. Created for the Mosaic Wellness Fellowship.
