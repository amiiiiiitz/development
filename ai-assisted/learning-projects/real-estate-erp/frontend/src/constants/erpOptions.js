export const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];

export const UNIT_TYPES = [
  'Apartment / Flat',
  'Residential Plot',
  'Commercial Space',
  'Office Space',
  'Shop',
];

export const INVENTORY_STATUSES = [
  'Available',
  'Reserved',
  'Booked',
  'Sold',
  'Handover Complete',
  'Cancelled',
];

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Qualified',
  'Converted',
  'Lost',
];

export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Mobile Financial Service',
  'Other',
];

export const PAYMENT_TYPES = [
  'Booking Payment',
  'Partial Payment',
  'Other Payment',
  'Refund',
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const COMPLAINT_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const EMPLOYEE_ROLES = [
  { value: 'ADMIN', label: 'System Administrator' },
  { value: 'MANAGER', label: 'Operations Manager' },
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
  { value: 'ACCOUNTANT', label: 'Accounts / Collection Officer' },
  { value: 'SUPPORT_OFFICER', label: 'Customer Support Officer' },
];

export const REPORT_TYPES = [
  { key: 'project_overview', label: 'Project Overview Report', category: 'Operational' },
  { key: 'inventory_status', label: 'Inventory Status Report', category: 'Operational' },
  { key: 'project_inventory', label: 'Project-Wise Inventory Report', category: 'Operational' },
  { key: 'customer', label: 'Customer Directory Report', category: 'Operational' },
  { key: 'lead_status', label: 'Lead Pipeline Report', category: 'Operational' },
  { key: 'booking', label: 'Booking Ledger Report', category: 'Operational' },
  { key: 'booking_cancellation', label: 'Booking Cancellation Report', category: 'Operational' },
  { key: 'collection', label: 'Collection Receipt Report', category: 'Financial' },
  { key: 'outstanding_balance', label: 'Outstanding Balance Report', category: 'Financial' },
  { key: 'complaint', label: 'Customer Complaint Report', category: 'Operational' },
];
