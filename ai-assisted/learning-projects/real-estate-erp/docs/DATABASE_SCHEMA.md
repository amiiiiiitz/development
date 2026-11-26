# Database Schema — Real Estate ERP

All tables use **UUID primary keys**, **UTC timezone-aware timestamps** (`TIMESTAMPTZ`), **`NUMERIC(14, 2)`** for monetary values (zero floating-point columns), and foreign key constraints. Schema changes are managed exclusively via **Alembic** (`backend/alembic/versions/`).

---

## Entities & Relationships

### 1. Access Control & Employees
- **`roles`**: `id (PK)`, `name (UNIQUE)`, `description`, `created_at`, `updated_at`.
  - Seeded roles: `ADMIN`, `MANAGER`, `SALES_EXECUTIVE`, `ACCOUNTANT`, `SUPPORT_OFFICER`.
- **`permissions`**: `id (PK)`, `code (UNIQUE)`, `module`, `description`, `created_at`.
- **`role_permissions`**: `id (PK)`, `role_id (FK -> roles.id CASCADE)`, `permission_id (FK -> permissions.id CASCADE)`, `UNIQUE(role_id, permission_id)`.
- **`employees`**: `id (PK)`, `employee_code (UNIQUE)`, `full_name`, `email (UNIQUE)`, `phone`, `password_hash` (Argon2id), `role_id (FK -> roles.id RESTRICT)`, `is_active`, `is_superuser`, `last_login_at`, `created_at`, `updated_at`.
- **`refresh_tokens`**: `id (PK)`, `employee_id (FK -> employees.id CASCADE)`, `token_hash (UNIQUE SHA-256)`, `jti (UNIQUE)`, `expires_at`, `revoked_at`, `replaced_by_jti`, `created_at`.

### 2. Projects & Property Inventory
- **`projects`**: `id (PK)`, `project_code (UNIQUE)`, `name`, `description`, `location`, `address`, `project_type`, `total_land_area (NUMERIC)`, `number_of_buildings`, `start_date`, `expected_completion_date`, `status`, `image_url`, `is_archived`, `created_by_id (FK -> employees.id RESTRICT)`, `created_at`, `updated_at`.
- **`inventory_units`**: `id (PK)`, `project_id (FK -> projects.id RESTRICT)`, `unit_number`, `building_name`, `floor_number`, `unit_type`, `bedrooms`, `bathrooms`, `size_sqft (NUMERIC > 0)`, `facing`, `base_price (NUMERIC >= 0)`, `additional_charges (NUMERIC)`, `discount (NUMERIC)`, `final_selling_price (NUMERIC >= 0)`, `description`, `status`, `created_at`, `updated_at`.
  - **Constraint**: `UNIQUE(project_id, unit_number)` (`uq_project_unit_number`).
- **`inventory_status_history`**: `id (PK)`, `inventory_unit_id (FK -> inventory_units.id CASCADE)`, `previous_status`, `new_status`, `changed_by_id (FK -> employees.id RESTRICT)`, `booking_id (FK -> bookings.id SET NULL)`, `reason`, `created_at`.

### 3. CRM (Customers & Leads)
- **`customers`**: `id (PK)`, `customer_code (UNIQUE)`, `full_name`, `phone`, `email`, `address`, `nationality`, `occupation`, `identification_reference`, `notes`, `assigned_sales_executive_id (FK -> employees.id SET NULL)`, `is_archived`, `created_by_id (FK -> employees.id RESTRICT)`, `created_at`, `updated_at`.
- **`leads`**: `id (PK)`, `lead_code (UNIQUE)`, `customer_name`, `contact_number`, `email`, `interested_project_id (FK -> projects.id SET NULL)`, `interested_unit_type`, `budget_min (NUMERIC)`, `budget_max (NUMERIC)`, `lead_source`, `assigned_employee_id (FK -> employees.id SET NULL)`, `follow_up_date`, `status`, `converted_customer_id (FK -> customers.id SET NULL)`, `notes`, `created_by_id (FK -> employees.id RESTRICT)`, `created_at`, `updated_at`.

### 4. Bookings & Financial Collections
- **`bookings`**: `id (PK)`, `booking_reference (UNIQUE)`, `customer_id (FK -> customers.id RESTRICT)`, `project_id (FK -> projects.id RESTRICT)`, `inventory_unit_id (FK -> inventory_units.id RESTRICT)`, `assigned_sales_executive_id (FK -> employees.id RESTRICT)`, `booking_date`, `unit_price_at_booking (NUMERIC)`, `discount (NUMERIC)`, `final_agreed_price (NUMERIC >= 0)`, `initial_booking_amount (NUMERIC >= 0)`, `payment_method`, `status`, `cancellation_reason`, `cancelled_by_id (FK -> employees.id SET NULL)`, `cancelled_at`, `notes`, `created_by_id (FK -> employees.id RESTRICT)`, `created_at`, `updated_at`.
  - **Concurrency Guard**: Partial unique index `uq_active_booking_per_unit` on `(inventory_unit_id)` `WHERE status IN ('Pending', 'Confirmed')`.
- **`booking_status_history`**: `id (PK)`, `booking_id (FK -> bookings.id CASCADE)`, `previous_status`, `new_status`, `changed_by_id (FK -> employees.id RESTRICT)`, `reason`, `created_at`.
- **`collections`**: `id (PK)`, `collection_reference (UNIQUE)`, `booking_id (FK -> bookings.id RESTRICT)`, `customer_id (FK -> customers.id RESTRICT)`, `payment_amount (NUMERIC != 0)`, `payment_date`, `payment_method`, `transaction_reference`, `payment_type`, `is_reversed`, `reversed_collection_id (FK -> collections.id RESTRICT)`, `notes`, `recorded_by_id (FK -> employees.id RESTRICT)`, `created_at`.

### 5. Support & Audit Trail
- **`complaints`**: `id (PK)`, `complaint_reference (UNIQUE)`, `customer_id (FK -> customers.id RESTRICT)`, `project_id (FK -> projects.id RESTRICT)`, `inventory_unit_id (FK -> inventory_units.id SET NULL)`, `subject`, `description`, `category`, `priority`, `assigned_employee_id (FK -> employees.id SET NULL)`, `status`, `resolution_details`, `resolved_at`, `created_by_id (FK -> employees.id RESTRICT)`, `created_at`, `updated_at`.
- **`complaint_status_history`**: `id (PK)`, `complaint_id (FK -> complaints.id CASCADE)`, `previous_status`, `new_status`, `previous_priority`, `new_priority`, `assigned_employee_id (FK -> employees.id SET NULL)`, `changed_by_id (FK -> employees.id RESTRICT)`, `note`, `created_at`.
- **`activity_logs`**: `id (PK)`, `employee_id (FK -> employees.id SET NULL)`, `action`, `entity_type`, `entity_id`, `metadata_json (JSON)`, `ip_address`, `created_at`.
