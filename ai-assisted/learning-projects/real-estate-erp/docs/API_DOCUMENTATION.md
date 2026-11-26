# API Documentation — Real Estate ERP (`/api/v1`)

Interactive OpenAPI/Swagger documentation is served at **`/docs`** and ReDoc at **`/redoc`** when the FastAPI backend is running.

All protected endpoints require `Authorization: Bearer <access_token>` and verify both active employee status (`is_active = true`) and module permissions on the server.

## Error Envelope Format
- `400` (`BUSINESS_RULE_VIOLATION`): Domain constraint violated (e.g., overpayment, invalid status transition).
- `401` (`UNAUTHORIZED`): Missing, expired, or invalid token, or deactivated account.
- `403` (`FORBIDDEN`): Authenticated employee lacks required permission.
- `404` (`NOT_FOUND`): Entity does not exist.
- `409` (`CONFLICT`): Duplicate project code, duplicate unit number, duplicate active booking, or duplicate customer confirmation required.
- `422` (`VALIDATION_ERROR`): Pydantic input validation failure (`errors[]` field list).

---

## Endpoints Summary

### Health
- `GET /health` — Public health check reporting database connectivity.

### Authentication (`/api/v1/auth`)
- `GET /auth/setup-status` — Public. Returns `{ "needs_setup": boolean }`.
- `POST /auth/setup` — Public (only when 0 employees exist). Rate-limited. Creates first `ADMIN`.
- `POST /auth/login` — Public. Rate-limited. Returns JWT access/refresh tokens + employee profile.
- `POST /auth/refresh` — Public (with valid refresh token). Rotates refresh token and detects reuse.
- `POST /auth/logout` — Authenticated. Revokes refresh token.
- `GET /auth/me` — Authenticated. Returns current employee profile & permissions.
- `POST /auth/change-password` — Authenticated. Verifies current password, updates hash, revokes active refresh tokens.

### Employees & RBAC (`/api/v1/employees`)
- `GET /employees/roles` — Permission: `employees:read`.
- `GET /employees` — Permission: `employees:read`. Query: `search`, `role_name`, `is_active`, `page`, `page_size`.
- `POST /employees` — Permission: `employees:manage`.
- `PATCH /employees/{employee_id}` — Permission: `employees:manage`.

### Projects (`/api/v1/projects`)
- `GET /projects` — Permission: `projects:read`. Query: `search`, `status`, `project_type`, `include_archived`, `sort_by`, `sort_order`, `page`, `page_size`.
- `GET /projects/{project_id}` — Permission: `projects:read`.
- `POST /projects` — Permission: `projects:write`.
- `PATCH /projects/{project_id}` — Permission: `projects:write`.
- `POST /projects/{project_id}/archive` — Permission: `projects:write`.
- `DELETE /projects/{project_id}` — Permission: `projects:write` (blocked if associated units/bookings/complaints exist).

### Inventory (`/api/v1/inventory`)
- `GET /inventory` — Permission: `inventory:read`. Query: `project_id`, `unit_type`, `status`, `min_price`, `max_price`, `min_size`, `max_size`, `search`, `sort_by`, `sort_order`, `page`, `page_size`.
- `GET /inventory/{unit_id}` — Permission: `inventory:read`.
- `POST /inventory` — Permission: `inventory:write`.
- `PATCH /inventory/{unit_id}` — Permission: `inventory:write`.
- `POST /inventory/{unit_id}/status` — Permission: `inventory:write`.

### Customers & Leads (`/api/v1/customers`, `/api/v1/leads`)
- `GET /customers`, `GET /customers/{id}`, `GET /customers/{id}/profile` — Permission: `customers:read`.
- `POST /customers`, `PATCH /customers/{id}` — Permission: `customers:write`.
- `GET /leads`, `GET /leads/{id}` — Permission: `leads:read`.
- `POST /leads`, `PATCH /leads/{id}`, `POST /leads/{id}/convert` — Permission: `leads:write`.

### Bookings (`/api/v1/bookings`)
- `GET /bookings`, `GET /bookings/{id}` — Permission: `bookings:read`.
- `POST /bookings` — Permission: `bookings:write` (transactional + row-locked).
- `POST /bookings/{id}/confirm` — Permission: `bookings:write`.
- `POST /bookings/{id}/complete-sale` — Permission: `bookings:write`.
- `POST /bookings/{id}/cancel` — Permission: `bookings:cancel` (requires `reason`).

### Collections (`/api/v1/collections`)
- `GET /collections`, `GET /collections/summary`, `GET /collections/{id}` — Permission: `collections:read`.
- `POST /collections` — Permission: `collections:write`.
- `POST /collections/{id}/reverse` — Permission: `collections:reverse` (requires `reason`).

### Complaints (`/api/v1/complaints`)
- `GET /complaints`, `GET /complaints/{id}` — Permission: `complaints:read`.
- `POST /complaints`, `PATCH /complaints/{id}` — Permission: `complaints:write`.

### Dashboard, Reports & Audit (`/api/v1/dashboard`, `/api/v1/reports`, `/api/v1/activity-logs`)
- `GET /dashboard` — Permission: `dashboard:read`. Query: `start_date`, `end_date`.
- `GET /reports/{report_type}` — Permission: `reports:operational` or `reports:financial`.
- `GET /reports/{report_type}/export` — Returns downloadable `text/csv`.
- `GET /activity-logs` — Permission: `activity_logs:read`.
