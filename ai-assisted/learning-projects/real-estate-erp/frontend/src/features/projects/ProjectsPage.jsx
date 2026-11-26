import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Archive, Edit2, Eye, Plus } from 'lucide-react';
import { projectsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { PROJECT_STATUSES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatNumber } from '../../utils/formatters';

const projectSchema = z.object({
  project_code: z.string().min(2, 'Project code is required.'),
  name: z.string().min(2, 'Project name is required.'),
  location: z.string().min(2, 'Location is required.'),
  address: z.string().min(3, 'Address is required.'),
  project_type: z.string().min(2, 'Project type is required.'),
  total_land_area: z.string().optional(),
  number_of_buildings: z.string().optional(),
  start_date: z.string().optional(),
  expected_completion_date: z.string().optional(),
  status: z.string().default('Planning'),
  description: z.string().optional(),
});

export function ProjectsPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'projects:write');
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter, sortBy, sortOrder, page],
    queryFn: () =>
      projectsService.list({
        search: search || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 15,
      }),
  });

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      project_code: '',
      name: '',
      location: '',
      address: '',
      project_type: 'Residential High-Rise',
      total_land_area: '',
      number_of_buildings: '',
      start_date: '',
      expected_completion_date: '',
      status: 'Planning',
      description: '',
    },
  });

  const openCreate = () => {
    setEditingProject(null);
    form.reset({
      project_code: '',
      name: '',
      location: '',
      address: '',
      project_type: 'Residential High-Rise',
      total_land_area: '',
      number_of_buildings: '',
      start_date: '',
      expected_completion_date: '',
      status: 'Planning',
      description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (proj, e) => {
    e.stopPropagation();
    setEditingProject(proj);
    form.reset({
      project_code: proj.project_code,
      name: proj.name,
      location: proj.location,
      address: proj.address,
      project_type: proj.project_type,
      total_land_area: proj.total_land_area ? String(proj.total_land_area) : '',
      number_of_buildings: proj.number_of_buildings != null ? String(proj.number_of_buildings) : '',
      start_date: proj.start_date || '',
      expected_completion_date: proj.expected_completion_date || '',
      status: proj.status,
      description: proj.description || '',
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        total_land_area: values.total_land_area ? Number(values.total_land_area) : null,
        number_of_buildings: values.number_of_buildings ? Number(values.number_of_buildings) : null,
        start_date: values.start_date || null,
        expected_completion_date: values.expected_completion_date || null,
      };
      if (editingProject) {
        const { project_code: _code, ...updatePayload } = payload;
        return projectsService.update(editingProject.id, updatePayload);
      }
      return projectsService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingProject ? 'Project updated.' : 'Project created.');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => projectsService.archive(id),
    onSuccess: () => {
      toast.success('Project archived safely.');
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const columns = [
    { key: 'project_code', label: 'Code', mono: true },
    { key: 'name', label: 'Project Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'location', label: 'Location' },
    { key: 'project_type', label: 'Type' },
    {
      key: 'units',
      label: 'Inventory',
      align: 'right',
      render: (r) => `${formatNumber(r.stats?.available_units || 0)} / ${formatNumber(r.stats?.total_units || 0)} avail`,
    },
    {
      key: 'collected',
      label: 'Net Collected',
      align: 'right',
      render: (r) => formatCurrency(r.stats?.total_collected || 0),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${r.id}`)}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          {canWrite && (
            <>
              <Button variant="ghost" size="sm" onClick={(e) => openEdit(r, e)}>
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(r)}>
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Project Management"
        description="Manage real estate developments, timelines, associated inventory, and collection performance."
        actions={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Project
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
          placeholder="Search project code, name, or location..."
          className="w-full sm:w-72"
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort projects"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="created_at:desc">Newest First</option>
          <option value="name:asc">Name (A–Z)</option>
          <option value="project_code:asc">Project Code</option>
          <option value="expected_completion_date:asc">Completion Date</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error ? extractApiError(error) : null}
        onRetry={refetch}
        onRowClick={(r) => navigate(`/projects/${r.id}`)}
        emptyTitle="No projects found"
        emptyDescription="Create your first real estate project to start adding property inventory."
        emptyAction={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )
        }
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? `Edit Project (${editingProject.project_code})` : 'Create Real Estate Project'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Code"
              placeholder="PRJ-SKY-01"
              required
              disabled={Boolean(editingProject)}
              error={form.formState.errors.project_code?.message}
              {...form.register('project_code')}
            />
            <Input
              label="Project Name"
              placeholder="Skyline Heights Residences"
              required
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <Input
              label="Location / District"
              placeholder="Gulshan North"
              required
              error={form.formState.errors.location?.message}
              {...form.register('location')}
            />
            <Input
              label="Project Type"
              placeholder="Residential High-Rise"
              required
              error={form.formState.errors.project_type?.message}
              {...form.register('project_type')}
            />
            <Input
              label="Total Land Area (sq ft)"
              type="number"
              step="0.01"
              {...form.register('total_land_area')}
            />
            <Input
              label="Number of Buildings"
              type="number"
              {...form.register('number_of_buildings')}
            />
            <Input label="Start Date" type="date" {...form.register('start_date')} />
            <Input
              label="Expected Completion Date"
              type="date"
              {...form.register('expected_completion_date')}
            />
          </div>
          <Select
            label="Project Status"
            options={PROJECT_STATUSES}
            {...form.register('status')}
          />
          <Input
            label="Full Site Address"
            required
            error={form.formState.errors.address?.message}
            {...form.register('address')}
          />
          <Textarea label="Project Description" {...form.register('description')} />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
        title="Archive Project"
        message={`Archive "${archiveTarget?.name}"? Projects with active bookings cannot be archived. Historical inventory and records remain preserved.`}
        confirmLabel="Archive Project"
        loading={archiveMutation.isPending}
      />
    </div>
  );
}
