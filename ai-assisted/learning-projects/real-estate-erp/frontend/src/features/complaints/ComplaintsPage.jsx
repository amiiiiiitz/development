import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, Plus } from 'lucide-react';
import {
  complaintsService,
  customersService,
  employeesService,
  projectsService,
} from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatDate, formatDateTime } from '../../utils/formatters';

const complaintSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer.'),
  project_id: z.string().min(1, 'Select a project.'),
  subject: z.string().min(3, 'Subject is required.'),
  category: z.string().min(2, 'Category is required.'),
  priority: z.string().default('Medium'),
  description: z.string().min(5, 'Description is required.'),
});

export function ComplaintsPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'complaints:write');
  const canReadEmployees = hasPermission(user, 'employees:read');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePriority, setUpdatePriority] = useState('');
  const [updateAssignee, setUpdateAssignee] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');

  const listQuery = useQuery({
    queryKey: ['complaints', search, statusFilter, priorityFilter, page],
    queryFn: () =>
      complaintsService.list({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        page_size: 15,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['complaint-detail', selectedId],
    queryFn: () => complaintsService.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const customersQuery = useQuery({
    queryKey: ['complaints-customers'],
    queryFn: () => customersService.list({ page_size: 100 }),
    enabled: createOpen,
  });

  const projectsQuery = useQuery({
    queryKey: ['complaints-projects'],
    queryFn: () => projectsService.list({ page_size: 100 }),
    enabled: createOpen,
  });

  const employeesQuery = useQuery({
    queryKey: ['complaints-employees'],
    queryFn: () => employeesService.list({ is_active: true, page_size: 100 }),
    enabled: Boolean(selectedId) && canReadEmployees,
  });

  const form = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      customer_id: '',
      project_id: '',
      subject: '',
      category: 'Construction Quality',
      priority: 'Medium',
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values) => complaintsService.create(values),
    onSuccess: (created) => {
      toast.success(`Complaint ${created.complaint_reference} logged.`);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      complaintsService.update(selectedId, {
        status: updateStatus || undefined,
        priority: updatePriority || undefined,
        assigned_employee_id: updateAssignee || undefined,
        resolution_details: resolutionDetails || undefined,
      }),
    onSuccess: () => {
      toast.success('Complaint updated.');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-detail', selectedId] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const openDetail = (c) => {
    setSelectedId(c.id);
    setUpdateStatus(c.status);
    setUpdatePriority(c.priority);
    setUpdateAssignee(c.assigned_employee_id || '');
    setResolutionDetails(c.resolution_details || '');
  };

  const detail = detailQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Complaints"
        description="Log customer service issues, assign ownership, prioritize escalations, and track resolutions."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                form.reset({
                  customer_id: '',
                  project_id: '',
                  subject: '',
                  category: 'Construction Quality',
                  priority: 'Medium',
                  description: '',
                });
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Log Complaint
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
          placeholder="Search ticket ref, subject, or customer..."
          className="w-full sm:w-72"
        />
        <select
          aria-label="Filter by complaint status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by complaint priority"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Priorities</option>
          {COMPLAINT_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'complaint_reference', label: 'Ticket Ref', mono: true },
          { key: 'subject', label: 'Subject', render: (r) => <span className="font-medium text-slate-900">{r.subject}</span> },
          { key: 'customer_name', label: 'Customer' },
          { key: 'project_name', label: 'Project' },
          { key: 'priority', label: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'assigned_employee_name', label: 'Assigned To', render: (r) => r.assigned_employee_name || 'Unassigned' },
          { key: 'created_at', label: 'Logged', mono: true, render: (r) => formatDate(r.created_at) },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <Button variant="ghost" size="sm" onClick={() => openDetail(r)}>
                <Eye className="h-3.5 w-3.5" />
                Manage
              </Button>
            ),
          },
        ]}
        rows={listQuery.data?.items || []}
        isLoading={listQuery.isLoading}
        error={listQuery.error ? extractApiError(listQuery.error) : null}
        onRetry={listQuery.refetch}
        onRowClick={openDetail}
        emptyTitle="No complaints found"
        emptyDescription="Customer service tickets logged by support staff will appear here."
        pagination={
          listQuery.data
            ? {
                page: listQuery.data.page,
                totalPages: listQuery.data.total_pages,
                total: listQuery.data.total,
                pageSize: listQuery.data.page_size,
                onPageChange: setPage,
              }
            : null
        }
      />

      {/* Create Complaint Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Log Customer Complaint"
        size="md"
      >
        <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Select
            label="Customer"
            required
            placeholder="Select customer"
            options={(customersQuery.data?.items || []).map((c) => ({
              value: c.id,
              label: `${c.full_name} (${c.phone})`,
            }))}
            error={form.formState.errors.customer_id?.message}
            {...form.register('customer_id')}
          />
          <Select
            label="Related Project"
            required
            placeholder="Select project"
            options={(projectsQuery.data?.items || []).map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            error={form.formState.errors.project_id?.message}
            {...form.register('project_id')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="Plumbing, Handover, Billing"
              required
              error={form.formState.errors.category?.message}
              {...form.register('category')}
            />
            <Select
              label="Priority"
              options={COMPLAINT_PRIORITIES}
              {...form.register('priority')}
            />
          </div>
          <Input
            label="Subject"
            required
            error={form.formState.errors.subject?.message}
            {...form.register('subject')}
          />
          <Textarea
            label="Detailed Description"
            required
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complaint Detail & Workflow Modal */}
      <Modal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail ? `${detail.complaint_reference} · ${detail.subject}` : 'Complaint Details'}
        size="lg"
      >
        {detail && (
          <div className="space-y-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {detail.customer_name} · {detail.project_name}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.priority} />
                  <StatusBadge status={detail.status} />
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">{detail.description}</p>
            </div>

            {canWrite && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Status"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    options={COMPLAINT_STATUSES}
                  />
                  <Select
                    label="Priority"
                    value={updatePriority}
                    onChange={(e) => setUpdatePriority(e.target.value)}
                    options={COMPLAINT_PRIORITIES}
                  />
                  {canReadEmployees && (
                    <Select
                      label="Assign Officer"
                      placeholder="Unassigned"
                      value={updateAssignee}
                      onChange={(e) => setUpdateAssignee(e.target.value)}
                      options={(employeesQuery.data?.items || []).map((emp) => ({
                        value: emp.id,
                        label: `${emp.full_name} (${emp.role_name})`,
                      }))}
                    />
                  )}
                </div>
                <Textarea
                  label="Resolution / Action Notes"
                  placeholder="Required when marking Resolved or Closed..."
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    loading={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                  >
                    Save Complaint Update
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-900 mb-2">Ticket History</h3>
              <div className="divide-y divide-slate-100 text-xs max-h-48 overflow-y-auto">
                {(detail.history || []).map((h) => (
                  <div key={h.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-slate-800">
                        {h.previous_status ? `${h.previous_status} → ${h.new_status}` : h.new_status}
                      </span>
                      {h.note && <p className="text-slate-500">{h.note}</p>}
                    </div>
                    <span className="font-mono text-slate-400 shrink-0">
                      {h.changed_by_name} · {formatDateTime(h.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
