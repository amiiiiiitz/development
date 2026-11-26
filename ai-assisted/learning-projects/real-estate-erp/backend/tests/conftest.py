import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import auth_rate_limiter
from app.main import app
from app.services.auth_service import ensure_roles_and_permissions

TEST_DB_URL = os.environ.get("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")


@pytest.fixture(scope="function")
def db_session():
    connect_args = {"check_same_thread": False} if TEST_DB_URL.startswith("sqlite") else {}
    engine_kwargs = {"poolclass": StaticPool} if ":memory:" in TEST_DB_URL else {}
    engine = create_engine(TEST_DB_URL, connect_args=connect_args, **engine_kwargs)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    ensure_roles_and_permissions(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="function")
def client(db_session):
    auth_rate_limiter._attempts.clear()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_session(client):
    res = client.post(
        "/api/v1/auth/setup",
        json={
            "full_name": "System Admin",
            "email": "admin@test-erp.local",
            "password": "AdminStrongPassword123!",
        },
    )
    assert res.status_code == 201
    data = res.json()
    return {
        "token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "employee": data["employee"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


def create_staff_and_login(client, admin_headers, role_name: str, email: str, full_name: str):
    password = "StaffStrongPassword123!"
    create_res = client.post(
        "/api/v1/employees",
        headers=admin_headers,
        json={
            "full_name": full_name,
            "email": email,
            "password": password,
            "role_name": role_name,
        },
    )
    assert create_res.status_code == 201, create_res.text
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200, login_res.text
    token = login_res.json()["access_token"]
    return {
        "employee": login_res.json()["employee"],
        "headers": {"Authorization": f"Bearer {token}"},
    }
