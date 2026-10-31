# Sweety – Blood Glucose Tracker (PERN Stack)

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-32%20Passing-brightgreen?logo=jest&logoColor=white)](https://jestjs.io/)

A modern, responsive, patient-centric web application designed for diabetic patients to record up to **4 blood glucose readings per day** across standard meal slots, monitor adherence, and generate automated **Daily**, **Month-to-Date**, and **Monthly (previous month)** reports.

Built with clean architecture, strict database constraints, clinical validation rules, JWT authentication, and a polished healthcare UI inspired by **Shadcn/UI**.

---

## 📑 Table of Contents
- [Features](#features)
- [Validation Rules](#validation-rules)
- [Report Specifications](#report-specifications)
- [Tech Stack](#tech-stack)
- [Project Structure & Architecture](#project-structure--architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Backend Setup & Database Migration](#3-backend-setup--database-migration)
  - [4. Seed Demo Data](#4-seed-demo-data)
  - [5. Frontend Setup](#5-frontend-setup)
- [Running Automated Tests](#running-automated-tests)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Assumptions & Engineering Notes](#assumptions--engineering-notes)
- [Future Improvements](#future-improvements)

---

## ✨ Features

### 1. Authentication & User Isolation
- Secure user registration and login with `name`, `email`, and `password`.
- Passwords hashed with `bcryptjs` (salt rounds: 10); **never stored in plain text**.
- Stateless authentication using JSON Web Tokens (JWT) with bearer token verification.
- **Strict User Isolation**: Patients only access, modify, and calculate reports for their own readings through parameterized queries.

### 2. Blood Glucose Tracking (CRUD)
- Record readings for 4 daily clinical slots:
  - 🌅 `Morning (fasting)`
  - ☕ `After breakfast`
  - ☀️ `After lunch`
  - 🌙 `After dinner`
- View readings by selected date with visual color-coded badges:
  - 🔵 **Low**: `< 70 mg/dl`
  - 🟢 **Normal**: `70 – 140 mg/dl`
  - 🟡 **Elevated**: `141 – 199 mg/dl`
  - 🔴 **High Alert**: `≥ 200 mg/dl`
- Edit existing readings with conflict resolution.
- Delete readings with confirmation dialogs.

### 3. Reports & Analytics
- **Daily Report**: Aggregates highest, lowest, and average glucose levels for the selected date, plus an itemized slot breakdown.
- **Month-to-Date Report**: Aggregates readings from the 1st of the month to the selected date.
- **Monthly Report (Previous Month)**: Aggregates all readings recorded in the entire previous calendar month.
- **Averages rounded to 1 decimal place** (e.g. `118.4 mg/dl`).
- **Friendly empty states** with actionable prompts when no data is recorded for a period.
- **Interactive trend visualization** using Recharts with target threshold reference lines.

---

## 🛡️ Validation Rules

All validation rules are enforced **both on the frontend** for instant user feedback and **on the backend API** as authoritative guards:

| Rule | Trigger Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Value is required** | Value is missing, null, or empty string | `"Please enter a glucose value."` |
| **Whole number between 40 and 600** | Non-integer, `< 40`, `> 600`, or non-numeric | `"Value must be between 40 and 600 mg/dl."` |
| **Only one reading per slot per day** | Duplicate slot on same date for same user | `"You already have an <slot> reading for this date."` |
| **Maximum 4 readings per day** | Adding 5th reading on a single date | `"You can add only 4 readings per day."` |
| **Date cannot be in the future** | `date > today` in local time | `"Date cannot be in the future."` |

*Note: Database unique constraints (`UNIQUE (user_id, date, slot)`) and CHECK constraints (`CHECK (value >= 40 AND value <= 600)`) guarantee data integrity at the database layer.*

---

## 📊 Report Specifications

| Report | Date Range | Example (Selected Date: 15 Oct 2026) | Output Details |
| :--- | :--- | :--- | :--- |
| **Daily** | The selected date | `15 Oct 2026` | Highest, lowest, average (1 dec), count, and **itemized slot breakdown** |
| **Month-to-date** | 1st of month to selected date | `1 Oct 2026 – 15 Oct 2026` | Highest, lowest, average (1 dec), count, and control spread |
| **Monthly** | The whole previous month | `1 Sep 2026 – 30 Sep 2026` | Highest, lowest, average (1 dec), count, and monthly analysis |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg` pool), `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`
- **Testing**: Jest, Supertest
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Shadcn/UI design patterns
- **Database**: PostgreSQL 16+

---

## 📂 Project Structure & Architecture

```
Blood Sugar Level Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection pool configuration
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, login, profile (/api/auth)
│   │   │   ├── readingController.js  # CRUD operations for readings (/api/readings)
│   │   │   └── reportController.js   # Daily, MTD, and Monthly reports (/api/reports)
│   │   ├── db/
│   │   │   ├── schema.sql            # DDL: Tables, constraints, and indexes
│   │   │   ├── init.js               # Database auto-creation & schema application script
│   │   │   └── seed.js               # Demo user and sample readings seeder
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT Bearer token validator
│   │   │   └── errorHandler.js       # Centralized error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── readingRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── utils/
│   │   │   ├── reportHelpers.js      # Date range calculations and statistical aggregations
│   │   │   └── validation.js         # Business logic validation utilities
│   │   ├── tests/
│   │   │   ├── api.test.js           # Integration tests for auth & security
│   │   │   ├── reports.test.js       # Unit tests for report calculations & date ranges
│   │   │   └── validation.test.js    # Unit tests for the 5 assignment validation rules
│   │   ├── app.js                    # Express application setup
│   │   └── server.js                 # HTTP server listener
│   ├── .env.example
│   ├── jest.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn design system (Button, Card, Badge, Dialog, Input, Select, Tabs, Alert)
│   │   │   ├── AuthModal.jsx         # Login & Register modal dialog with 1-click Demo login
│   │   │   ├── DeleteConfirmModal.jsx# Safe confirmation before deleting a reading
│   │   │   ├── EmptyState.jsx        # Friendly empty state display
│   │   │   ├── GlucoseTrendsChart.jsx# Visual line chart with clinical thresholds
│   │   │   ├── Navbar.jsx            # Header with user avatar and quick actions
│   │   │   ├── ReadingCard.jsx       # Individual slot reading card
│   │   │   ├── ReadingFormModal.jsx  # Add/Edit reading modal with validation feedback
│   │   │   ├── ReadingsList.jsx      # Daily slot manager & missing slot suggestions
│   │   │   ├── ReportsSection.jsx    # Tabbed Daily, MTD, and Monthly reports
│   │   │   └── ReportStatsCard.jsx   # Metrics cards (Highest, Lowest, Average, Count)
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global authentication state provider
│   │   ├── services/
│   │   │   └── api.js                # Fetch client with automatic JWT token attachment
│   │   ├── utils/
│   │   │   ├── cn.js                 # Tailwind class merger
│   │   │   ├── dateHelpers.js        # Date formatting and day manipulation
│   │   │   └── glucoseHelpers.js     # Slot configurations and clinical ranges
│   │   ├── App.jsx                   # Main dashboard application
│   │   ├── index.css                 # Base Tailwind styles & custom scrollbars
│   │   └── main.jsx                  # React DOM root
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **PostgreSQL**: v14, v15, v16, v17, or v18+ running locally or remotely

---

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd "Blood Sugar Level Project"
```

---

### 2. Environment Configuration

#### Backend `.env`
Create `backend/.env` from the provided example:
```bash
cp backend/.env.example backend/.env
```

Ensure your PostgreSQL credentials in `backend/.env` match your local setup:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=sweety_db

# JWT Configuration
JWT_SECRET=sweety_super_secret_jwt_key_2026_dev
JWT_EXPIRES_IN=7d

# Frontend Client URL
CLIENT_URL=http://localhost:5173
```

#### Frontend `.env`
Create `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Backend Setup & Database Migration

Install backend dependencies:
```bash
cd backend
npm install
```

Initialize the PostgreSQL database and tables:
```bash
npm run db:init
```
*This script automatically creates the `sweety_db` database if it doesn't already exist and applies `schema.sql` (tables, constraints, and indexes).*

---

### 4. Seed Demo Data

Populate the database with a test user and realistic blood glucose readings across the current month and previous month:
```bash
npm run seed
```

Start the backend API server:
```bash
npm run dev
# Server will listen on http://localhost:5000
```

---

### 5. Frontend Setup

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Client will be available at http://localhost:5173
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🧪 Running Automated Tests

A comprehensive suite of **32 automated tests** covers validation rules, report calculations, edge cases, and API security:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Validation Rules** (`src/tests/validation.test.js`):
  - Value required check with exact message `"Please enter a glucose value."`
  - Values `< 40`, `> 600`, decimals, and non-numeric rejection with message `"Value must be between 40 and 600 mg/dl."`
  - Boundary values (`40`, `600`) and normal values accepted.
  - Future date rejection with message `"Date cannot be in the future."`
  - Time slot enumeration enforcement.
- **Report Analytics** (`src/tests/reports.test.js`):
  - Highest, lowest, average calculation with **exact 1-decimal rounding** (e.g. `111.666...` -> `111.7`).
  - Empty states returning `null` metrics and `hasData: false`.
  - Date range computation for assignment example (`15 Oct 2026` -> Daily: `15 Oct 2026`, MTD: `1 Oct – 15 Oct 2026`, Monthly: `1 Sep – 30 Sep 2026`).
  - Year boundary rollover (January dates correctly resolving to December of previous year).
- **API & Security** (`src/tests/api.test.js`):
  - Health endpoint verification (`GET /api/health`).
  - Unauthenticated route rejection (`401 Unauthorized`).
  - Registration schema validation (minimum password length, email format).

---

## 🔑 Demo Credentials

A pre-seeded demo patient account is ready for immediate evaluation:

| Field | Value |
| :--- | :--- |
| **Email** | `demo@sweety.app` |
| **Password** | `Password123!` |

*(Alternatively, use the **"One-Click Demo Patient Login"** button on the sign-in modal to log in instantly!)*

---

## 📡 API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register new user `{ name, email, password }`
- `POST /api/auth/login` – Authenticate user `{ email, password }`
- `GET /api/auth/me` – Retrieve authenticated user profile (Bearer token required)

### Readings (`/api/readings`)
- `GET /api/readings?date=YYYY-MM-DD` – Retrieve readings for a given date
- `POST /api/readings` – Add reading `{ date, slot, value }`
- `GET /api/readings/:id` – Retrieve a specific reading by ID
- `PUT /api/readings/:id` – Update reading `{ date, slot, value }`
- `DELETE /api/readings/:id` – Delete reading by ID

### Reports (`/api/reports`)
- `GET /api/reports/overview?date=YYYY-MM-DD` – Aggregated Daily, Month-to-Date, and Monthly reports
- `GET /api/reports/daily?date=YYYY-MM-DD` – Daily report with itemized readings
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` – Month-to-Date summary
- `GET /api/reports/monthly?date=YYYY-MM-DD` – Whole previous month summary

---

## 📝 Assumptions & Engineering Notes

1. **Time Slot Constraints**: The 4 clinical slots (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`) are modeled as standardized categories rather than freeform timestamps. This mirrors standard diabetes monitoring protocols where timing relative to meals determines glycemic target ranges.
2. **Database-Level Protection**: While application middleware prevents duplicate slot submissions and maximum daily limits, a PostgreSQL `UNIQUE(user_id, date, slot)` constraint and `CHECK(value >= 40 AND value <= 600)` ensure integrity even under concurrent requests.
3. **Timezone Handling**: Dates are represented as ISO calendar strings (`YYYY-MM-DD`) rather than UTC timestamps with arbitrary offsets to prevent daylight savings shifts from moving readings to adjacent days.
4. **Edit Conflict Exemption**: When updating a reading, the validation logic excludes the reading's own ID so editing a reading value does not erroneously trigger a "reading already exists for this slot" or "maximum 4 readings" error.

---

## 🔮 Future Improvements

With additional time, the following enhancements could be incorporated:
1. **HbA1c Estimation**: Calculate estimated Glycated Hemoglobin (eA1c) using Nathan's formula: `eA1c = (Average Glucose + 46.7) / 28.7`.
2. **CSV / PDF Export**: Enable patients to export their monthly reports as downloadable PDF summaries for endocrinologist appointments.
3. **Medication & Insulin Logging**: Allow recording insulin units or oral medication dosages alongside glucose readings.
4. **Push / Email Reminders**: Send reminders if a patient hasn't logged their post-meal reading within 2 hours of a previous meal.
5. **Continuous Glucose Monitor (CGM) Integration**: Support syncing with Dexcom or Abbott FreeStyle Libre APIs.
