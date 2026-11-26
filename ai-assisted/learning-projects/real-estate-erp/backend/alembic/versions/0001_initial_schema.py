"""Initial Real Estate ERP schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_roles_name", "roles", ["name"], unique=True)

    op.create_table(
        "permissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("module", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_permissions_code", "permissions", ["code"], unique=True)
    op.create_index("ix_permissions_module", "permissions", ["module"], unique=False)

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("permission_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )
    op.create_index("ix_role_permissions_permission_id", "role_permissions", ["permission_id"])
    op.create_index("ix_role_permissions_role_id", "role_permissions", ["role_id"])

    op.create_table(
        "employees",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("employee_code", sa.String(length=30), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role_id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("employee_code"),
    )
    op.create_index("ix_employees_email", "employees", ["email"], unique=True)
    op.create_index("ix_employees_employee_code", "employees", ["employee_code"], unique=True)
    op.create_index("ix_employees_full_name", "employees", ["full_name"])
    op.create_index("ix_employees_is_active", "employees", ["is_active"])
    op.create_index("ix_employees_role_id", "employees", ["role_id"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("employee_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_jti", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_employee_id", "refresh_tokens", ["employee_id"])
    op.create_index("ix_refresh_tokens_jti", "refresh_tokens", ["jti"], unique=True)
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=180), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("project_type", sa.String(length=80), nullable=False),
        sa.Column("total_land_area", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("number_of_buildings", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("expected_completion_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_code"),
    )
    op.create_index("ix_projects_is_archived", "projects", ["is_archived"])
    op.create_index("ix_projects_location", "projects", ["location"])
    op.create_index("ix_projects_name", "projects", ["name"])
    op.create_index("ix_projects_project_code", "projects", ["project_code"], unique=True)
    op.create_index("ix_projects_project_type", "projects", ["project_type"])
    op.create_index("ix_projects_status", "projects", ["status"])

    op.create_table(
        "inventory_units",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("unit_number", sa.String(length=50), nullable=False),
        sa.Column("building_name", sa.String(length=100), nullable=True),
        sa.Column("floor_number", sa.Integer(), nullable=True),
        sa.Column("unit_type", sa.String(length=60), nullable=False),
        sa.Column("bedrooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("size_sqft", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("facing", sa.String(length=50), nullable=True),
        sa.Column("base_price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("additional_charges", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("discount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("final_selling_price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("base_price >= 0", name="ck_inventory_base_price_non_neg"),
        sa.CheckConstraint("final_selling_price >= 0", name="ck_inventory_final_price_non_neg"),
        sa.CheckConstraint("size_sqft > 0", name="ck_inventory_size_positive"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "unit_number", name="uq_project_unit_number"),
    )
    op.create_index("ix_inventory_units_final_selling_price", "inventory_units", ["final_selling_price"])
    op.create_index("ix_inventory_units_project_id", "inventory_units", ["project_id"])
    op.create_index("ix_inventory_units_status", "inventory_units", ["status"])
    op.create_index("ix_inventory_units_unit_number", "inventory_units", ["unit_number"])
    op.create_index("ix_inventory_units_unit_type", "inventory_units", ["unit_type"])

    op.create_table(
        "customers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_code", sa.String(length=30), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("nationality", sa.String(length=80), nullable=True),
        sa.Column("occupation", sa.String(length=120), nullable=True),
        sa.Column("identification_reference", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assigned_sales_executive_id", sa.Uuid(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_sales_executive_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_code"),
    )
    op.create_index("ix_customers_assigned_sales_executive_id", "customers", ["assigned_sales_executive_id"])
    op.create_index("ix_customers_customer_code", "customers", ["customer_code"], unique=True)
    op.create_index("ix_customers_email", "customers", ["email"])
    op.create_index("ix_customers_full_name", "customers", ["full_name"])
    op.create_index("ix_customers_is_archived", "customers", ["is_archived"])
    op.create_index("ix_customers_phone", "customers", ["phone"])

    op.create_table(
        "leads",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lead_code", sa.String(length=30), nullable=False),
        sa.Column("customer_name", sa.String(length=150), nullable=False),
        sa.Column("contact_number", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("interested_project_id", sa.Uuid(), nullable=True),
        sa.Column("interested_unit_type", sa.String(length=60), nullable=True),
        sa.Column("budget_min", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("budget_max", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("lead_source", sa.String(length=80), nullable=True),
        sa.Column("assigned_employee_id", sa.Uuid(), nullable=True),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("converted_customer_id", sa.Uuid(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_employee_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["converted_customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["interested_project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lead_code"),
    )
    op.create_index("ix_leads_assigned_employee_id", "leads", ["assigned_employee_id"])
    op.create_index("ix_leads_contact_number", "leads", ["contact_number"])
    op.create_index("ix_leads_customer_name", "leads", ["customer_name"])
    op.create_index("ix_leads_email", "leads", ["email"])
    op.create_index("ix_leads_follow_up_date", "leads", ["follow_up_date"])
    op.create_index("ix_leads_interested_project_id", "leads", ["interested_project_id"])
    op.create_index("ix_leads_lead_code", "leads", ["lead_code"], unique=True)
    op.create_index("ix_leads_status", "leads", ["status"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("booking_reference", sa.String(length=40), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("inventory_unit_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_sales_executive_id", sa.Uuid(), nullable=False),
        sa.Column("booking_date", sa.Date(), nullable=False),
        sa.Column("unit_price_at_booking", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("discount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("final_agreed_price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("initial_booking_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("cancelled_by_id", sa.Uuid(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("final_agreed_price >= 0", name="ck_booking_final_price_non_neg"),
        sa.CheckConstraint("initial_booking_amount >= 0", name="ck_booking_initial_amount_non_neg"),
        sa.ForeignKeyConstraint(["assigned_sales_executive_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["cancelled_by_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["inventory_unit_id"], ["inventory_units.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_reference"),
    )
    op.create_index("ix_bookings_assigned_sales_executive_id", "bookings", ["assigned_sales_executive_id"])
    op.create_index("ix_bookings_booking_date", "bookings", ["booking_date"])
    op.create_index("ix_bookings_booking_reference", "bookings", ["booking_reference"], unique=True)
    op.create_index("ix_bookings_customer_id", "bookings", ["customer_id"])
    op.create_index("ix_bookings_inventory_unit_id", "bookings", ["inventory_unit_id"])
    op.create_index("ix_bookings_project_id", "bookings", ["project_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index(
        "uq_active_booking_per_unit",
        "bookings",
        ["inventory_unit_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('Pending', 'Confirmed')"),
    )

    op.create_table(
        "inventory_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("inventory_unit_id", sa.Uuid(), nullable=False),
        sa.Column("previous_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=False),
        sa.Column("changed_by_id", sa.Uuid(), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["changed_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["inventory_unit_id"], ["inventory_units.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_status_history_created_at", "inventory_status_history", ["created_at"])
    op.create_index("ix_inventory_status_history_inventory_unit_id", "inventory_status_history", ["inventory_unit_id"])

    op.create_table(
        "booking_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=False),
        sa.Column("previous_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=False),
        sa.Column("changed_by_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_booking_status_history_booking_id", "booking_status_history", ["booking_id"])
    op.create_index("ix_booking_status_history_created_at", "booking_status_history", ["created_at"])

    op.create_table(
        "collections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("collection_reference", sa.String(length=40), nullable=False),
        sa.Column("booking_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("payment_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("transaction_reference", sa.String(length=120), nullable=True),
        sa.Column("payment_type", sa.String(length=40), nullable=False),
        sa.Column("is_reversed", sa.Boolean(), nullable=False),
        sa.Column("reversed_collection_id", sa.Uuid(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("payment_amount != 0", name="ck_collection_non_zero_amount"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["recorded_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["reversed_collection_id"], ["collections.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("collection_reference"),
    )
    op.create_index("ix_collections_booking_id", "collections", ["booking_id"])
    op.create_index("ix_collections_collection_reference", "collections", ["collection_reference"], unique=True)
    op.create_index("ix_collections_created_at", "collections", ["created_at"])
    op.create_index("ix_collections_customer_id", "collections", ["customer_id"])
    op.create_index("ix_collections_is_reversed", "collections", ["is_reversed"])
    op.create_index("ix_collections_payment_date", "collections", ["payment_date"])
    op.create_index("ix_collections_payment_method", "collections", ["payment_method"])
    op.create_index("ix_collections_payment_type", "collections", ["payment_type"])

    op.create_table(
        "complaints",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_reference", sa.String(length=40), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("inventory_unit_id", sa.Uuid(), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("priority", sa.String(length=30), nullable=False),
        sa.Column("assigned_employee_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("resolution_details", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_employee_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["inventory_unit_id"], ["inventory_units.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("complaint_reference"),
    )
    op.create_index("ix_complaints_assigned_employee_id", "complaints", ["assigned_employee_id"])
    op.create_index("ix_complaints_category", "complaints", ["category"])
    op.create_index("ix_complaints_complaint_reference", "complaints", ["complaint_reference"], unique=True)
    op.create_index("ix_complaints_customer_id", "complaints", ["customer_id"])
    op.create_index("ix_complaints_priority", "complaints", ["priority"])
    op.create_index("ix_complaints_project_id", "complaints", ["project_id"])
    op.create_index("ix_complaints_status", "complaints", ["status"])

    op.create_table(
        "complaint_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("complaint_id", sa.Uuid(), nullable=False),
        sa.Column("previous_status", sa.String(length=30), nullable=True),
        sa.Column("new_status", sa.String(length=30), nullable=False),
        sa.Column("previous_priority", sa.String(length=30), nullable=True),
        sa.Column("new_priority", sa.String(length=30), nullable=True),
        sa.Column("assigned_employee_id", sa.Uuid(), nullable=True),
        sa.Column("changed_by_id", sa.Uuid(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_employee_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["changed_by_id"], ["employees.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaint_status_history_complaint_id", "complaint_status_history", ["complaint_id"])
    op.create_index("ix_complaint_status_history_created_at", "complaint_status_history", ["created_at"])

    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("employee_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=60), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_logs_action", "activity_logs", ["action"])
    op.create_index("ix_activity_logs_created_at", "activity_logs", ["created_at"])
    op.create_index("ix_activity_logs_employee_id", "activity_logs", ["employee_id"])
    op.create_index("ix_activity_logs_entity_id", "activity_logs", ["entity_id"])
    op.create_index("ix_activity_logs_entity_type", "activity_logs", ["entity_type"])


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_table("complaint_status_history")
    op.drop_table("complaints")
    op.drop_table("collections")
    op.drop_table("booking_status_history")
    op.drop_table("inventory_status_history")
    op.drop_table("bookings")
    op.drop_table("leads")
    op.drop_table("customers")
    op.drop_table("inventory_units")
    op.drop_table("projects")
    op.drop_table("refresh_tokens")
    op.drop_table("employees")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")
