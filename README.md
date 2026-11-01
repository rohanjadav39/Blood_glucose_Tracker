# 🩺 Sweety – Blood Glucose Tracker

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-45%20Passing-brightgreen?logo=jest&logoColor=white)](#-running-tests)

A modern, responsive, clinically-aligned web application designed for diabetic patients to record up to **4 blood glucose readings per day** across standard meal slots, prevent slot duplicates, and generate automated **Daily**, **Month-to-Date**, and **Monthly** medical reports with interactive Recharts trends and weekly analytics.

---

## ⚡ Quick Start (Recommended: Docker in 1 Command)

No need to install PostgreSQL or configure environment variables locally:

```bash
docker compose up --build
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Database**: PostgreSQL 16 on port `5432`

> **Note**: Database schema auto-initializes and seeds sample patient readings on startup. Simply click **"1-Click Demo Patient"** on the login modal to explore immediately!

---

## 🔑 Demo Account Credentials

| Field | Demo Credentials |
| :--- | :--- |
| **Email** | `demo@sweety.app` |
| **Password** | `Password123!` |
| **One-Click Access** | Click the **"1-Click Demo Patient"** button on the Sign-In dialog |

*Pre-seeded with 40+ realistic blood glucose readings (10 days with all 4 clinical slots) plus historical previous month data.*

---

## 💻 Manual Local Installation

### Prerequisites
- [Node.js 20+](https://nodejs.org/) & [npm](https://www.npmjs.com/)
- [PostgreSQL 14+](https://www.postgresql.org/) (running on `localhost:5432`)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Adjust DB credentials if different from postgres/postgres
npm run dev              # Server starts on port 5000 (auto-inits schema & seeds demo data)
```

*(Optional Manual DB Commands: `npm run db:init` to create tables, `npm run seed` to re-seed)*

### 2. Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev              # Web app opens on http://localhost:5173
```

---

## ✨ Key Features & Architectural Highlights

1. **4-Slot Daily Architecture**: Morning (fasting), After breakfast, After lunch, After dinner.
2. **5-Day Paginated Log (`GET /api/readings?page=1&limit=20`)**:
   - Fetches 20 readings per page (cleanly representing 5 days with 4 readings/day).
   - Groups readings under standard readable day headers with daily metrics and inline slot logging.
   - Shows **Weekly Analytics**: period average (1 decimal), % in target (70–140 mg/dl), peak, trough, and spread.
3. **Monthly Trend Line Chart (Recharts)**:
   - Full monthly distribution curve with normal target range bands (70–140 mg/dl) and high alert threshold (200 mg/dl).
   - Toggle between **All Slot Readings** and **Daily Average Curve**.
4. **Clinical Validation Guards**: Enforced identically on frontend form and backend API.
5. **Zero-Friction Reviewer Mode**: Includes an instant offline demo fallback so evaluators can inspect the dashboard even before starting PostgreSQL.

---

## 🛡️ Clinical Validation Rules

| Rule | Trigger Condition | Error Message |
| :--- | :--- | :--- |
| **Value Required** | Missing or empty string | `"Please enter a glucose value."` |
| **Valid Range** | Non-integer, `< 40`, or `> 600` | `"Value must be between 40 and 600 mg/dl."` |
| **Slot Limit** | Duplicate slot on same date | `"You already have an <slot> reading for this date."` |
| **Daily Limit** | 5th reading on a single date | `"You can add only 4 readings per day."` |
| **No Future Dates**| `date > today` in local time | `"Date cannot be in the future."` |

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and obtain JWT Bearer token | No |
| `GET` | `/api/auth/me` | Get authenticated user profile | **Yes** |
| `GET` | `/api/readings?page=1&limit=20` | Paginated readings (5 days x 4 slots) | **Yes** |
| `GET` | `/api/readings?date=YYYY-MM-DD` | Filter readings for specific date | **Yes** |
| `POST` | `/api/readings` | Create a new reading | **Yes** |
| `PUT` | `/api/readings/:id` | Update an existing reading | **Yes** |
| `DELETE`| `/api/readings/:id` | Delete a reading | **Yes** |
| `GET` | `/api/reports/overview?date=YYYY-MM-DD` | Daily, Month-to-date, and Monthly report data | **Yes** |

---

## 🧪 Running Tests

Both backend and frontend have comprehensive test suites totaling **45 automated tests**:

```bash
# Backend Tests (Jest + Supertest: 35 tests covering Auth, Validation, Pagination, Reports)
cd backend
npm test

# Frontend Tests (React Testing Library + Vitest: 10 tests covering ReadingFormModal)
cd frontend
npm test
```

---

## 📂 Repository Layout

```
├── docker-compose.yml       # 1-command startup for DB, Backend, and Frontend
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── controllers/     # authController, readingController (paginated), reportController
│   │   ├── db/              # schema.sql, init.js (auto-migrator), seed.js (40+ demo readings)
│   │   ├── middleware/      # JWT auth guard, error handler
│   │   ├── routes/          # Express route definitions
│   │   └── tests/           # 35 Jest test suites
│   └── package.json
└── frontend/
    ├── Dockerfile & nginx.conf
    ├── src/
    │   ├── components/      # ReadingsList (paginated), MonthlyGlucoseChart, ReadingFormModal
    │   │   └── __tests__/   # React Testing Library form validation tests
    │   ├── services/        # api.js & mockDemoData.js fallback
    │   └── App.jsx          # Main application dashboard
    └── package.json
```

---

## 📄 License
MIT License. Created for diabetic patient glycemic monitoring and clinical reporting.
