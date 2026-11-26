from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_client_ip, require_permission
from app.models.auth import Employee
from app.schemas.common import PaginatedResponse
from app.schemas.project_inventory import ProjectCreate, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PaginatedResponse[ProjectRead])
def list_projects(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    project_type: Optional[str] = Query(None),
    include_archived: bool = Query(False),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _actor: Employee = Depends(require_permission("projects:read")),
    db: Session = Depends(get_db),
):
    return project_service.list_projects(
        db,
        search=search,
        status=status_filter,
        project_type=project_type,
        include_archived=include_archived,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: uuid.UUID,
    _actor: Employee = Depends(require_permission("projects:read")),
    db: Session = Depends(get_db),
):
    return project_service.get_project(db, project_id)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    request: Request,
    actor: Employee = Depends(require_permission("projects:write")),
    db: Session = Depends(get_db),
):
    return project_service.create_project(db, payload, actor, ip_address=get_client_ip(request))


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    request: Request,
    actor: Employee = Depends(require_permission("projects:write")),
    db: Session = Depends(get_db),
):
    return project_service.update_project(db, project_id, payload, actor, ip_address=get_client_ip(request))


@router.post("/{project_id}/archive", response_model=ProjectRead)
def archive_project(
    project_id: uuid.UUID,
    request: Request,
    actor: Employee = Depends(require_permission("projects:write")),
    db: Session = Depends(get_db),
):
    return project_service.archive_project(db, project_id, actor, ip_address=get_client_ip(request))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    request: Request,
    actor: Employee = Depends(require_permission("projects:write")),
    db: Session = Depends(get_db),
):
    project_service.delete_project(db, project_id, actor, ip_address=get_client_ip(request))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
