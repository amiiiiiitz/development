def test_complaints_dashboard_and_reports_csv(client, admin_session):
    headers = admin_session["headers"]
    proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "project_code": "PRJ-RPT",
            "name": "Report Heights",
            "location": "Uttara",
            "address": "Sector 4",
            "project_type": "Residential",
            "status": "Active",
        },
    ).json()
    cust = client.post(
        "/api/v1/customers",
        headers=headers,
        json={"full_name": "Nadia Islam", "phone": "+880-1711-000111"},
    ).json()

    cmp_res = client.post(
        "/api/v1/complaints",
        headers=headers,
        json={
            "customer_id": cust["id"],
            "project_id": proj["id"],
            "subject": "Water pressure issue",
            "description": "Low water pressure on 4th floor.",
            "category": "Plumbing",
            "priority": "High",
        },
    )
    assert cmp_res.status_code == 201
    cmp_id = cmp_res.json()["id"]

    # Resolving without resolution details must fail
    bad_resolve = client.patch(
        f"/api/v1/complaints/{cmp_id}",
        headers=headers,
        json={"status": "Resolved"},
    )
    assert bad_resolve.status_code == 400

    resolved = client.patch(
        f"/api/v1/complaints/{cmp_id}",
        headers=headers,
        json={"status": "Resolved", "resolution_details": "Booster pump calibrated."},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "Resolved"

    dash = client.get("/api/v1/dashboard", headers=headers)
    assert dash.status_code == 200
    assert dash.json()["kpis"]["total_projects"] == 1
    assert dash.json()["kpis"]["total_customers"] == 1

    for rpt in [
        "project_overview",
        "inventory_status",
        "project_inventory",
        "customer",
        "lead_status",
        "booking",
        "booking_cancellation",
        "collection",
        "outstanding_balance",
        "complaint",
    ]:
        r = client.get(f"/api/v1/reports/{rpt}", headers=headers)
        assert r.status_code == 200, f"Report {rpt} failed"

    csv_res = client.get("/api/v1/reports/complaint/export", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Water pressure issue" in csv_res.text
