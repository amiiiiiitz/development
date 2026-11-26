import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { projectsService, reportsService } from '../../services/erpServices';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { REPORT_TYPES } from '../../constants/erpOptions';
import { PageHeader, SearchBar } from '../../components/common/CommonStates';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError } from '../../utils/formatters';

export function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canFinancial = hasPermission(user, 'reports:financial');
  const canOperational = hasPermission(user, 'reports:operational');

  const availableReports = useMemo(
    () =>
      REPORT_TYPES.filter((r) =>
        r.category === 'Financial' ? canFinancial : canOperational
      ),
    [canFinancial, canOperational]
  );

  const [reportType, setReportType] = useState(
    availableReports[0]?.key || 'project_overview'
  );
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ['reports-projects'],
    queryFn: () => projectsService.list({ page_size: 100 }),
  });

  const reportQuery = useQuery({
    queryKey: ['report', reportType, projectId, startDate, endDate, search, page],
    queryFn: () =>
      reportsService.get(reportType, {
        project_id: projectId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
        page,
        page_size: 25,
      }),
    enabled: availableReports.length > 0,
  });

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportCsv(reportType, {
        project_id: projectId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `real_estate_erp_${reportType}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report CSV downloaded.');
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to export CSV.'));
    } finally {
      setExporting(false);
    }
  };

  const report = reportQuery.data;
  const tableColumns = (report?.columns || []).map((c) => ({
    key: c.key,
    label: c.label,
    mono: /code|ref|date|price|amount|balance|collected|sqft|units/i.test(c.key),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operational & Financial Reports"
        description="Backend-calculated reports with date/project filtering, summary totals, and CSV export."
        actions={
          <Button
            variant="secondary"
            loading={exporting}
            onClick={handleExportCsv}
            disabled={!report}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          aria-label="Report type"
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
        >
          {availableReports.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label} ({r.category})
            </option>
          ))}
        </select>

        <select
          aria-label="Filter report by project"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="">All Projects</option>
          {(projectsQuery.data?.items || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          aria-label="Report start date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        />
        <input
          type="date"
          aria-label="Report end date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
        />

        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Filter rows..."
        />
      </div>

      {report?.summary && Object.keys(report.summary).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(report.summary).map(([key, val]) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500 capitalize">
                {key.replaceAll('_', ' ')}
              </p>
              <p className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900">
                {String(val)}
              </p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={tableColumns}
        rows={report?.rows || []}
        keyField="booking_reference"
        isLoading={reportQuery.isLoading}
        error={reportQuery.error ? extractApiError(reportQuery.error) : null}
        onRetry={reportQuery.refetch}
        emptyTitle="No matching rows in this report"
        emptyDescription="Adjust the date range, project filter, or search query."
        pagination={
          report
            ? {
                page: report.page,
                totalPages: report.total_pages,
                total: report.total,
                pageSize: report.page_size,
                onPageChange: setPage,
              }
            : null
        }
      />
    </div>
  );
}
