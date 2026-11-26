import argparse
from datetime import date, timedelta
from decimal import Decimal
import getpass
import os
import secrets
import sys

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.permissions import RoleName
from app.core.security import hash_password
from app.models.auth import Employee, Role
from app.models.booking_collection import Booking, BookingStatusHistory, Collection
from app.models.crm import Customer, Lead
from app.models.project_inventory import InventoryStatusHistory, InventoryUnit, Project
from app.models.support_audit import Complaint, ComplaintStatusHistory
from app.services.audit_service import record_activity
from app.services.auth_service import ensure_roles_and_permissions


def cmd_create_admin(args) -> None:
    db = SessionLocal()
    try:
        ensure_roles_and_permissions(db)
        email = args.email.lower().strip()
        if db.query(Employee).filter(Employee.email == email).first():
            print(f"Error: Employee with email '{email}' already exists.", file=sys.stderr)
            sys.exit(1)

        password = args.password or os.environ.get("INITIAL_ADMIN_PASSWORD")
        if not password:
            password = getpass.getpass("Enter administrator password (min 10 chars): ")
            confirm = getpass.getpass("Confirm administrator password: ")
            if password != confirm:
                print("Error: Passwords do not match.", file=sys.stderr)
                sys.exit(1)
        if len(password) < 10:
            print("Error: Password must be at least 10 characters.", file=sys.stderr)
            sys.exit(1)

        admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN.value).first()
        emp = Employee(
            employee_code=args.code or "EMP-0001",
            full_name=args.name.strip(),
            email=email,
            phone=args.phone,
            password_hash=hash_password(password),
            role_id=admin_role.id,
            is_active=True,
            is_superuser=True,
        )
        db.add(emp)
        db.flush()
        record_activity(
            db,
            employee_id=emp.id,
            action="CLI_ADMIN_CREATED",
            entity_type="employee",
            entity_id=emp.id,
            metadata={"email": email},
        )
        db.commit()
        print(f"Administrator created successfully: {emp.email} ({emp.employee_code})")
    finally:
        db.close()


