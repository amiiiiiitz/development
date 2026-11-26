# User Guide — Real Estate ERP

## 1. First-Time Login & Initial Setup
- When launching a fresh database, navigate to `/login`. The system detects no employee accounts exist and displays **Initial Administrator Setup**. Enter your name, work email, and a password (minimum 10 characters).
- Once initialized, employees sign in with their work email and password.

## 2. Operational Dashboard
- View real-time counts for projects, unit statuses (`Available`, `Reserved`, `Booked`, `Sold`), customers, leads, bookings, net collections, pending balances, and open complaints.
- Use the date-range filter at the top right to scope booking and collection trends.

## 3. Projects & Property Inventory
- **Projects**: Create developments, track timelines, and view aggregated unit availability and net revenue. Projects with linked records cannot be hard-deleted; use **Archive** instead.
- **Inventory**: Add units under projects (`Apartment / Flat`, `Residential Plot`, `Commercial Space`, `Office Space`, `Shop`). Unit numbers must be unique per project. Selling price is computed automatically from base price + additional charges - discount.

## 4. Customers & Sales Leads
- **Leads**: Track prospect inquiries from `New` through `Qualified`, `Converted`, or `Lost`. Click **Convert** on a qualified lead to create a Customer record atomically.
- **Customers**: Duplicate phone/email detection prevents accidental duplicate profiles unless explicitly confirmed. Click any customer row to inspect their 360° booking, payment, and complaint history.

## 5. Booking Workflow
1. Click **New Booking**.
2. Select a **Project** → only `Available` units in that project appear.
3. Select a **Customer**, review pricing, enter any discount and initial booking amount, and submit.
4. Leaving **Confirm immediately** unchecked places the booking in `Pending` and the unit in `Reserved`. Confirming transitions the booking to `Confirmed` and the unit to `Booked`.
5. **Cancellation**: Requires a cancellation reason. Restores the unit to `Available` while preserving the booking and any recorded payment entries. Units marked `Sold` cannot be cancelled.

## 6. Collections & Reversals
- Record `Booking Payment`, `Partial Payment`, `Other Payment`, or `Refund` entries against bookings.
- The system validates payments against the booking's live outstanding balance.
- Corrections use **Reverse**, which marks the original entry reversed and creates a compensating reversal entry without erasing financial history.

## 7. Complaints & Reporting
- **Complaints**: Log customer tickets, assign an officer, update priority/status, and enter resolution notes (mandatory for `Resolved` / `Closed`).
- **Reports**: Choose from 10 operational and financial reports (filtered by your role permissions), apply date/project/search filters, and click **Export CSV**.
