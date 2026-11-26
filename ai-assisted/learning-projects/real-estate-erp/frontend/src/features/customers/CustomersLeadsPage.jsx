import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRightLeft, Edit2, Eye, Plus, UserPlus } from 'lucide-react';
import { customersService, leadsService, projectsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { LEAD_STATUSES, UNIT_TYPES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatDate } from '../../utils/formatters';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required.'),
  phone: z.string().min(5, 'Phone number is required.'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  identification_reference: z.string().optional(),
  notes: z.string().optional(),
});

const leadSchema = z.object({
  customer_name: z.string().min(2, 'Prospect name is required.'),
  contact_number: z.string().min(5, 'Contact number is required.'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  interested_project_id: z.string().optional(),
  interested_unit_type: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  lead_source: z.string().optional(),
  follow_up_date: z.string().optional(),
  status: z.string().default('New'),
  notes: z.string().optional(),
});

export function CustomersLeadsPage() {
  const { user } = useAuth();
  const canWriteCustomers = hasPermission(user, 'customers:write');
  const canWriteLeads = hasPermission(user, 'leads:write');
  const canReadLeads = hasPermission(user, 'leads:read');
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [page, setPage] = useState(1);

  const [customerModal, setCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [duplicatePayload, setDuplicatePayload] = useState(null);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  const [leadModal, setLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);

  const projectsQuery = useQuery({
    queryKey: ['projects-crm-options'],
    queryFn: () => projectsService.list({ page_size: 100 }),
  });

  const customersQuery = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () =>
      customersService.list({
        search: search || undefined,
        page,
        page_size: 15,
      }),
    enabled: activeTab === 'customers',
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', search, leadStatus, page],
    queryFn: () =>
      leadsService.list({
        search: search || undefined,
        status: leadStatus || undefined,
        page,
        page_size: 15,
      }),
    enabled: activeTab === 'leads' && canReadLeads,
  });

  const custForm = useForm({ resolver: zodResolver(customerSchema) });
  const leadForm = useForm({ resolver: zodResolver(leadSchema) });

  const openNewCustomer = () => {
    setEditingCustomer(null);
    custForm.reset({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      nationality: '',
      occupation: '',
      identification_reference: '',
      notes: '',
    });
    setCustomerModal(true);
  };

  const openEditCustomer = (c, e) => {
    e.stopPropagation();
    setEditingCustomer(c);
    custForm.reset({
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      nationality: c.nationality || '',
      occupation: c.occupation || '',
      identification_reference: c.identification_reference || '',
      notes: c.notes || '',
    });
    setCustomerModal(true);
  };

  const saveCustomerMutation = useMutation({
    mutationFn: async ({ values, confirm_duplicate = false }) => {
      const payload = {
        ...values,
        email: values.email || null,
        confirm_duplicate,
      };
      if (editingCustomer) {
        const { confirm_duplicate: _cd, ...upd } = payload;
        return customersService.update(editingCustomer.id, upd);
      }
      return customersService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingCustomer ? 'Customer updated.' : 'Customer registered.');
      setCustomerModal(false);
      setDuplicatePayload(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err, variables) => {
      if (err?.response?.status === 409 && !editingCustomer) {
        setDuplicateMessage(extractApiError(err));
        setDuplicatePayload(variables.values);
        return;
      }
      toast.error(extractApiError(err));
    },
  });

  const openNewLead = () => {
    setEditingLead(null);
    leadForm.reset({
      customer_name: '',
      contact_number: '',
      email: '',
      interested_project_id: '',
      interested_unit_type: '',
      budget_min: '',
      budget_max: '',
      lead_source: '',
      follow_up_date: '',
      status: 'New',
      notes: '',
    });
    setLeadModal(true);
  };

  const openEditLead = (l, e) => {
    e.stopPropagation();
    setEditingLead(l);
    leadForm.reset({
      customer_name: l.customer_name,
      contact_number: l.contact_number,
      email: l.email || '',
      interested_project_id: l.interested_project_id || '',
      interested_unit_type: l.interested_unit_type || '',
      budget_min: l.budget_min ? String(l.budget_min) : '',
      budget_max: l.budget_max ? String(l.budget_max) : '',
      lead_source: l.lead_source || '',
      follow_up_date: l.follow_up_date || '',
      status: l.status,
      notes: l.notes || '',
    });
    setLeadModal(true);
  };

  const saveLeadMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        email: values.email || null,
        interested_project_id: values.interested_project_id || null,
        interested_unit_type: values.interested_unit_type || null,
        budget_min: values.budget_min ? Number(values.budget_min) : null,
        budget_max: values.budget_max ? Number(values.budget_max) : null,
        follow_up_date: values.follow_up_date || null,
      };
      if (editingLead) {
        return leadsService.update(editingLead.id, payload);
      }
      return leadsService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingLead ? 'Lead updated.' : 'Lead created.');
      setLeadModal(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const convertMutation = useMutation({
    mutationFn: (leadId) => leadsService.convert(leadId, {}),
    onSuccess: (customer) => {
      toast.success(`Lead converted to customer ${customer.customer_code}.`);
      setConvertTarget(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const projectOptions = (projectsQuery.data?.items || []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers & Sales Leads"
        description="Manage customer profiles, duplicate checks, sales inquiries, follow-ups, and lead conversion."
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'customers' && canWriteCustomers && (
              <Button onClick={openNewCustomer}>
                <UserPlus className="h-4 w-4" />
                Add Customer
              </Button>
            )}
            {activeTab === 'leads' && canWriteLeads && (
              <Button onClick={openNewLead}>
                <Plus className="h-4 w-4" />
                New Lead
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customers');
              setPage(1);
            }}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customers
          </button>
          {canReadLeads && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('leads');
                setPage(1);
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'leads'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Leads
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={
              activeTab === 'customers'
                ? 'Search name, phone, email, or code...'
                : 'Search lead name, phone, or code...'
            }
            className="w-64 sm:w-72"
          />
          {activeTab === 'leads' && (
            <select
              aria-label="Filter leads by status"
              value={leadStatus}
              onChange={(e) => {
                setLeadStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="">All Lead Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {activeTab === 'customers' ? (
        <DataTable
          columns={[
            { key: 'customer_code', label: 'Code', mono: true },
            { key: 'full_name', label: 'Customer Name', render: (r) => <span className="font-medium text-slate-900">{r.full_name}</span> },
            { key: 'phone', label: 'Phone', mono: true },
            { key: 'email', label: 'Email' },
            { key: 'assigned_sales_executive_name', label: 'Sales Executive' },
            { key: 'created_at', label: 'Registered', mono: true, render: (r) => formatDate(r.created_at) },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${r.id}`)}>
                    <Eye className="h-3.5 w-3.5" />
                    Profile
                  </Button>
                  {canWriteCustomers && (
                    <Button variant="ghost" size="sm" onClick={(e) => openEditCustomer(r, e)}>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={customersQuery.data?.items || []}
          isLoading={customersQuery.isLoading}
          error={customersQuery.error ? extractApiError(customersQuery.error) : null}
          onRetry={customersQuery.refetch}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          emptyTitle="No customers registered"
          emptyDescription="Add a customer record or convert a qualified sales lead."
          pagination={
            customersQuery.data
              ? {
                  page: customersQuery.data.page,
                  totalPages: customersQuery.data.total_pages,
                  total: customersQuery.data.total,
                  pageSize: customersQuery.data.page_size,
                  onPageChange: setPage,
                }
              : null
          }
        />
      ) : (
        <DataTable
          columns={[
            { key: 'lead_code', label: 'Code', mono: true },
            { key: 'customer_name', label: 'Prospect Name', render: (r) => <span className="font-medium text-slate-900">{r.customer_name}</span> },
            { key: 'contact_number', label: 'Contact', mono: true },
            { key: 'interested_project_name', label: 'Project' },
            { key: 'follow_up_date', label: 'Follow-Up', mono: true, render: (r) => formatDate(r.follow_up_date) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {canWriteLeads && (
                    <Button variant="ghost" size="sm" onClick={(e) => openEditLead(r, e)}>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                  {canWriteLeads && r.status !== 'Converted' && r.status !== 'Lost' && (
                    <Button variant="secondary" size="sm" onClick={() => setConvertTarget(r)}>
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Convert
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={leadsQuery.data?.items || []}
          isLoading={leadsQuery.isLoading}
          error={leadsQuery.error ? extractApiError(leadsQuery.error) : null}
          onRetry={leadsQuery.refetch}
          emptyTitle="No leads found"
          emptyDescription="Capture inbound sales inquiries to track follow-ups and conversions."
          pagination={
            leadsQuery.data
              ? {
                  page: leadsQuery.data.page,
                  totalPages: leadsQuery.data.total_pages,
                  total: leadsQuery.data.total,
                  pageSize: leadsQuery.data.page_size,
                  onPageChange: setPage,
                }
              : null
          }
        />
      )}

      {/* Customer Modal */}
      <Modal
        isOpen={customerModal}
        onClose={() => setCustomerModal(false)}
        title={editingCustomer ? `Edit Customer (${editingCustomer.customer_code})` : 'Add Customer'}
        size="lg"
      >
        <form
          onSubmit={custForm.handleSubmit((values) =>
            saveCustomerMutation.mutate({ values, confirm_duplicate: false })
          )}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              error={custForm.formState.errors.full_name?.message}
              {...custForm.register('full_name')}
            />
            <Input
              label="Phone Number"
              required
              error={custForm.formState.errors.phone?.message}
              {...custForm.register('phone')}
            />
            <Input
              label="Email Address"
              type="email"
              error={custForm.formState.errors.email?.message}
              {...custForm.register('email')}
            />
            <Input label="Occupation" {...custForm.register('occupation')} />
            <Input label="Nationality" {...custForm.register('nationality')} />
            <Input
              label="Reference ID (Optional)"
              hint="Non-sensitive internal reference code only"
              {...custForm.register('identification_reference')}
            />
          </div>
          <Input label="Address" {...custForm.register('address')} />
          <Textarea label="Notes" {...custForm.register('notes')} />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setCustomerModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveCustomerMutation.isPending}>
              {editingCustomer ? 'Save Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(duplicatePayload)}
        onClose={() => setDuplicatePayload(null)}
        onConfirm={() =>
          saveCustomerMutation.mutate({ values: duplicatePayload, confirm_duplicate: true })
        }
        title="Possible Duplicate Customer"
        message={`${duplicateMessage} Do you still want to create this customer record?`}
        confirmLabel="Create Anyway"
        variant="primary"
        loading={saveCustomerMutation.isPending}
      />

      {/* Lead Modal */}
      <Modal
        isOpen={leadModal}
        onClose={() => setLeadModal(false)}
        title={editingLead ? `Edit Lead (${editingLead.lead_code})` : 'Create Sales Lead'}
        size="lg"
      >
        <form onSubmit={leadForm.handleSubmit((v) => saveLeadMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prospect Name"
              required
              error={leadForm.formState.errors.customer_name?.message}
              {...leadForm.register('customer_name')}
            />
            <Input
              label="Contact Number"
              required
              error={leadForm.formState.errors.contact_number?.message}
              {...leadForm.register('contact_number')}
            />
            <Input
              label="Email"
              type="email"
              error={leadForm.formState.errors.email?.message}
              {...leadForm.register('email')}
            />
            <Select
              label="Interested Project"
              placeholder="Select project"
              options={projectOptions}
              {...leadForm.register('interested_project_id')}
            />
            <Select
              label="Interested Unit Type"
              placeholder="Select type"
              options={UNIT_TYPES}
              {...leadForm.register('interested_unit_type')}
            />
            <Select label="Lead Status" options={LEAD_STATUSES} {...leadForm.register('status')} />
            <Input label="Minimum Budget" type="number" {...leadForm.register('budget_min')} />
            <Input label="Maximum Budget" type="number" {...leadForm.register('budget_max')} />
            <Input label="Lead Source" placeholder="Website, Referral, Walk-in" {...leadForm.register('lead_source')} />
            <Input label="Next Follow-Up Date" type="date" {...leadForm.register('follow_up_date')} />
          </div>
          <Textarea label="Notes" {...leadForm.register('notes')} />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setLeadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveLeadMutation.isPending}>
              {editingLead ? 'Save Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(convertTarget)}
        onClose={() => setConvertTarget(null)}
        onConfirm={() => convertMutation.mutate(convertTarget.id)}
        title="Convert Lead to Customer"
        message={`Convert "${convertTarget?.customer_name}" (${convertTarget?.lead_code}) into an official Customer record?`}
        confirmLabel="Convert Lead"
        variant="primary"
        loading={convertMutation.isPending}
      />
    </div>
  );
}