def cmd_seed_dev(_args) -> None:
    settings = get_settings()
    if settings.ENVIRONMENT != "development":
        print("Error: seed-dev is strictly restricted to ENVIRONMENT=development.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        ensure_roles_and_permissions(db)
        if db.query(Project).first():
            print("Database already contains project records. Skipping dev seed.")
            return

        roles = {r.name: r for r in db.query(Role).all()}
        dev_password = os.environ.get("DEV_SEED_PASSWORD") or f"DevSeed!{secrets.token_hex(4)}"

        staff_specs = [
            ("EMP-0001", "Amina Rahman", "admin@example.com", RoleName.ADMIN.value, True),
    ("EMP-0002", "Tariq Mahmud", "manager@example.com", RoleName.MANAGER.value, False),
    ("EMP-0003", "Nadia Karim", "sales@example.com", RoleName.SALES_EXECUTIVE.value, False),
    ("EMP-0004", "Farhan Siddiqui", "accounts@example.com", RoleName.ACCOUNTANT.value, False),
    ("EMP-0005", "Sadia Chowdhury", "support@example.com", RoleName.SUPPORT_OFFICER.value, False),
        ]
        employees = {}
        for code, name, email, role_name, is_super in staff_specs:
            existing = db.query(Employee).filter(Employee.email == email).first()
            if existing:
                employees[role_name] = existing
                continue
            emp = Employee(
                employee_code=code,
                full_name=name,
                email=email,
                phone="+880-1700-000000",
                password_hash=hash_password(dev_password),
                role_id=roles[role_name].id,
                is_active=True,
                is_superuser=is_super,
            )
            db.add(emp)
            db.flush()
            employees[role_name] = emp

        admin = employees[RoleName.ADMIN.value]
        sales = employees[RoleName.SALES_EXECUTIVE.value]
        accounts = employees[RoleName.ACCOUNTANT.value]
        support = employees[RoleName.SUPPORT_OFFICER.value]

        p1 = Project(
            project_code="PRJ-SKY-01",
            name="[SAMPLE] Skyline Heights Residences",
            description="Sample luxury residential tower in Gulshan North.",
            location="Gulshan North",
            address="Plot 42, Road 112, Gulshan-2",
            project_type="Residential High-Rise",
            total_land_area=Decimal("28500.00"),
            number_of_buildings=2,
            start_date=date.today() - timedelta(days=240),
            expected_completion_date=date.today() + timedelta(days=480),
            status="Active",
            created_by_id=admin.id,
        )
        p2 = Project(
            project_code="PRJ-COM-02",
            name="[SAMPLE] Harbour Commercial Plaza",
            description="Sample Grade-A commercial offices and retail spaces.",
            location="Banani Central",
            address="Plot 18, Kemal Ataturk Avenue",
            project_type="Commercial Complex",
            total_land_area=Decimal("19000.00"),
            number_of_buildings=1,
            start_date=date.today() - timedelta(days=150),
            expected_completion_date=date.today() + timedelta(days=540),
            status="Active",
            created_by_id=admin.id,
        )
        db.add_all([p1, p2])
        db.flush()

        units_data = [
            (p1.id, "A-101", "Tower A", 1, "Apartment / Flat", 3, 3, Decimal("1850"), "South", Decimal("240000"), "Booked"),
            (p1.id, "A-102", "Tower A", 1, "Apartment / Flat", 3, 3, Decimal("1920"), "East", Decimal("255000"), "Available"),
            (p1.id, "A-201", "Tower A", 2, "Apartment / Flat", 4, 4, Decimal("2450"), "South-East", Decimal("335000"), "Reserved"),
            (p1.id, "B-301", "Tower B", 3, "Apartment / Flat", 2, 2, Decimal("1350"), "North", Decimal("175000"), "Sold"),
            (p2.id, "C-101", "Main Plaza", 1, "Shop", None, 1, Decimal("850"), "Main Road", Decimal("210000"), "Available"),
            (p2.id, "C-402", "Main Plaza", 4, "Office Space", None, 2, Decimal("2200"), "East", Decimal("390000"), "Available"),
        ]
        units = []
        for pid, unum, bldg, flr, utype, beds, baths, sqft, facing, price, st in units_data:
            u = InventoryUnit(
                project_id=pid,
                unit_number=unum,
                building_name=bldg,
                floor_number=flr,
                unit_type=utype,
                bedrooms=beds,
                bathrooms=baths,
                size_sqft=sqft,
                facing=facing,
                base_price=price,
                additional_charges=Decimal("5000.00"),
                discount=Decimal("0.00"),
                final_selling_price=price + Decimal("5000.00"),
                description=f"[SAMPLE] {utype} unit {unum}",
                status=st,
            )
            db.add(u)
            db.flush()
            db.add(
                InventoryStatusHistory(
                    inventory_unit_id=u.id,
                    previous_status=None,
                    new_status=st,
                    changed_by_id=admin.id,
                    reason="[SAMPLE] Initial dev seed",
                )
            )
            units.append(u)

        c1 = Customer(
            customer_code="CUST-DEV-001",
            full_name="[SAMPLE] Kamrul Hasan",
            phone="+880-1711-223344",
            email="kamrul.sample@example.com",
            address="House 14, Dhanmondi",
            occupation="Architect",
            assigned_sales_executive_id=sales.id,
            created_by_id=sales.id,
        )
        c2 = Customer(
            customer_code="CUST-DEV-002",
            full_name="[SAMPLE] Nusrat Jahan",
            phone="+880-1811-556677",
            email="nusrat.sample@example.com",
            address="Road 9, Uttara",
            occupation="Physician",
            assigned_sales_executive_id=sales.id,
            created_by_id=sales.id,
        )
        db.add_all([c1, c2])
        db.flush()

        l1 = Lead(
            lead_code="LEAD-DEV-001",
            customer_name="[SAMPLE] Rafiqul Islam",
            contact_number="+880-1911-889900",
            email="rafiq.sample@example.com",
            interested_project_id=p2.id,
            interested_unit_type="Office Space",
            budget_min=Decimal("300000"),
            budget_max=Decimal("420000"),
            lead_source="Website Inquiry",
            assigned_employee_id=sales.id,
            follow_up_date=date.today() + timedelta(days=3),
            status="Qualified",
            created_by_id=sales.id,
        )
        db.add(l1)

        b1 = Booking(
            booking_reference="BKG-DEV-0001",
            customer_id=c1.id,
            project_id=p1.id,
            inventory_unit_id=units[0].id,
            assigned_sales_executive_id=sales.id,
            booking_date=date.today() - timedelta(days=20),
            unit_price_at_booking=units[0].final_selling_price,
            discount=Decimal("5000.00"),
            final_agreed_price=units[0].final_selling_price - Decimal("5000.00"),
            initial_booking_amount=Decimal("50000.00"),
            payment_method="Bank Transfer",
            status="Confirmed",
            notes="[SAMPLE] Confirmed residential unit booking",
            created_by_id=sales.id,
        )
        b2 = Booking(
            booking_reference="BKG-DEV-0002",
            customer_id=c2.id,
            project_id=p1.id,
            inventory_unit_id=units[2].id,
            assigned_sales_executive_id=sales.id,
            booking_date=date.today() - timedelta(days=5),
            unit_price_at_booking=units[2].final_selling_price,
            discount=Decimal("0.00"),
            final_agreed_price=units[2].final_selling_price,
            initial_booking_amount=Decimal("25000.00"),
            payment_method="Cheque",
            status="Pending",
            notes="[SAMPLE] Pending confirmation booking",
            created_by_id=sales.id,
        )
        db.add_all([b1, b2])
        db.flush()

        db.add_all([
            BookingStatusHistory(booking_id=b1.id, previous_status=None, new_status="Confirmed", changed_by_id=sales.id, reason="[SAMPLE] Seeded confirmed"),
            BookingStatusHistory(booking_id=b2.id, previous_status=None, new_status="Pending", changed_by_id=sales.id, reason="[SAMPLE] Seeded pending"),
            Collection(
                collection_reference="COL-DEV-0001",
                booking_id=b1.id,
                customer_id=c1.id,
                payment_amount=Decimal("50000.00"),
                payment_date=date.today() - timedelta(days=20),
                payment_method="Bank Transfer",
                transaction_reference="TXN-DEV-9001",
                payment_type="Booking Payment",
                recorded_by_id=accounts.id,
            ),
            Collection(
                collection_reference="COL-DEV-0002",
                booking_id=b1.id,
                customer_id=c1.id,
                payment_amount=Decimal("75000.00"),
                payment_date=date.today() - timedelta(days=7),
                payment_method="Bank Transfer",
                transaction_reference="TXN-DEV-9044",
                payment_type="Partial Payment",
                recorded_by_id=accounts.id,
            ),
            Collection(
                collection_reference="COL-DEV-0003",
                booking_id=b2.id,
                customer_id=c2.id,
                payment_amount=Decimal("25000.00"),
                payment_date=date.today() - timedelta(days=5),
                payment_method="Cheque",
                transaction_reference="CHQ-4410",
                payment_type="Booking Payment",
                recorded_by_id=accounts.id,
            ),
        ])

        cmp1 = Complaint(
            complaint_reference="CMP-DEV-0001",
            customer_id=c1.id,
            project_id=p1.id,
            inventory_unit_id=units[0].id,
            subject="[SAMPLE] Balcony railing inspection request",
            description="Customer requested pre-handover quality inspection of balcony railing alignment.",
            category="Construction Quality",
            priority="Medium",
            assigned_employee_id=support.id,
            status="In Progress",
            created_by_id=support.id,
        )
        db.add(cmp1)
        db.flush()
        db.add(
            ComplaintStatusHistory(
                complaint_id=cmp1.id,
                previous_status=None,
                new_status="In Progress",
                new_priority="Medium",
                assigned_employee_id=support.id,
                changed_by_id=support.id,
                note="[SAMPLE] Assigned to engineering liaison",
            )
        )
        db.commit()
        print("Development sample data seeded successfully.")
        print(f"Generated dev password for sample staff accounts: {dev_password}")
        for _, _, email, role_name, _ in staff_specs:
            print(f"  - {role_name}: {email}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Real Estate ERP Management CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    admin_p = sub.add_parser("create-admin", help="Create an initial system administrator")
    admin_p.add_argument("--name", required=True, help="Full name")
    admin_p.add_argument("--email", required=True, help="Email address")
    admin_p.add_argument("--phone", default=None, help="Phone number")
    admin_p.add_argument("--code", default=None, help="Employee code")
    admin_p.add_argument("--password", default=None, help="Password (prefer prompt or INITIAL_ADMIN_PASSWORD env)")
    admin_p.set_defaults(func=cmd_create_admin)

    seed_p = sub.add_parser("seed-dev", help="Seed clearly labeled [SAMPLE] development records")
    seed_p.set_defaults(func=cmd_seed_dev)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
