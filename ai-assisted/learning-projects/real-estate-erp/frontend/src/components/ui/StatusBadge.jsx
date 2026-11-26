import React from 'react';

const TONE_MAP = {
  // Green / Nominal
  Active: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Available: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Confirmed: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Converted: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Resolved: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Completed: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  'Handover Complete': 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Sold: 'text-blue-800 bg-blue-50 border-blue-200',
  Booked: 'text-blue-800 bg-blue-50 border-blue-200',
  Qualified: 'text-blue-800 bg-blue-50 border-blue-200',
  // Amber / Pending
  Planning: 'text-amber-800 bg-amber-50 border-amber-200',
  Reserved: 'text-amber-800 bg-amber-50 border-amber-200',
  Pending: 'text-amber-800 bg-amber-50 border-amber-200',
  'On Hold': 'text-amber-800 bg-amber-50 border-amber-200',
  'In Progress': 'text-amber-800 bg-amber-50 border-amber-200',
  Contacted: 'text-amber-800 bg-amber-50 border-amber-200',
  Interested: 'text-amber-800 bg-amber-50 border-amber-200',
  Medium: 'text-amber-800 bg-amber-50 border-amber-200',
  High: 'text-orange-800 bg-orange-50 border-orange-200',
  // Crimson / Alert
  Cancelled: 'text-red-800 bg-red-50 border-red-200',
  Lost: 'text-red-800 bg-red-50 border-red-200',
  Critical: 'text-red-800 bg-red-50 border-red-200',
  Open: 'text-red-800 bg-red-50 border-red-200',
  Inactive: 'text-red-800 bg-red-50 border-red-200',
  Reversed: 'text-red-800 bg-red-50 border-red-200',
  // Neutral
  New: 'text-slate-700 bg-slate-100 border-slate-200',
  Low: 'text-slate-700 bg-slate-100 border-slate-200',
  Closed: 'text-slate-700 bg-slate-100 border-slate-200',
};

export function StatusBadge({ status }) {
  const cls = TONE_MAP[status] || 'text-slate-700 bg-slate-100 border-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cls}`}
    >
      {status}
    </span>
  );
}
