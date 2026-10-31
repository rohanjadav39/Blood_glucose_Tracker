# Sweety – Blood Glucose Tracker: Project Architecture & Delivery Walkthrough

This document provides a step-by-step technical breakdown of the architecture, folder structure, validation rules, and implementation decisions for the **Sweety** application.

---

## 🏗️ 1. Directory Structure & What Was Built Where

```
Blood Sugar Level Project/
│
├── backend/                                # Node.js + Express + PostgreSQL API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                       # PostgreSQL connection pooling with node-pg
│   │   ├── controllers/
│   │   │   ├── authController.js           # User registration & login with bcrypt and JWT
│   │   │   ├── readingController.js        # Blood glucose readings CRUD with clinical validation
│   │   │   └── reportController.js         # Daily, Month-to-Date, and Monthly report aggregations
│   │   ├── db/
│   │   │   ├── schema.sql                  # PostgreSQL tables, unique constraints, and check conditions
│   │   │   ├── init.js                     # Auto-migration script (creates sweety_db and applies schema)
│   │   │   └── seed.js                     # Demo patient seeder with 20+ realistic historical readings
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js           # JWT Bearer token authentication & user context injection
│   │   │   └── errorHandler.js             # Centralized Express error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js               # /api/auth (register, login, me)
│   │   │   ├── readingRoutes.js            # /api/readings (CRUD)
│   │   │   └── reportRoutes.js             # /api/reports (overview, daily, month-to-date, monthly)
│   │   ├── utils/
│   │   │   ├── validation.js               # Enforces the 5 required validation rules
│   │   │   └── reportHelpers.js            # Statistical calculators (rounded to 1 decimal) & date range generators
│   │   ├── tests/
│   │   │   ├── validation.test.js          # Unit tests covering all 5 assignment validation rules
│   │   │   ├── reports.test.js             # Unit tests for highest, lowest, average (1 dec), and date ranges
│   │   │   └── api.test.js                 # Integration tests for route security and auth guards
│   │   ├── app.js                          # Express app configuration (separated for testing)
│   │   └── server.js                       # Server entry point with PostgreSQL connection check
│   ├── .env.example                        # Template for backend environment variables
│   ├── jest.config.js                      # Jest test runner configuration
│   └── package.json                        # Backend scripts (start, dev, db:init, seed, test)
│
├── frontend/                               # Vite + React 18 + Tailwind CSS + Shadcn UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                         # Reusable Shadcn-styled UI components
│   │   │   │   ├── Button.jsx              # Button with variants (default, secondary, outline, destructive)
│   │   │   │   ├── Card.jsx                # Card container, Header, Title, Content, and Footer
│   │   │   │   ├── Badge.jsx               # Status badges for clinical glucose levels
│   │   │   │   ├── Dialog.jsx              # Accessible modal dialog with backdrop blur & ESC dismiss
│   │   │   │   ├── Input.jsx               # Form input with validation states
│   │   │   │   ├── Select.jsx              # Custom styled select dropdown
│   │   │   │   ├── Tabs.jsx                # Tab list & triggers
│   │   │   │   └── Alert.jsx               # Error & warning notification banners
│   │   │   ├── Navbar.jsx                  # Header with user avatar, brand logo, and quick actions
│   │   │   ├── AuthModal.jsx               # Sign In / Sign Up modal with 1-Click Demo Patient Login
│   │   │   ├── ReadingCard.jsx             # Individual reading card with slot icons, value, and action buttons
│   │   │   ├── ReadingFormModal.jsx        # Modal for logging or editing readings with live validation
│   │   │   ├── ReadingsList.jsx            # Daily log manager with date navigation and slot tracker (X/4)
│   │   │   ├── ReportsSection.jsx          # Daily, Month-to-Date, and Monthly report tabs
│   │   │   ├── ReportStatsCard.jsx         # Summary cards (Average, Highest, Lowest, Count)
│   │   │   ├── GlucoseTrendsChart.jsx      # Recharts line chart with clinical threshold indicators
│   │   │   └── EmptyState.jsx              # Friendly empty state displays with actionable CTAs
│   │   ├── context/
│   │   │   └── AuthContext.jsx             # Global authentication context & localStorage persistence
│   │   ├── services/
│   │   │   └── api.js                      # REST API client with automatic JWT header attachment
│   │   ├── utils/
│   │   │   ├── cn.js                       # Tailwind class merger utility
│   │   │   ├── dateHelpers.js              # Calendar math, formatters, and day steppers
│   │   │   └── glucoseHelpers.js           # Slot configurations and glucose range categorizations
│   │   ├── App.jsx                         # Main dashboard view & routing logic
│   │   ├── index.css                       # Tailwind directives, custom scrollbars, and glassmorphism
│   │   └── main.jsx                        # React root entry point
│   ├── .env.example                        # Template for frontend environment variables
│   ├── index.html                          # HTML template with Google Fonts (Plus Jakarta Sans)
│   ├── package.json                        # Frontend dependencies and Vite scripts
│   ├── postcss.config.js                   # PostCSS plugins
│   ├── tailwind.config.js                  # Tailwind theme extensions & health color palette
│   └── vite.config.js                      # Vite bundler config with backend proxy
│
├── .gitignore                              # Production ignore rules (node_modules, .env, dist)
└── README.md                               # Complete documentation for installation, testing, and deployment
```

