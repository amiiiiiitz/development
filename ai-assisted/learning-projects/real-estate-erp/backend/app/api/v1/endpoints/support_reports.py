from datetime import date
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_any_permission, require_permission
from app.models.auth import Employee
from app.models.support_audit import ActivityLog
from app.schemas.common import ActivityLogRead, PaginatedResponse
from app.schemas.support_reports import (
    ComplaintCreate,
    ComplaintRead,
    ComplaintUpdate,
    DashboardResponse,
    ReportResponse,
)
from app.services import complaint_service, dashboard_reports_service
from app.utils.helpers import calculate_pagination

complaints_router = APIRouter(prefix="/complaints", tags=["Complaints"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])
audit_router = APIRouter(prefix="/activity-logs", tags=["Audit Logs"])


@complaints_router.get("", response_model=PaginatedResponse[ComplaintRead])
def list_complaints(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    assigned_employee_id: Optional[uuid.UUID] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _actor: Employee = Depends(require_permission("complaints:read")),
    db: Session = Depends(get_db),
):
    return complaint_service.list_complaints(
        db,
        search=search,
        status=status_filter,
        priority=priority,
        customer_id=customer_id,
        assigned_employee_id=assigned_employee_id,
        project_id=project_id,
        page=page,
        page_size=page_size,
    )


@complaints_router.get("/{complaint_id}", response_model=ComplaintRead)
def get_complaint(
    complaint_id: uuid.UUID,
    _actor: Employee = Depends(require_permission("complaints:read")),
    db: Session = Depends(get_db),
):
    return complaint_service.get_complaint(db, complaint_id)


@complaints_router.post("", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreate,
    request: Request,
    actor: Employee = Depends(require_permission("complaints:write")),
    db: Session = Depends(get_db),
):
    return complaint_service.create_complaint(db, payload, actor, ip_address=get_client_ip(request))


@complaints_router.patch("/{complaint_id}", response_model=ComplaintRead)
def update_complaint(
    complaint_id: uuid.UUID,
    payload: ComplaintUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("complaints:write")),
    db: Session = Depends(get_db),
):
    return complaint_service.update_complaint(db, complaint_id, payload, actor, ip_address=get_client_ip(request))


@dashboard_router.get("", response_model=DashboardResponse)
def get_dashboard(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    actor: Employee = Depends(require_permission("dashboard:read")),
    db: Session = Depends(get_db),
):
    return dashboard_reports_service.get_dashboard_data(db, actor, start_date=start_date, end_date=end_date)


@reports_router.get("/{report_type}", response_model=ReportResponse)
def get_report(
    report_type: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    actor: Employee = Depends(require_any_permission("reports:operational", "reports:financial")),
    db: Session = Depends(get_db),
):
    return dashboard_reports_service.generate_report(
        db,
        report_type=report_type,
        actor=actor,
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
        customer_id=customer_id,
        status=status_filter,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@reports_router.get("/{report_type}/export")
def export_report_csv(
    report_type: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    customer_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    actor: Employee = Depends(require_any_permission("reports:operational", "reports:financial")),
    db: Session = Depends(get_db),
):
    report = dashboard_reports_service.generate_report(
        db,
        report_type=report_type,
        actor=actor,
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
        customer_id=customer_id,
        status=status_filter,
        search=search,
        export_all=True,
    )
    csv_text = dashboard_reports_service.report_to_csv(report)
    filename = f"real_estate_erp_{report_type}.csv"
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@audit_router.get("", response_model=PaginatedResponse[ActivityLogRead])
def list_activity_logs(
    entity_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    _actor: Employee = Depends(require_permission("activity_logs:read")),
    db: Session = Depends(get_db),
):
    query = db.query(ActivityLog).options(joinedload(ActivityLog.employee))
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    total = query.count()
    safe_page, total_pages = calculate_pagination(total, page, page_size)
    rows = (
        query.order_by(ActivityLog.created_at.desc())
        .offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [
            ActivityLogRead(
                id=str(r.id),
                employee_id=str(r.employee_id) if r.employee_id else None,
                employee_name=r.employee.full_name if r.employee else "System",
                action=r.action,
                entity_type=r.entity_type,
                entity_id=r.entity_id,
                metadata_json=r.metadata_json,
                ip_address=r.ip_address,
                created_at=r.created_at,
            )
            for r in rows
        ],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
