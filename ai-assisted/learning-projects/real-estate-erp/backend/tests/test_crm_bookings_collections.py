from concurrent.futures import ThreadPoolExecutor


def _seed_project_unit_customer(client, headers):
    proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "project_code": "PRJ-BKG",
            "name": "Booking Tower",
            "location": "Banani",
            "address": "Plot 88",
            "project_type": "Residential",
            "status": "Active",
        },
    ).json()

    unit = client.post(
        "/api/v1/inventory",
        headers=headers,
        json={
            "project_id": proj["id"],
            "unit_number": "B-202",
            "unit_type": "Apartment / Flat",
            "size_sqft": "1600.00",
            "base_price": "300000.00",
        },
    ).json()

    cust = client.post(
        "/api/v1/customers",
        headers=headers,
        json={"full_name": "Tariq Aziz", "phone": "+880-1700-112233", "email": "tariq@example.com"},
    ).json()
    return proj, unit, cust


def test_customer_duplicate_and_lead_conversion(client, admin_session):
    headers = admin_session["headers"]
    lead = client.post(
        "/api/v1/leads",
        headers=headers,
        json={
            "customer_name": "Farzana Haque",
            "contact_number": "+880-1712-998877",
            "email": "farzana@example.com",
            "status": "Qualified",
        },
    )
    assert lead.status_code == 201
    lead_id = lead.json()["id"]

    conv = client.post(
        f"/api/v1/leads/{lead_id}/convert",
        headers=headers,
        json={"occupation": "Doctor"},
    )
    assert conv.status_code == 200
    assert conv.json()["full_name"] == "Farzana Haque"

    # Duplicate customer phone triggers 409 unless confirm_duplicate=True
    dup = client.post(
        "/api/v1/customers",
        headers=headers,
        json={"full_name": "Farzana H", "phone": "+880-1712-998877"},
    )
    assert dup.status_code == 409


def test_booking_cancellation_collection_reversal_and_concurrency(client, admin_session):
    headers = admin_session["headers"]
    proj, unit, cust = _seed_project_unit_customer(client, headers)

    # Concurrent booking attempt simulation: only 1 may succeed
    def attempt_booking():
        return client.post(
            "/api/v1/bookings",
            headers=headers,
            json={
                "customer_id": cust["id"],
                "project_id": proj["id"],
                "inventory_unit_id": unit["id"],
                "discount": "10000.00",
                "initial_booking_amount": "50000.00",
                "payment_method": "Bank Transfer",
                "confirm_immediately": False,
            },
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt_booking(), range(2)))

    codes = sorted(r.status_code for r in results)
    assert codes == [201, 409], f"Expected one 201 and one 409, got {codes}"

    booking = next(r.json() for r in results if r.status_code == 201)
    assert booking["final_agreed_price"] == "290000.00"
    assert booking["total_collected"] == "50000.00"
    assert booking["outstanding_balance"] == "240000.00"

    # Unit should now be Reserved
    unit_after = client.get(f"/api/v1/inventory/{unit['id']}", headers=headers).json()
    assert unit_after["status"] == "Reserved"

    # Confirm booking -> unit becomes Booked
    conf = client.post(f"/api/v1/bookings/{booking['id']}/confirm", headers=headers)
    assert conf.status_code == 200
    assert conf.json()["status"] == "Confirmed"
    assert client.get(f"/api/v1/inventory/{unit['id']}", headers=headers).json()["status"] == "Booked"

    # Overpayment rejected
    overpay = client.post(
        "/api/v1/collections",
        headers=headers,
        json={
            "booking_id": booking["id"],
            "payment_amount": "250000.00",
            "payment_method": "Cash",
            "payment_type": "Partial Payment",
        },
    )
    assert overpay.status_code == 400

    # Valid partial payment
    pay = client.post(
        "/api/v1/collections",
        headers=headers,
        json={
            "booking_id": booking["id"],
            "payment_amount": "40000.00",
            "payment_method": "Bank Transfer",
            "payment_type": "Partial Payment",
        },
    )
    assert pay.status_code == 201
    col_id = pay.json()["id"]

    # Reverse payment -> balance restored
    rev = client.post(
        f"/api/v1/collections/{col_id}/reverse",
        headers=headers,
        json={"reason": "Cheque returned unpaid"},
    )
    assert rev.status_code == 200
    assert rev.json()["payment_type"] == "Reversal"

    bkg_check = client.get(f"/api/v1/bookings/{booking['id']}", headers=headers).json()
    assert bkg_check["total_collected"] == "50000.00"
    assert bkg_check["outstanding_balance"] == "240000.00"

    # Cancel booking -> unit restored to Available, historical collections preserved
    cancel_res = client.post(
        f"/api/v1/bookings/{booking['id']}/cancel",
        headers=headers,
        json={"reason": "Customer requested cancellation"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "Cancelled"
    assert client.get(f"/api/v1/inventory/{unit['id']}", headers=headers).json()["status"] == "Available"

    cols = client.get(f"/api/v1/collections?booking_id={booking['id']}", headers=headers).json()
    assert cols["total"] >= 2
