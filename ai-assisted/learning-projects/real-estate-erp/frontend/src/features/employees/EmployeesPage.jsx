import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Plus, Power } from 'lucide-react';
import { employeesService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { EMPLOYEE_ROLES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatDateTime } from '../../utils/formatters';

const createEmpSchema = z.object({
  full_name: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Valid email is required.'),
  phone: z.string().optional(),
  role_name: z.string().min(1, 'Select a role.'),
  password: z.string().min(10, 'Password must be at least 10 characters.'),
});

const editEmpSchema = z.object({
  full_name: z.string().min(2, 'Full name is required.'),
  phone: z.string().optional(),
  role_name: z.string().min(1),
});

export function EmployeesPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'employees:manage');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const listQuery = useQuery({
    queryKey: ['employees', search, roleFilter, page],
    queryFn: () =>
      employeesService.list({
        search: search || undefined,
        role_name: roleFilter || undefined,
        page,
        page_size: 15,
      }),
  });

  const createForm = useForm({
    resolver: zodResolver(createEmpSchema),
    defaultValues: { full_name: '', email: '', phone: '', role_name: 'SALES_EXECUTIVE', password: '' },
  });

  const editForm = useForm({
    resolver: zodResolver(editEmpSchema),
  });

  const createMutation = useMutation({
    mutationFn: (v) => employeesService.create(v),
    onSuccess: (emp) => {
      toast.success(`Employee ${emp.full_name} (${emp.employee_code}) created.`);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => employeesService.update(id, payload),
    onSuccess: () => {
      toast.success('Employee updated.');
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    editForm.reset({
      full_name: emp.full_name,
      phone: emp.phone || '',
      role_name: emp.role_name,
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees & Access Control"
        description="Manage company staff accounts, role assignments, and active workspace access."
        actions={
          canManage && (
            <Button
              onClick={() => {
                createForm.reset({
                  full_name: '',
                  email: '',
                  phone: '',
                  role_name: 'SALES_EXECUTIVE',
                  password: '',
                });
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Employee
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
          placeholder="Search name, email, or employee code..."
          className="w-full sm:w-72"
        />
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Roles</option>
          {EMPLOYEE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'employee_code', label: 'Code', mono: true },
          { key: 'full_name', label: 'Full Name', render: (r) => <span className="font-medium text-slate-900">{r.full_name}</span> },
          { key: 'email', label: 'Email' },
          { key: 'role_name', label: 'Role', render: (r) => r.role_name.replace('_', ' ') },
          {
            key: 'is_active',
            label: 'Account Status',
            render: (r) => <StatusBadge status={r.is_active ? 'Active' : 'Inactive'} />,
          },
          {
            key: 'last_login_at',
            label: 'Last Sign-In',
            mono: true,
            render: (r) => formatDateTime(r.last_login_at),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (r) =>
              canManage ? (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {r.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: r.id,
                          payload: { is_active: !r.is_active },
                        })
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                      {r.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              ) : null,
          },
        ]}
        rows={listQuery.data?.items || []}
        isLoading={listQuery.isLoading}
        error={listQuery.error ? extractApiError(listQuery.error) : null}
        onRetry={listQuery.refetch}
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

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Employee Account"
        size="md"
      >
        <form onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
          <Input
            label="Full Name"
            required
            error={createForm.formState.errors.full_name?.message}
            {...createForm.register('full_name')}
          />
          <Input
            label="Work Email"
            type="email"
            required
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input label="Phone" {...createForm.register('phone')} />
          <Select
            label="Assigned Role"
            required
            options={EMPLOYEE_ROLES}
            {...createForm.register('role_name')}
          />
          <Input
            label="Initial Password (min 10 characters)"
            type="password"
            required
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        title={`Edit Employee (${editingEmployee?.employee_code || ''})`}
        size="sm"
      >
        <form
          onSubmit={editForm.handleSubmit((v) =>
            updateMutation.mutate({ id: editingEmployee.id, payload: v })
          )}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            required
            error={editForm.formState.errors.full_name?.message}
            {...editForm.register('full_name')}
          />
          <Input label="Phone" {...editForm.register('phone')} />
          <Select
            label="Role"
            options={EMPLOYEE_ROLES}
            {...editForm.register('role_name')}
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
