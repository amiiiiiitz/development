from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.booking_collection import bookings_router, collections_router
from app.api.v1.endpoints.crm import customers_router, leads_router
from app.api.v1.endpoints.employees import router as employees_router
from app.api.v1.endpoints.inventory import router as inventory_router
from app.api.v1.endpoints.projects import router as projects_router
from app.api.v1.endpoints.support_reports import (
    audit_router,
    complaints_router,
    dashboard_router,
    reports_router,
)

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(projects_router)
api_router.include_router(inventory_router)
api_router.include_router(customers_router)
api_router.include_router(leads_router)
api_router.include_router(bookings_router)
api_router.include_router(collections_router)
api_router.include_router(complaints_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
