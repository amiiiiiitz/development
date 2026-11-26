from tests.conftest import create_staff_and_login


def test_initial_admin_setup_and_lockout(client):
    status_res = client.get("/api/v1/auth/setup-status")
    assert status_res.status_code == 200
    assert status_res.json()["needs_setup"] is True

    setup_res = client.post(
        "/api/v1/auth/setup",
        json={
            "full_name": "Primary Admin",
            "email": "admin@company.local",
            "password": "SuperSecurePassword123!",
        },
    )
    assert setup_res.status_code == 201
    assert setup_res.json()["employee"]["role_name"] == "ADMIN"

    # Second setup call must fail with 409 Conflict
    second = client.post(
        "/api/v1/auth/setup",
        json={
            "full_name": "Rogue Admin",
            "email": "rogue@company.local",
            "password": "SuperSecurePassword123!",
        },
    )
    assert second.status_code == 409


def test_refresh_token_rotation_and_reuse_detection(client, admin_session):
    rt1 = admin_session["refresh_token"]
    r1 = client.post("/api/v1/auth/refresh", json={"refresh_token": rt1})
    assert r1.status_code == 200
    rt2 = r1.json()["refresh_token"]
    assert rt2 != rt1

    # Reusing rotated rt1 must fail and revoke active family
    reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": rt1})
    assert reuse.status_code == 401

    # rt2 should now also be revoked because token reuse triggered revocation
    after_reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": rt2})
    assert after_reuse.status_code == 401


def test_deactivated_employee_cannot_access_protected_endpoints(client, admin_session):
    sales = create_staff_and_login(
        client, admin_session["headers"], "SALES_EXECUTIVE", "sales@company.local", "Sales Exec"
    )
    emp_id = sales["employee"]["id"]

    deact = client.patch(
        f"/api/v1/employees/{emp_id}",
        headers=admin_session["headers"],
        json={"is_active": False},
    )
    assert deact.status_code == 200
    assert deact.json()["is_active"] is False

    me_res = client.get("/api/v1/auth/me", headers=sales["headers"])
    assert me_res.status_code == 401


def test_role_based_access_control_enforcement(client, admin_session):
    sales = create_staff_and_login(
        client, admin_session["headers"], "SALES_EXECUTIVE", "sales2@company.local", "Sales Two"
    )
    accountant = create_staff_and_login(
        client, admin_session["headers"], "ACCOUNTANT", "acct@company.local", "Accounts Officer"
    )
    support = create_staff_and_login(
        client, admin_session["headers"], "SUPPORT_OFFICER", "sup@company.local", "Support Officer"
    )

    # Sales cannot create employees or access financial reports
    assert (
        client.post(
            "/api/v1/employees",
            headers=sales["headers"],
            json={
                "full_name": "Unauthorized",
                "email": "x@company.local",
                "password": "StrongPassword123!",
                "role_name": "ADMIN",
            },
        ).status_code
        == 403
    )
    assert client.get("/api/v1/reports/collection", headers=sales["headers"]).status_code == 403

    # Accountant cannot create projects
    assert (
        client.post(
            "/api/v1/projects",
            headers=accountant["headers"],
            json={
                "project_code": "PRJ-NO",
                "name": "Blocked Project",
                "location": "Dhaka",
                "address": "Road 1",
                "project_type": "Residential",
            },
        ).status_code
        == 403
    )

    # Support cannot record collections
    assert (
        client.post(
            "/api/v1/collections",
            headers=support["headers"],
            json={
                "booking_id": "00000000-0000-0000-0000-000000000000",
                "payment_amount": "1000.00",
                "payment_method": "Cash",
            },
        ).status_code
        == 403
    )
