def test_project_and_inventory_lifecycle(client, admin_session):
    headers = admin_session["headers"]

    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "project_code": "PRJ-01",
            "name": "Emerald Residences",
            "location": "Gulshan",
            "address": "Plot 10, Road 55",
            "project_type": "Residential",
            "status": "Active",
        },
    )
    assert proj_res.status_code == 201
    project_id = proj_res.json()["id"]

    unit_res = client.post(
        "/api/v1/inventory",
        headers=headers,
        json={
            "project_id": project_id,
            "unit_number": "A-101",
            "unit_type": "Apartment / Flat",
            "size_sqft": "1500.00",
            "base_price": "200000.00",
            "additional_charges": "10000.00",
            "discount": "5000.00",
        },
    )
    assert unit_res.status_code == 201
    assert unit_res.json()["final_selling_price"] == "205000.00"
    unit_id = unit_res.json()["id"]

    # Duplicate unit number within same project rejected
    dup_unit = client.post(
        "/api/v1/inventory",
        headers=headers,
        json={
            "project_id": project_id,
            "unit_number": "A-101",
            "unit_type": "Apartment / Flat",
            "size_sqft": "1400.00",
            "base_price": "180000.00",
        },
    )
    assert dup_unit.status_code == 409

    # Arbitrary status jump to Sold without booking rejected
    bad_status = client.post(
        f"/api/v1/inventory/{unit_id}/status",
        headers=headers,
        json={"status": "Sold", "reason": "Trying to bypass booking"},
    )
    assert bad_status.status_code == 400

    # Project with inventory cannot be hard-deleted
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
    assert del_res.status_code == 409

    # Safe archival succeeds when no active bookings exist
    arch_res = client.post(f"/api/v1/projects/{project_id}/archive", headers=headers)
    assert arch_res.status_code == 200
    assert arch_res.json()["is_archived"] is True
