import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Eye, Plus, XCircle } from 'lucide-react';
import {
  bookingsService,
  customersService,
  inventoryService,
  projectsService,
} from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { BOOKING_STATUSES, PAYMENT_METHODS } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters';

const bookingSchema = z.object({
  project_id: z.string().min(1, 'Select a project.'),
  inventory_unit_id: z.string().min(1, 'Select an available unit.'),
  customer_id: z.string().min(1, 'Select a customer.'),
  booking_date: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
  initial_booking_amount: z.coerce.number().min(0).default(0),
  payment_method: z.string().min(1),
  confirm_immediately: z.boolean().default(false),
  notes: z.string().optional(),
});

export function BookingsPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'bookings:write');
  const canCancel = hasPermission(user, 'bookings:cancel');
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', search, statusFilter, page],
    queryFn: () =>
      bookingsService.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 15,
      }),
  });

  const projectsQuery = useQuery({
    queryKey: ['booking-projects'],
    queryFn: () => projectsService.list({ page_size: 100 }),
    enabled: createOpen,
  });

  const customersQuery = useQuery({
    queryKey: ['booking-customers'],
    queryFn: () => customersService.list({ page_size: 100 }),
    enabled: createOpen,
  });

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      project_id: '',
      inventory_unit_id: '',
      customer_id: '',
      booking_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      initial_booking_amount: 0,
      payment_method: 'Bank Transfer',
      confirm_immediately: false,
      notes: '',
    },
  });

  const selectedProjectId = form.watch('project_id');
  const selectedUnitId = form.watch('inventory_unit_id');
  const discountVal = Number(form.watch('discount') || 0);

  const availableUnitsQuery = useQuery({
    queryKey: ['available-units', selectedProjectId],
    queryFn: () =>
      inventoryService.list({
        project_id: selectedProjectId,
        status: 'Available',
        page_size: 100,
      }),
    enabled: createOpen && Boolean(selectedProjectId),
  });

  const availableUnits = availableUnitsQuery.data?.items || [];
  const selectedUnit = availableUnits.find((u) => u.id === selectedUnitId);
  const unitPrice = Number(selectedUnit?.final_selling_price || 0);
  const finalAgreed = Math.max(0, unitPrice - discountVal);

  const createMutation = useMutation({
    mutationFn: (values) =>
      bookingsService.create({
        ...values,
        booking_date: values.booking_date || undefined,
      }),
    onSuccess: (created) => {
      toast.success(`Booking ${created.booking_reference} created.`);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => bookingsService.confirm(id),
    onSuccess: (b) => {
      toast.success(`Booking ${b.booking_reference} confirmed. Unit is now Booked.`);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsService.cancel(cancelTarget.id, { reason: cancelReason }),
    onSuccess: (b) => {
      toast.success(`Booking ${b.booking_reference} cancelled and unit restored to Available.`);
      setCancelTarget(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const columns = [
    { key: 'booking_reference', label: 'Reference', mono: true },
    { key: 'customer_name', label: 'Customer' },
    { key: 'project_name', label: 'Project' },
    { key: 'unit_number', label: 'Unit', mono: true },
    { key: 'booking_date', label: 'Date', mono: true, render: (r) => formatDate(r.booking_date) },
    { key: 'final_agreed_price', label: 'Agreed Price', align: 'right', render: (r) => formatCurrency(r.final_agreed_price) },
    { key: 'outstanding_balance', label: 'Outstanding', align: 'right', render: (r) => formatCurrency(r.outstanding_balance) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${r.id}`)}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          {canWrite && r.status === 'Pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => confirmMutation.mutate(r.id)}
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
              Confirm
            </Button>
          )}
          {canCancel && r.status !== 'Cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCancelTarget(r);
                setCancelReason('');
              }}
            >
              <XCircle className="h-3.5 w-3.5 text-red-700" />
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Booking Management"
        description="Transactional property reservations, confirmations, cancellations, and balance tracking."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                form.reset({
                  project_id: '',
                  inventory_unit_id: '',
                  customer_id: '',
                  booking_date: new Date().toISOString().slice(0, 10),
                  discount: 0,
                  initial_booking_amount: 0,
                  payment_method: 'Bank Transfer',
                  confirm_immediately: false,
                  notes: '',
                });
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search booking ref, customer, or unit..."
          className="w-full sm:w-72"
        />
        <select
          aria-label="Filter bookings by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error ? extractApiError(error) : null}
        onRetry={refetch}
        onRowClick={(b) => navigate(`/bookings/${b.id}`)}
        emptyTitle="No bookings recorded"
        emptyDescription="Create a booking by selecting an available inventory unit and a registered customer."
        pagination={
          data
            ? {
                page: data.page,
                totalPages: data.total_pages,
                total: data.total,
                pageSize: data.page_size,
                onPageChange: setPage,
              }
            : null
        }
      />

      {/* Booking Creation Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Property Booking"
        subtitle="Backend row-level locking prevents duplicate reservations on the same unit."
        size="lg"
      >
        <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="1. Project"
              required
              placeholder="Select project"
              options={(projectsQuery.data?.items || []).map((p) => ({
                value: p.id,
                label: `${p.project_code} · ${p.name}`,
              }))}
              error={form.formState.errors.project_id?.message}
              {...form.register('project_id', {
                onChange: () => form.setValue('inventory_unit_id', ''),
              })}
            />
            <Select
              label="2. Available Unit"
              required
              disabled={!selectedProjectId}
              placeholder={
                selectedProjectId
                  ? availableUnits.length
                    ? 'Select available unit'
                    : 'No available units in this project'
                  : 'Select a project first'
              }
              options={availableUnits.map((u) => ({
                value: u.id,
                label: `${u.unit_number} (${u.unit_type} · ${formatCurrency(u.final_selling_price)})`,
              }))}
              error={form.formState.errors.inventory_unit_id?.message}
              {...form.register('inventory_unit_id')}
            />
            <Select
              label="3. Customer"
              required
              placeholder="Select customer"
              options={(customersQuery.data?.items || []).map((c) => ({
                value: c.id,
                label: `${c.full_name} (${c.phone})`,
              }))}
              error={form.formState.errors.customer_id?.message}
              {...form.register('customer_id')}
            />
            <Input label="Booking Date" type="date" {...form.register('booking_date')} />
            <Input
              label="Additional Booking Discount"
              type="number"
              step="0.01"
              {...form.register('discount')}
            />
            <Input
              label="Initial Booking Amount"
              type="number"
              step="0.01"
              {...form.register('initial_booking_amount')}
            />
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              {...form.register('payment_method')}
            />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  {...form.register('confirm_immediately')}
                />
                Confirm booking immediately (marks unit as Booked)
              </label>
            </div>
          </div>

          {selectedUnit && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Unit Listed Price</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(unitPrice)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Discount</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(discountVal)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Agreed Price</span>
                <span className="font-mono font-semibold text-blue-800">
                  {formatCurrency(finalAgreed)}
                </span>
              </div>
            </div>
          )}

          <Textarea label="Booking Notes" {...form.register('notes')} />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Booking Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate()}
        title={`Cancel Booking ${cancelTarget?.booking_reference || ''}`}
        message="Cancelling restores the inventory unit to Available while preserving the booking and any historical collection records for audit purposes."
        confirmLabel="Cancel Booking"
        loading={cancelMutation.isPending}
      >
        <Textarea
          label="Cancellation Reason (Required)"
          required
          placeholder="Explain why this booking is being cancelled..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
