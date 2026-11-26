import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../../services/erpServices';
import { PageHeader, ErrorState } from '../../components/common/CommonStates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import {
  extractApiError,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from '../../utils/formatters';

const PIE_COLORS = ['#16a34a', '#d97706', '#1d4ed8', '#0f172a', '#0d9488', '#dc2626'];

export function DashboardPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () =>
      dashboardService.get({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  const kpis = data?.kpis;

  const statItems = kpis
    ? [
        { label: 'Total Projects', value: formatNumber(kpis.total_projects), sub: `${kpis.active_projects} active` },
        { label: 'Inventory Units', value: formatNumber(kpis.total_units), sub: `${kpis.available_units} available · ${kpis.reserved_units} reserved` },
        { label: 'Booked & Sold', value: formatNumber(kpis.booked_units + kpis.sold_units), sub: `${kpis.booked_units} booked · ${kpis.sold_units} sold` },
        { label: 'Customers & Leads', value: formatNumber(kpis.total_customers), sub: `${kpis.total_leads} active leads` },
        { label: 'Active Bookings', value: formatNumber(kpis.total_bookings), sub: 'Pending & confirmed' },
        { label: 'Collected Payments', value: formatCurrency(kpis.total_collected_payments), sub: 'Net valid receipts' },
        { label: 'Pending Collections', value: formatCurrency(kpis.pending_collections), sub: 'Outstanding balance' },
        { label: 'Open Complaints', value: formatNumber(kpis.open_complaints), sub: 'Open & in progress' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Dashboard"
        description="Real-time overview of projects, inventory allocation, bookings, collections, and support activity."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Filter start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="Filter end date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
            />
            {(startDate || endDate) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <ErrorState
          message={extractApiError(error)}
          onRetry={refetch}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white p-4" />
          ))}
        </div>
      ) : kpis ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
              </div>
            ))}
          </section>

          {/* Charts Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Inventory Status Distribution
              </h2>
              {data.inventory_distribution?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.inventory_distribution}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={86}
                        paddingAngle={2}
                      >
                        {data.inventory_distribution.map((entry, idx) => (
                          <Cell key={entry.label} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-xs text-slate-500">
                  No inventory units registered yet.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Project-Wise Inventory Overview
              </h2>
              {data.project_inventory_overview?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.project_inventory_overview}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="available" name="Available" stackId="a" fill="#16a34a" />
                      <Bar dataKey="reserved" name="Reserved" stackId="a" fill="#d97706" />
                      <Bar dataKey="booked" name="Booked" stackId="a" fill="#1d4ed8" />
                      <Bar dataKey="sold" name="Sold" stackId="a" fill="#0f172a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-xs text-slate-500">
                  No active project inventory to chart.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Monthly Booking Trends
              </h2>
              {data.monthly_booking_trends?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthly_booking_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Bookings"
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-xs text-slate-500">
                  No booking records in the selected period.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Monthly Collection Trends
              </h2>
              {data.monthly_collection_trends?.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly_collection_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Bar dataKey="value" name="Net Collected" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-xs text-slate-500">
                  No collection entries recorded in the selected period.
                </p>
              )}
            </div>
          </section>

          {/* Recent Lists */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Recent Bookings</h2>
                <Link to="/bookings" className="text-xs font-medium text-blue-700 hover:underline">
                  View all
                </Link>
              </div>
              {data.recent_bookings?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.recent_bookings.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <Link
                          to={`/bookings/${b.id}`}
                          className="font-mono font-medium text-slate-900 hover:text-blue-700"
                        >
                          {b.booking_reference}
                        </Link>
                        <p className="text-slate-500 truncate">
                          {b.customer_name} · {b.project_name} ({b.unit_number})
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className="font-mono tabular-nums font-medium text-slate-900">
                          {formatCurrency(b.final_agreed_price)}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-slate-500">No bookings recorded yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Recent Collections</h2>
                <Link to="/collections" className="text-xs font-medium text-blue-700 hover:underline">
                  View all
                </Link>
              </div>
              {data.recent_collections?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.recent_collections.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-slate-900">
                          {c.collection_reference}
                        </p>
                        <p className="text-slate-500 truncate">
                          {c.customer_name} · {c.payment_method} · {formatDate(c.payment_date)}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                        {formatCurrency(c.payment_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-slate-500">No collection entries yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Recent Customers</h2>
                <Link to="/customers" className="text-xs font-medium text-blue-700 hover:underline">
                  View directory
                </Link>
              </div>
              {data.recent_customers?.length ? (
                <div className="divide-y divide-slate-100">
                  {data.recent_customers.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-medium text-slate-900 hover:text-blue-700"
                        >
                          {c.full_name}
                        </Link>
                        <p className="text-slate-500 truncate">
                          {c.customer_code} · {c.phone}
                        </p>
                      </div>
                      <span className="text-slate-500 font-mono shrink-0">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-slate-500">No customers registered yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Recent Complaints & Activity</h2>
                <Link to="/complaints" className="text-xs font-medium text-blue-700 hover:underline">
                  View complaints
                </Link>
              </div>
              {data.recent_complaints?.length ? (
                <div className="divide-y divide-slate-100 mb-4">
                  {data.recent_complaints.map((cm) => (
                    <div key={cm.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{cm.subject}</p>
                        <p className="text-slate-500">
                          {cm.complaint_reference} · {cm.customer_name}
                        </p>
                      </div>
                      <StatusBadge status={cm.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-slate-500">No complaints logged.</p>
              )}

              {data.recent_activities?.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Audit Feed</p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {data.recent_activities.slice(0, 4).map((act) => (
                      <li key={act.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{act.summary}</span>
                        <span className="text-slate-400 shrink-0 font-mono">
                          {formatDateTime(act.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
