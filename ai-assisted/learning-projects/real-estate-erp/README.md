# Real Estate ERP

A full-stack, modular-monolith **Enterprise Resource Planning (ERP)** system built for real estate developers and property operations teams to manage projects, property inventory, customers, sales leads, bookings, payment collections, customer complaints, and operational/financial reports.

---

## Technology Stack

### Frontend (`frontend/`)
- **React 19** + **Vite** + **JavaScript (ES6+ / JSX)**
- **Tailwind CSS v4**
- **React Router v7**
- **TanStack Query v5** + **Axios** (with in-memory JWT & automatic refresh rotation)
- **React Hook Form** + **Zod**
- **Recharts** + **Lucide React**
- **Vitest** + **React Testing Library**

### Backend (`backend/`)
- **Python 3.11+** + **FastAPI** + **Uvicorn**
- **SQLAlchemy 2.x** + **Pydantic v2**
- **PostgreSQL 16** + **Alembic** migrations
- **PyJWT** + **Argon2 (`argon2-cffi`)** password hashing
- **Pytest** + **HTTPX**

---

## Core Modules

1. **Operational Dashboard** — Real-time KPIs, inventory status distribution, project-wise overview, monthly booking & collection trends, date filtering, and recent activity feed.
2. **Project Management** — Project CRUD, search/filter/sort, associated inventory & financial stats, safe archival, and deletion protection.
3. **Inventory Management** — Unit tracking (Apartments, Plots, Commercial, Offices, Shops), per-project unit uniqueness, multi-criteria filtering, pricing breakdown, and guarded status audit history.
4. **Customer & Lead Management (CRM)** — Customer directory with duplicate detection, 360° profile view, sales lead pipeline, and transactional lead-to-customer conversion.
5. **Booking Management** — Step-by-step booking workflow with `SELECT ... FOR UPDATE` row-level locking + PostgreSQL partial unique index preventing concurrent double-bookings, confirmation, sale completion, and cancellation with inventory restoration.
6. **Collection Management** — Immutable payment ledger (`DECIMAL` precision), outstanding balance validation, overpayment guard, and reversal workflow.
7. **Customer Complaint Management** — Ticket logging, priority/assignment updates, resolution requirements, and complete history.
8. **Operational & Financial Reports** — 10 backend-calculated reports with filters, summaries, pagination, and CSV export.

---

## Quick Start (Docker Compose)

```bash
docker compose up --build
```

Then open:
- **Frontend UI:** http://localhost:3000
- **FastAPI OpenAPI Docs:** http://localhost:8000/docs

On first launch with an empty database, the login screen presents the **Initial Administrator Setup** form to securely create your first `ADMIN` user.

---

## Local Development Without Docker

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for complete Python virtual environment, PostgreSQL, Alembic migration, CLI admin creation, and optional dev sample seeding instructions.

### Running Tests

- **Frontend tests:** `npm test` (Vitest + React Testing Library)
- **Backend tests:** `cd backend && pytest`

---

## Documentation Index

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Local Setup Guide](docs/SETUP_GUIDE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Deployment & Backup Guide](docs/DEPLOYMENT.md)
- [Development Progress Tracker](docs/DEVELOPMENT_PROGRESS.md)
