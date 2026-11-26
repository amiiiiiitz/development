from collections import defaultdict
import csv
from datetime import date, datetime, timezone
from decimal import Decimal
import io
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BusinessRuleError, ForbiddenError
from app.dependencies.auth import get_employee_permissions
from app.models.auth import Employee
from app.models.booking_collection import Booking, Collection
from app.models.crm import Customer, Lead
from app.models.project_inventory import InventoryUnit, Project
from app.models.support_audit import ActivityLog, Complaint
from app.schemas.support_reports import (
    ChartSeriesItem,
    DashboardKPIs,
    DashboardResponse,
    RecentActivityItem,
    ReportResponse,
)
from app.services.booking_service import compute_booking_financials
from app.utils.helpers import calculate_pagination


def get_dashboard_data(
    db: Session,
    actor: Employee,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> DashboardResponse:
    perms = set(get_employee_permissions(actor))
    can_view_collections = "collections:read" in perms or actor.is_superuser
    can_view_complaints = "complaints:read" in perms or actor.is_superuser
    can_view_leads = "leads:read" in perms or actor.is_superuser

    projects = db.query(Project).filter(Project.is_archived.is_(False)).all()
    units = db.query(InventoryUnit).options(joinedload(InventoryUnit.project)).all()
    customers_count = db.query(func.count(Customer.id)).filter(Customer.is_archived.is_(False)).scalar() or 0
    leads_count = (db.query(func.count(Lead.id)).scalar() or 0) if can_view_leads else 0

    booking_q = db.query(Booking).options(
        joinedload(Booking.customer),
        joinedload(Booking.project),
        joinedload(Booking.inventory_unit),
        joinedload(Booking.collections),
    )
    if start_date:
        booking_q = booking_q.filter(Booking.booking_date >= start_date)
    if end_date:
        booking_q = booking_q.filter(Booking.booking_date <= end_date)
    bookings = booking_q.all()
    active_bookings = [b for b in bookings if b.status != "Cancelled"]

    col_q = db.query(Collection).options(joinedload(Collection.customer), joinedload(Collection.booking))
    if start_date:
        col_q = col_q.filter(Collection.payment_date >= start_date)
    if end_date:
        col_q = col_q.filter(Collection.payment_date <= end_date)
    collections = col_q.all() if can_view_collections else []

    total_collected = sum(
        (
            Decimal(c.payment_amount)
            for c in collections
            if not c.is_reversed
            and c.payment_type in ("Booking Payment", "Partial Payment", "Other Payment")
        ),
        Decimal("0.00"),
    )
    total_refunded = sum(
        (
            Decimal(c.payment_amount)
            for c in collections
            if not c.is_reversed and c.payment_type == "Refund"
        ),
        Decimal("0.00"),
    )
    net_collected = total_collected - total_refunded
    pending_collections = (
        sum((compute_booking_financials(b)[2] for b in active_bookings), Decimal("0.00"))
        if can_view_collections
        else Decimal("0.00")
    )

    open_complaints_count = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.status.in_(["Open", "In Progress"]))
        .scalar()
        or 0
        if can_view_complaints
        else 0
    )

    status_counts = defaultdict(int)
    for u in units:
        status_counts[u.status] += 1

    kpis = DashboardKPIs(
        total_projects=len(projects),
        active_projects=sum(1 for p in projects if p.status == "Active"),
        total_units=len(units),
        available_units=status_counts["Available"],
        reserved_units=status_counts["Reserved"],
        booked_units=status_counts["Booked"],
        sold_units=status_counts["Sold"] + status_counts["Handover Complete"],
        total_customers=int(customers_count),
        total_leads=int(leads_count),
        total_bookings=len(active_bookings),
        total_collected_payments=net_collected if can_view_collections else Decimal("0.00"),
        pending_collections=pending_collections,
        open_complaints=int(open_complaints_count),
    )

    inv_dist = [
        ChartSeriesItem(label=st, value=status_counts[st])
        for st in ["Available", "Reserved", "Booked", "Sold", "Handover Complete", "Cancelled"]
        if status_counts[st] > 0 or st in ("Available", "Reserved", "Booked", "Sold")
    ]

    monthly_bookings_map: Dict[str, int] = defaultdict(int)
    monthly_booking_val_map: Dict[str, Decimal] = defaultdict(Decimal)
    for b in active_bookings:
        key = b.booking_date.strftime("%Y-%m")
        monthly_bookings_map[key] += 1
        monthly_booking_val_map[key] += Decimal(b.final_agreed_price)

    monthly_booking_trends = [
        ChartSeriesItem(
            label=k,
            value=monthly_bookings_map[k],
            secondary_value=float(monthly_booking_val_map[k]),
        )
        for k in sorted(monthly_bookings_map.keys())[-12:]
    ]

    monthly_col_map: Dict[str, Decimal] = defaultdict(Decimal)
    for c in collections:
        if c.is_reversed:
            continue
        key = c.payment_date.strftime("%Y-%m")
        if c.payment_type in ("Booking Payment", "Partial Payment", "Other Payment"):
            monthly_col_map[key] += Decimal(c.payment_amount)
        elif c.payment_type == "Refund":
            monthly_col_map[key] -= Decimal(c.payment_amount)

    monthly_collection_trends = [
        ChartSeriesItem(label=k, value=float(monthly_col_map[k]))
        for k in sorted(monthly_col_map.keys())[-12:]
    ]

    proj_overview_map: Dict[str, Dict[str, int]] = {}
    for p in projects:
        proj_overview_map[p.name] = {"available": 0, "reserved": 0, "booked": 0, "sold": 0, "total": 0}
    for u in units:
        pname = u.project.name if u.project else "Unknown"
        if pname not in proj_overview_map:
            proj_overview_map[pname] = {"available": 0, "reserved": 0, "booked": 0, "sold": 0, "total": 0}
        proj_overview_map[pname]["total"] += 1
        if u.status == "Available":
            proj_overview_map[pname]["available"] += 1
        elif u.status == "Reserved":
            proj_overview_map[pname]["reserved"] += 1
        elif u.status == "Booked":
            proj_overview_map[pname]["booked"] += 1
        elif u.status in ("Sold", "Handover Complete"):
            proj_overview_map[pname]["sold"] += 1

    project_inventory_overview = [
        ChartSeriesItem(
            label=name,
            value=counts["total"],
            available=counts["available"],
            reserved=counts["reserved"],
            booked=counts["booked"],
            sold=counts["sold"],
        )
        for name, counts in proj_overview_map.items()
    ]

    recent_bookings_rows = sorted(bookings, key=lambda x: x.created_at, reverse=True)[:5]
    recent_bookings = [
        {
            "id": str(b.id),
            "booking_reference": b.booking_reference,
            "customer_name": b.customer.full_name if b.customer else "",
            "project_name": b.project.name if b.project else "",
            "unit_number": b.inventory_unit.unit_number if b.inventory_unit else "",
            "final_agreed_price": str(b.final_agreed_price),
            "status": b.status,
            "booking_date": b.booking_date.isoformat(),
        }
        for b in recent_bookings_rows
    ]

    recent_customers_rows = (
        db.query(Customer)
        .filter(Customer.is_archived.is_(False))
        .order_by(Customer.created_at.desc())
        .limit(5)
        .all()
    )
    recent_customers = [
        {
            "id": str(c.id),
            "customer_code": c.customer_code,
            "full_name": c.full_name,
            "phone": c.phone,
            "email": c.email,
            "created_at": c.created_at.isoformat(),
        }
        for c in recent_customers_rows
    ]

    recent_collections_rows = sorted(collections, key=lambda x: x.created_at, reverse=True)[:5] if can_view_collections else []
    recent_collections = [
        {
            "id": str(c.id),
            "collection_reference": c.collection_reference,
            "customer_name": c.customer.full_name if c.customer else "",
            "payment_amount": str(c.payment_amount),
            "payment_method": c.payment_method,
            "payment_type": c.payment_type,
            "payment_date": c.payment_date.isoformat(),
        }
        for c in recent_collections_rows
    ]

    recent_complaints_rows = (
        db.query(Complaint)
        .options(joinedload(Complaint.customer))
        .order_by(Complaint.created_at.desc())
        .limit(5)
        .all()
        if can_view_complaints
        else []
    )
    recent_complaints = [
        {
            "id": str(cm.id),
            "complaint_reference": cm.complaint_reference,
            "customer_name": cm.customer.full_name if cm.customer else "",
            "subject": cm.subject,
            "priority": cm.priority,
            "status": cm.status,
            "created_at": cm.created_at.isoformat(),
        }
        for cm in recent_complaints_rows
    ]

    act_rows = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.employee))
        .order_by(ActivityLog.created_at.desc())
        .limit(8)
        .all()
    )
    recent_activities = [
        RecentActivityItem(
            id=str(a.id),
            action=a.action,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            employee_name=a.employee.full_name if a.employee else "System",
            summary=f"{a.action.replace('_', ' ').title()} ({a.entity_type})",
            created_at=a.created_at,
        )
        for a in act_rows
    ]

    return DashboardResponse(
        kpis=kpis,
        inventory_distribution=inv_dist,
        monthly_booking_trends=monthly_booking_trends,
        monthly_collection_trends=monthly_collection_trends,
        project_inventory_overview=project_inventory_overview,
        recent_bookings=recent_bookings,
        recent_customers=recent_customers,
        recent_collections=recent_collections,
        recent_complaints=recent_complaints,
        recent_activities=recent_activities,
    )


