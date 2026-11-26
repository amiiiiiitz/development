# System Architecture — Real Estate ERP

## 1. Architectural Pattern: Modular Monolith

The system follows a clean **Modular Monolith** architecture with strict separation between the React SPA frontend, the FastAPI REST backend, and the PostgreSQL relational database.

```
[ React + Vite SPA ]  ──(HTTPS / JSON + Bearer JWT)──▶  [ FastAPI (/api/v1) ]  ──(SQLAlchemy 2.x)──▶  [ PostgreSQL 16 ]
```

---

## 2. Backend Architecture (`backend/app/`)

- **`core/`**: Configuration (`config.py`), database engine & session lifecycle (`database.py`), Argon2 & JWT security (`security.py`), RBAC role-permission catalog (`permissions.py`), structured JSON logging (`logging.py`), and centralized exception handlers (`exceptions.py`).
- **`models/`**: SQLAlchemy 2.0 declarative models organized by bounded context (`auth.py`, `project_inventory.py`, `crm.py`, `booking_collection.py`, `support_audit.py`).
- **`schemas/`**: Pydantic v2 request/response DTOs enforcing strict input validation and `Decimal` serialization.
- **`dependencies/`**: Reusable FastAPI dependencies (`get_current_employee`, `require_permission`, `require_any_permission`) ensuring inactive accounts are rejected and permissions are enforced server-side on every endpoint.
- **`services/`**: Pure domain & transaction orchestration layer (`auth_service.py`, `project_service.py`, `inventory_service.py`, `crm_service.py`, `booking_service.py`, `collection_service.py`, `complaint_service.py`, `dashboard_reports_service.py`, `audit_service.py`). Route handlers contain zero business logic.
- **`api/v1/`**: Versioned REST endpoints grouped by module under `/api/v1`.

---

## 3. Frontend Architecture (`frontend/src/`)

- **`app/`**: Root `AppProviders.jsx` (QueryClient, Toast, Auth), `AppRouter.jsx` (React Router + RBAC `ProtectedRoute`), and `AppLayout.jsx` (persistent sidebar, responsive drawer, breadcrumbs, notifications, user menu).
- **`services/`**: `apiClient.js` (Axios instance storing JWT access & refresh tokens strictly in JS memory, performing automatic single-flight refresh token rotation on `401`) and `erpServices.js` (typed module API wrappers).
- **`components/`**: Shared UI primitives (`Button`, `FormFields`, `Modal`, `ConfirmDialog`, `StatusBadge`, `Pagination`), data/layout states (`DataTable`, `SearchBar`, `PageHeader`, `EmptyState`, `ErrorState`, `LoadingSkeleton`), and feedback (`ToastContext`).
- **`features/`**: Feature modules aligned 1:1 with backend modules (`auth`, `dashboard`, `projects`, `inventory`, `customers`, `bookings`, `collections`, `complaints`, `reports`, `employees`, `settings`).

---

## 4. Critical Data Flow: Concurrency-Safe Booking & Financial Ledger

1. **Booking Creation (`POST /api/v1/bookings`)**:
   - Opens a database transaction and locks the target `inventory_units` row via `SELECT ... FOR UPDATE`.
   - Verifies `unit.status == 'Available'` and checks no active (`Pending` / `Confirmed`) booking exists.
   - Enforces a PostgreSQL partial unique index (`uq_active_booking_per_unit`) on `bookings(inventory_unit_id)` where `status IN ('Pending', 'Confirmed')`.
   - Inserts `Booking`, updates `InventoryUnit.status` (`Reserved` or `Booked`), optionally records initial `Collection`, and writes `BookingStatusHistory`, `InventoryStatusHistory`, and `ActivityLog` atomically.
2. **Collection Reversals (`POST /api/v1/collections/{id}/reverse`)**:
   - Historical payment rows are never deleted or silently edited.
   - Marks `original.is_reversed = True` and inserts a compensating negative `Reversal` entry linked via `reversed_collection_id`, preserving complete financial auditability.
