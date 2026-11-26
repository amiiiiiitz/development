from enum import Enum
from typing import Dict, List, Tuple


class RoleName(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    SALES_EXECUTIVE = "SALES_EXECUTIVE"
    ACCOUNTANT = "ACCOUNTANT"
    SUPPORT_OFFICER = "SUPPORT_OFFICER"


PERMISSIONS: List[Tuple[str, str, str]] = [
    # Dashboard
    ("dashboard:read", "dashboard", "View operational dashboard metrics and charts"),
    # Employees
    ("employees:read", "employees", "View employee directory"),
    ("employees:manage", "employees", "Create, edit, activate, and deactivate employees"),
    # Projects
    ("projects:read", "projects", "View real estate projects"),
    ("projects:write", "projects", "Create, edit, and archive projects"),
    # Inventory
    ("inventory:read", "inventory", "View property inventory units"),
    ("inventory:write", "inventory", "Create and edit property inventory units"),
    # Customers & Leads
    ("customers:read", "customers", "View customers"),
    ("customers:write", "customers", "Create and update customers"),
    ("leads:read", "leads", "View sales leads"),
    ("leads:write", "leads", "Create, update, assign, and convert sales leads"),
    # Bookings
    ("bookings:read", "bookings", "View property bookings"),
    ("bookings:write", "bookings", "Create and confirm property bookings"),
    ("bookings:cancel", "bookings", "Cancel active property bookings"),
    # Collections
    ("collections:read", "collections", "View payment collections and balances"),
    ("collections:write", "collections", "Record manual payment collections"),
    ("collections:reverse", "collections", "Reverse or adjust recorded collection entries"),
    # Complaints
    ("complaints:read", "complaints", "View customer complaints"),
    ("complaints:write", "complaints", "Create, assign, and update customer complaints"),
    # Reports
    ("reports:operational", "reports", "View and export operational reports"),
    ("reports:financial", "reports", "View and export financial collection and balance reports"),
    # Activity Logs
    ("activity_logs:read", "audit", "View system audit logs"),
]

ALL_PERMISSION_CODES = [code for code, _, _ in PERMISSIONS]

ROLE_PERMISSION_MAP: Dict[str, List[str]] = {
    RoleName.ADMIN.value: ALL_PERMISSION_CODES,
    RoleName.MANAGER.value: [
        "dashboard:read",
        "employees:read",
        "projects:read",
        "projects:write",
        "inventory:read",
        "inventory:write",
        "customers:read",
        "customers:write",
        "leads:read",
        "leads:write",
        "bookings:read",
        "bookings:write",
        "bookings:cancel",
        "collections:read",
        "complaints:read",
        "complaints:write",
        "reports:operational",
        "reports:financial",
        "activity_logs:read",
    ],
    RoleName.SALES_EXECUTIVE.value: [
        "dashboard:read",
        "projects:read",
        "inventory:read",
        "customers:read",
        "customers:write",
        "leads:read",
        "leads:write",
        "bookings:read",
        "bookings:write",
        "reports:operational",
    ],
    RoleName.ACCOUNTANT.value: [
        "dashboard:read",
        "projects:read",
        "inventory:read",
        "customers:read",
        "bookings:read",
        "collections:read",
        "collections:write",
        "collections:reverse",
        "reports:financial",
    ],
    RoleName.SUPPORT_OFFICER.value: [
        "dashboard:read",
        "projects:read",
        "inventory:read",
        "customers:read",
        "complaints:read",
        "complaints:write",
        "reports:operational",
    ],
}

ROLE_DESCRIPTIONS: Dict[str, str] = {
    RoleName.ADMIN.value: "Full system administrator with employee, role, operational, and financial access.",
    RoleName.MANAGER.value: "Operations manager with authority over projects, inventory, CRM, bookings, complaints, and summaries.",
    RoleName.SALES_EXECUTIVE.value: "Sales executive managing assigned leads, customers, available inventory, and bookings.",
    RoleName.ACCOUNTANT.value: "Accounts and collection officer recording payments, reversals, and financial reports.",
    RoleName.SUPPORT_OFFICER.value: "Customer support officer managing customer complaints and resolution tracking.",
}