FINANCIAL_REPORTS = {"collection", "outstanding_balance"}
OPERATIONAL_REPORTS = {
    "project_overview",
    "inventory_status",
    "project_inventory",
    "customer",
    "lead_status",
    "booking",
    "booking_cancellation",
    "complaint",
}


def generate_report(
    db: Session,
    report_type: str,
    actor: Employee,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    project_id: Optional[uuid.UUID] = None,
    customer_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 50,
    export_all: bool = False,
) -> ReportResponse:
    perms = set(get_employee_permissions(actor))
    if report_type in FINANCIAL_REPORTS:
        if "reports:financial" not in perms and not actor.is_superuser:
            raise ForbiddenError("You do not have permission to access financial reports.")
    elif report_type in OPERATIONAL_REPORTS:
        if "reports:operational" not in perms and not actor.is_superuser:
            raise ForbiddenError("You do not have permission to access operational reports.")
    else:
        raise BusinessRuleError(f"Unknown report type '{report_type}'.")

    columns: List[Dict[str, str]] = []
    rows: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {}

    if report_type == "project_overview":
        columns = [
            {"key": "project_code", "label": "Project Code"},
            {"key": "name", "label": "Project Name"},
            {"key": "location", "label": "Location"},
            {"key": "project_type", "label": "Type"},
            {"key": "status", "label": "Status"},
            {"key": "total_units", "label": "Total Units"},
            {"key": "available_units", "label": "Available"},
            {"key": "booked_or_sold", "label": "Booked / Sold"},
            {"key": "active_booking_value", "label": "Booking Value"},
        ]
        q = db.query(Project).options(joinedload(Project.inventory_units)).filter(Project.is_archived.is_(False))
        if project_id:
            q = q.filter(Project.id == project_id)
        if status:
            q = q.filter(Project.status == status)
        projects = q.all()
        total_val = Decimal("0.00")
        for p in projects:
            units = p.inventory_units or []
            b_val = (
                db.query(func.coalesce(func.sum(Booking.final_agreed_price), Decimal("0.00")))
                .filter(Booking.project_id == p.id, Booking.status != "Cancelled")
                .scalar()
                or Decimal("0.00")
            )
            total_val += Decimal(b_val)
            rows.append({
                "project_code": p.project_code,
                "name": p.name,
                "location": p.location,
                "project_type": p.project_type,
                "status": p.status,
                "total_units": len(units),
                "available_units": sum(1 for u in units if u.status == "Available"),
                "booked_or_sold": sum(1 for u in units if u.status in ("Booked", "Sold", "Handover Complete")),
                "active_booking_value": str(Decimal(b_val)),
            })
        summary = {"total_projects": len(rows), "total_booking_value": str(total_val)}

    elif report_type == "inventory_status":
        columns = [
            {"key": "project_code", "label": "Project Code"},
            {"key": "project_name", "label": "Project"},
            {"key": "unit_number", "label": "Unit No"},
            {"key": "unit_type", "label": "Type"},
            {"key": "size_sqft", "label": "Size (Sqft)"},
            {"key": "final_selling_price", "label": "Price"},
            {"key": "status", "label": "Status"},
        ]
        q = db.query(InventoryUnit).options(joinedload(InventoryUnit.project))
        if project_id:
            q = q.filter(InventoryUnit.project_id == project_id)
        if status:
            q = q.filter(InventoryUnit.status == status)
        units = q.all()
        total_price = sum((Decimal(u.final_selling_price) for u in units), Decimal("0.00"))
        for u in units:
            rows.append({
                "project_code": u.project.project_code if u.project else "",
                "project_name": u.project.name if u.project else "",
                "unit_number": u.unit_number,
                "unit_type": u.unit_type,
                "size_sqft": str(u.size_sqft),
                "final_selling_price": str(u.final_selling_price),
                "status": u.status,
            })
        summary = {"total_units": len(rows), "total_inventory_value": str(total_price)}

    elif report_type == "project_inventory":
        columns = [
            {"key": "project_name", "label": "Project"},
            {"key": "available", "label": "Available"},
            {"key": "reserved", "label": "Reserved"},
            {"key": "booked", "label": "Booked"},
            {"key": "sold", "label": "Sold / Handover"},
            {"key": "cancelled", "label": "Cancelled"},
            {"key": "total", "label": "Total Units"},
        ]
        q = db.query(Project).options(joinedload(Project.inventory_units)).filter(Project.is_archived.is_(False))
        if project_id:
            q = q.filter(Project.id == project_id)
        for p in q.all():
            u = p.inventory_units or []
            rows.append({
                "project_name": p.name,
                "available": sum(1 for x in u if x.status == "Available"),
                "reserved": sum(1 for x in u if x.status == "Reserved"),
                "booked": sum(1 for x in u if x.status == "Booked"),
                "sold": sum(1 for x in u if x.status in ("Sold", "Handover Complete")),
                "cancelled": sum(1 for x in u if x.status == "Cancelled"),
                "total": len(u),
            })
        summary = {"projects_count": len(rows), "total_units": sum(r["total"] for r in rows)}

    elif report_type == "customer":
        columns = [
            {"key": "customer_code", "label": "Code"},
            {"key": "full_name", "label": "Full Name"},
            {"key": "phone", "label": "Phone"},
            {"key": "email", "label": "Email"},
            {"key": "sales_executive", "label": "Sales Executive"},
            {"key": "created_at", "label": "Registered"},
        ]
        q = db.query(Customer).options(joinedload(Customer.assigned_sales_executive)).filter(Customer.is_archived.is_(False))
        if customer_id:
            q = q.filter(Customer.id == customer_id)
        for c in q.all():
            rows.append({
                "customer_code": c.customer_code,
                "full_name": c.full_name,
                "phone": c.phone,
                "email": c.email or "",
                "sales_executive": c.assigned_sales_executive.full_name if c.assigned_sales_executive else "Unassigned",
                "created_at": c.created_at.date().isoformat(),
            })
        summary = {"total_customers": len(rows)}

    elif report_type == "lead_status":
        columns = [
            {"key": "lead_code", "label": "Lead Code"},
            {"key": "customer_name", "label": "Prospect"},
            {"key": "contact_number", "label": "Phone"},
            {"key": "interested_project", "label": "Project"},
            {"key": "lead_source", "label": "Source"},
            {"key": "assigned_employee", "label": "Assigned To"},
            {"key": "status", "label": "Status"},
            {"key": "follow_up_date", "label": "Follow-Up"},
        ]
        q = db.query(Lead).options(joinedload(Lead.interested_project), joinedload(Lead.assigned_employee))
        if project_id:
            q = q.filter(Lead.interested_project_id == project_id)
        if status:
            q = q.filter(Lead.status == status)
        for l in q.all():
            rows.append({
                "lead_code": l.lead_code,
                "customer_name": l.customer_name,
                "contact_number": l.contact_number,
                "interested_project": l.interested_project.name if l.interested_project else "-",
                "lead_source": l.lead_source or "-",
                "assigned_employee": l.assigned_employee.full_name if l.assigned_employee else "Unassigned",
                "status": l.status,
                "follow_up_date": l.follow_up_date.isoformat() if l.follow_up_date else "-",
            })
        summary = {"total_leads": len(rows), "converted": sum(1 for r in rows if r["status"] == "Converted")}

    elif report_type in ("booking", "booking_cancellation"):
        columns = [
            {"key": "booking_reference", "label": "Booking Ref"},
            {"key": "booking_date", "label": "Date"},
            {"key": "customer_name", "label": "Customer"},
            {"key": "project_name", "label": "Project"},
            {"key": "unit_number", "label": "Unit"},
            {"key": "final_agreed_price", "label": "Agreed Price"},
            {"key": "status", "label": "Status"},
            {"key": "cancellation_reason", "label": "Cancellation Reason"},
        ]
        q = db.query(Booking).options(
            joinedload(Booking.customer),
            joinedload(Booking.project),
            joinedload(Booking.inventory_unit),
        )
        if report_type == "booking_cancellation":
            q = q.filter(Booking.status == "Cancelled")
        elif status:
            q = q.filter(Booking.status == status)
        if project_id:
            q = q.filter(Booking.project_id == project_id)
        if customer_id:
            q = q.filter(Booking.customer_id == customer_id)
        if start_date:
            q = q.filter(Booking.booking_date >= start_date)
        if end_date:
            q = q.filter(Booking.booking_date <= end_date)
        bookings = q.all()
        total_agreed = Decimal("0.00")
        for b in bookings:
            if b.status != "Cancelled":
                total_agreed += Decimal(b.final_agreed_price)
            rows.append({
                "booking_reference": b.booking_reference,
                "booking_date": b.booking_date.isoformat(),
                "customer_name": b.customer.full_name if b.customer else "",
                "project_name": b.project.name if b.project else "",
                "unit_number": b.inventory_unit.unit_number if b.inventory_unit else "",
                "final_agreed_price": str(b.final_agreed_price),
                "status": b.status,
                "cancellation_reason": b.cancellation_reason or "-",
            })
        summary = {"total_records": len(rows), "active_booking_value": str(total_agreed)}

    elif report_type == "collection":
        columns = [
            {"key": "collection_reference", "label": "Receipt Ref"},
            {"key": "payment_date", "label": "Payment Date"},
            {"key": "booking_reference", "label": "Booking Ref"},
            {"key": "customer_name", "label": "Customer"},
            {"key": "payment_method", "label": "Method"},
            {"key": "payment_type", "label": "Type"},
            {"key": "payment_amount", "label": "Amount"},
            {"key": "is_reversed", "label": "Reversed"},
        ]
        q = db.query(Collection).options(
            joinedload(Collection.customer),
            joinedload(Collection.booking),
        ).join(Collection.booking)
        if project_id:
            q = q.filter(Booking.project_id == project_id)
        if customer_id:
            q = q.filter(Collection.customer_id == customer_id)
        if start_date:
            q = q.filter(Collection.payment_date >= start_date)
        if end_date:
            q = q.filter(Collection.payment_date <= end_date)
        cols = q.all()
        net = Decimal("0.00")
        for c in cols:
            if not c.is_reversed:
                if c.payment_type in ("Booking Payment", "Partial Payment", "Other Payment"):
                    net += Decimal(c.payment_amount)
                elif c.payment_type == "Refund":
                    net -= Decimal(c.payment_amount)
            rows.append({
                "collection_reference": c.collection_reference,
                "payment_date": c.payment_date.isoformat(),
                "booking_reference": c.booking.booking_reference if c.booking else "",
                "customer_name": c.customer.full_name if c.customer else "",
                "payment_method": c.payment_method,
                "payment_type": c.payment_type,
                "payment_amount": str(c.payment_amount),
                "is_reversed": "Yes" if c.is_reversed else "No",
            })
        summary = {"total_entries": len(rows), "net_collected": str(net)}

    elif report_type == "outstanding_balance":
        columns = [
            {"key": "booking_reference", "label": "Booking Ref"},
            {"key": "customer_name", "label": "Customer"},
            {"key": "project_name", "label": "Project"},
            {"key": "unit_number", "label": "Unit"},
            {"key": "final_agreed_price", "label": "Agreed Price"},
            {"key": "net_collected", "label": "Net Collected"},
            {"key": "outstanding_balance", "label": "Outstanding"},
        ]
        q = db.query(Booking).options(
            joinedload(Booking.customer),
            joinedload(Booking.project),
            joinedload(Booking.inventory_unit),
            joinedload(Booking.collections),
        ).filter(Booking.status != "Cancelled")
        if project_id:
            q = q.filter(Booking.project_id == project_id)
        if customer_id:
            q = q.filter(Booking.customer_id == customer_id)
        if start_date:
            q = q.filter(Booking.booking_date >= start_date)
        if end_date:
            q = q.filter(Booking.booking_date <= end_date)

        total_outstanding = Decimal("0.00")
        for b in q.all():
            collected, refunded, outstanding = compute_booking_financials(b)
            total_outstanding += outstanding
            rows.append({
                "booking_reference": b.booking_reference,
                "customer_name": b.customer.full_name if b.customer else "",
                "project_name": b.project.name if b.project else "",
                "unit_number": b.inventory_unit.unit_number if b.inventory_unit else "",
                "final_agreed_price": str(b.final_agreed_price),
                "net_collected": str(collected - refunded),
                "outstanding_balance": str(outstanding),
            })
        summary = {"active_bookings": len(rows), "total_outstanding": str(total_outstanding)}

    elif report_type == "complaint":
        columns = [
            {"key": "complaint_reference", "label": "Ticket Ref"},
            {"key": "customer_name", "label": "Customer"},
            {"key": "project_name", "label": "Project"},
            {"key": "subject", "label": "Subject"},
            {"key": "category", "label": "Category"},
            {"key": "priority", "label": "Priority"},
            {"key": "status", "label": "Status"},
            {"key": "created_at", "label": "Logged Date"},
        ]
        q = db.query(Complaint).options(joinedload(Complaint.customer), joinedload(Complaint.project))
        if project_id:
            q = q.filter(Complaint.project_id == project_id)
        if customer_id:
            q = q.filter(Complaint.customer_id == customer_id)
        if status:
            q = q.filter(Complaint.status == status)
        for cm in q.all():
            rows.append({
                "complaint_reference": cm.complaint_reference,
                "customer_name": cm.customer.full_name if cm.customer else "",
                "project_name": cm.project.name if cm.project else "",
                "subject": cm.subject,
                "category": cm.category,
                "priority": cm.priority,
                "status": cm.status,
                "created_at": cm.created_at.date().isoformat(),
            })
        summary = {
            "total_complaints": len(rows),
            "open_or_in_progress": sum(1 for r in rows if r["status"] in ("Open", "In Progress")),
        }

    if search:
        term = search.strip().lower()
        rows = [
            r for r in rows
            if any(term in str(v).lower() for v in r.values())
        ]

    if sort_by and rows and sort_by in rows[0]:
        rows.sort(key=lambda r: str(r.get(sort_by, "")), reverse=(sort_order == "desc"))

    total = len(rows)
    if export_all:
        paged_rows = rows
        safe_page = 1
        total_pages = 1
        effective_size = max(1, total)
    else:
        safe_page, total_pages = calculate_pagination(total, page, page_size)
        effective_size = page_size
        start_idx = (safe_page - 1) * page_size
        paged_rows = rows[start_idx : start_idx + page_size]

    return ReportResponse(
        report_type=report_type,
        generated_at=datetime.now(timezone.utc),
        summary=summary,
        columns=columns,
        rows=paged_rows,
        total=total,
        page=safe_page,
        page_size=effective_size,
        total_pages=total_pages,
    )


def report_to_csv(report: ReportResponse) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    headers = [col["label"] for col in report.columns]
    keys = [col["key"] for col in report.columns]
    writer.writerow(headers)
    for row in report.rows:
        writer.writerow([row.get(k, "") for k in keys])
    return output.getvalue()
