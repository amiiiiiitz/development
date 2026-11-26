import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Eye, Plus } from 'lucide-react';
import { inventoryService, projectsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { INVENTORY_STATUSES, UNIT_TYPES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormFields';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError, formatCurrency, formatNumber } from '../../utils/formatters';

const unitSchema = z.object({
  project_id: z.string().min(1, 'Select a project.'),
  unit_number: z.string().min(1, 'Unit number is required.'),
  building_name: z.string().optional(),
  floor_number: z.string().optional(),
  unit_type: z.string().min(1, 'Unit type is required.'),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  size_sqft: z.coerce.number().positive('Size must be greater than 0.'),
  facing: z.string().optional(),
  base_price: z.coerce.number().min(0, 'Base price must be non-negative.'),
  additional_charges: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
});

export function InventoryPage() {
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'inventory:write');
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [unitType, setUnitType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSize, setMinSize] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const projectsQuery = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsService.list({ page_size: 100 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'inventory',
      search,
      projectId,
      unitType,
      statusFilter,
      minPrice,
      maxPrice,
      minSize,
      sortBy,
      sortOrder,
      page,
    ],
    queryFn: () =>
      inventoryService.list({
        search: search || undefined,
        project_id: projectId || undefined,
        unit_type: unitType || undefined,
        status: statusFilter || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        min_size: minSize || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 15,
      }),
  });

  const form = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      project_id: '',
      unit_number: '',
      building_name: '',
      floor_number: '',
      unit_type: 'Apartment / Flat',
      bedrooms: '',
      bathrooms: '',
      size_sqft: '',
      facing: '',
      base_price: '',
      additional_charges: 0,
      discount: 0,
      description: '',
    },
  });

  const watchBase = Number(form.watch('base_price') || 0);
  const watchAdd = Number(form.watch('additional_charges') || 0);
  const watchDisc = Number(form.watch('discount') || 0);
  const computedFinal = Math.max(0, watchBase + watchAdd - watchDisc);

  const openCreate = () => {
    setEditingUnit(null);
    form.reset({
      project_id: projectsQuery.data?.items?.[0]?.id || '',
      unit_number: '',
      building_name: '',
      floor_number: '',
      unit_type: 'Apartment / Flat',
      bedrooms: '',
      bathrooms: '',
      size_sqft: '',
      facing: '',
      base_price: '',
      additional_charges: 0,
      discount: 0,
      description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (unit, e) => {
    e.stopPropagation();
    setEditingUnit(unit);
    form.reset({
      project_id: unit.project_id,
      unit_number: unit.unit_number,
      building_name: unit.building_name || '',
      floor_number: unit.floor_number != null ? String(unit.floor_number) : '',
      unit_type: unit.unit_type,
      bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : '',
      bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : '',
      size_sqft: Number(unit.size_sqft),
      facing: unit.facing || '',
      base_price: Number(unit.base_price),
      additional_charges: Number(unit.additional_charges),
      discount: Number(unit.discount),
      description: unit.description || '',
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        floor_number: values.floor_number !== '' ? Number(values.floor_number) : null,
        bedrooms: values.bedrooms !== '' ? Number(values.bedrooms) : null,
        bathrooms: values.bathrooms !== '' ? Number(values.bathrooms) : null,
      };
      if (editingUnit) {
        const { project_id: _pid, ...updateData } = payload;
        return inventoryService.update(editingUnit.id, updateData);
      }
      return inventoryService.create(payload);
    },
    onSuccess: () => {
      toast.success(editingUnit ? 'Unit updated.' : 'Inventory unit created.');
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const projectOptions = (projectsQuery.data?.items || []).map((p) => ({
    value: p.id,
    label: `${p.project_code} · ${p.name}`,
  }));

  const columns = [
    { key: 'unit_number', label: 'Unit No', mono: true },
    { key: 'project_name', label: 'Project' },
    { key: 'unit_type', label: 'Type' },
    { key: 'size_sqft', label: 'Sq Ft', align: 'right', render: (r) => formatNumber(r.size_sqft) },
    {
      key: 'final_selling_price',
      label: 'Selling Price',
      align: 'right',
      render: (r) => formatCurrency(r.final_selling_price),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory/${r.id}`)}>
            <Eye className="h-3.5 w-3.5" />
            Details
          </Button>
          {canWrite && r.status !== 'Sold' && r.status !== 'Handover Complete' && (
            <Button variant="ghost" size="sm" onClick={(e) => openEdit(r, e)}>
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Property Inventory"
        description="Track individual apartments, plots, commercial offices, and retail units across all projects."
        actions={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search unit no or block..."
          className="lg:col-span-2"
        />
        <select
          aria-label="Filter by project"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        >
          <option value="">All Projects</option>
          {projectOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by unit type"
          value={unitType}
          onChange={(e) => {
            setUnitType(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        >
          <option value="">All Unit Types</option>
          {UNIT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by inventory status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        >
          <option value="">All Statuses</option>
          {INVENTORY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Price"
          aria-label="Minimum price"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        />
        <select
          aria-label="Sort inventory"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        >
          <option value="created_at:desc">Newest Added</option>
          <option value="unit_number:asc">Unit No (A–Z)</option>
          <option value="final_selling_price:asc">Price (Low–High)</option>
          <option value="final_selling_price:desc">Price (High–Low)</option>
          <option value="size_sqft:desc">Size (Largest)</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error ? extractApiError(error) : null}
        onRetry={refetch}
        onRowClick={(u) => navigate(`/inventory/${u.id}`)}
        emptyTitle="No inventory units match your criteria"
        emptyDescription="Add units under an active project or clear your current filters."
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
        title={editingUnit ? `Edit Unit ${editingUnit.unit_number}` : 'Add Inventory Unit'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Project"
              required
              disabled={Boolean(editingUnit)}
              placeholder="Select project"
              options={projectOptions}
              error={form.formState.errors.project_id?.message}
              {...form.register('project_id')}
            />
            <Input
              label="Unit Number"
              placeholder="A-101"
              required
              error={form.formState.errors.unit_number?.message}
              {...form.register('unit_number')}
            />
            <Select
              label="Unit Type"
              required
              options={UNIT_TYPES}
              {...form.register('unit_type')}
            />
            <Input label="Building / Block" placeholder="Tower A" {...form.register('building_name')} />
            <Input label="Floor Number" type="number" {...form.register('floor_number')} />
            <Input
              label="Size (sq ft)"
              type="number"
              step="0.01"
              required
              error={form.formState.errors.size_sqft?.message}
              {...form.register('size_sqft')}
            />
            <Input label="Bedrooms" type="number" {...form.register('bedrooms')} />
            <Input label="Bathrooms" type="number" {...form.register('bathrooms')} />
            <Input label="Facing / Orientation" placeholder="South-East" {...form.register('facing')} />
            <Input
              label="Base Price"
              type="number"
              step="0.01"
              required
              error={form.formState.errors.base_price?.message}
              {...form.register('base_price')}
            />
            <Input
              label="Additional Charges"
              type="number"
              step="0.01"
              {...form.register('additional_charges')}
            />
            <Input
              label="Discount"
              type="number"
              step="0.01"
              {...form.register('discount')}
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Calculated Final Selling Price</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {formatCurrency(computedFinal)}
            </span>
          </div>

          <Textarea label="Unit Notes / Specification" {...form.register('description')} />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingUnit ? 'Save Unit' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