---

## 🔒 2. Validation Implementation Details

| Rule | Implementation Location | Frontend & Backend Behavior |
| :--- | :--- | :--- |
| **Value is required** | `backend/src/utils/validation.js` & `ReadingFormModal.jsx` | Checks for `null`, `undefined`, or whitespace string. Emits `"Please enter a glucose value."`. |
| **Whole number between 40 and 600** | `backend/src/utils/validation.js` & `ReadingFormModal.jsx` | Validates `Number.isInteger(val)` and `val >= 40 && val <= 600`. Decimals (e.g. `110.5`) are rejected. Emits `"Value must be between 40 and 600 mg/dl."`. |
| **Only one reading per slot per day** | `readingController.js` & PostgreSQL `UNIQUE(user_id, date, slot)` | Checks existing readings for the user on that date. Emits dynamic message `"You already have an <slot> reading for this date."`. |
| **Maximum 4 readings per day** | `readingController.js` & `ReadingFormModal.jsx` | Counts readings on target date. If count is 4 and user attempts to add a new slot, emits `"You can add only 4 readings per day."`. |
| **Date cannot be in the future** | `validation.js` & `ReadingFormModal.jsx` | Compares `date` with `getTodayString()`. If `date > today`, emits `"Date cannot be in the future."`. |

---

## 📈 3. Report Logic & Calculations

### 1. Daily Report
- **Date Range**: The selected date (e.g. `2026-10-15`).
- **Data**: Lists each reading with its specific slot (*Morning (fasting)*, *After breakfast*, *After lunch*, *After dinner*).
- **Metrics**: Highest, lowest, average rounded to 1 decimal place, and total readings count.

### 2. Month-to-Date (MTD) Report
- **Date Range**: 1st of the month to the selected date (e.g. `2026-10-01` to `2026-10-15`).
- **Metrics**: Highest, lowest, average rounded to 1 decimal place, and total readings count.

### 3. Monthly Report (Previous Month)
- **Date Range**: Entire previous calendar month (e.g., if selected date is in October 2026, the range is `2026-09-01` to `2026-09-30`). Handles year boundaries (January dates calculate December of previous year).
- **Metrics**: Highest, lowest, average rounded to 1 decimal place, and total readings count.

---

## 🧪 4. Automated Testing Suite

The project includes **32 automated tests** in `backend/src/tests/`:
1. `validation.test.js`: 17 tests testing each boundary, null check, future date rejection, and valid/invalid slot.
2. `reports.test.js`: 6 tests testing statistical precision, 1-decimal rounding, empty states, and calendar range calculations.
3. `api.test.js`: 9 tests verifying JWT authentication middleware, unauthenticated access blocking, health check, and registration validation.

---

## 🚀 5. How to Deploy or Present as a Public Repo

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/sweety-glucose-tracker.git
   git branch -M main
   git push -u origin main
   ```
2. **Reviewer Quick Start**:
   The README contains a 3-step setup guide:
   ```bash
   # Backend
   cd backend && npm install && npm run db:init && npm run seed && npm run dev
   # Frontend
   cd frontend && npm install && npm run dev
   ```
3. **One-Click Demo Login**:
   Hiring managers or reviewers can click the **"One-Click Demo Patient Login"** button on the frontend to immediately explore pre-populated readings and reports without manual registration.
