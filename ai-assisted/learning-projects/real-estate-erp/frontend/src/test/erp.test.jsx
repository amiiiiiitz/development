import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ToastProvider } from '../components/feedback/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { BookingsPage } from '../features/bookings/BookingsPage';
import * as authHook from '../features/auth/AuthContext';
import {
  bookingsService,
  customersService,
  inventoryService,
  projectsService,
} from '../services/erpServices';

function renderWithProviders(ui, { route = '/' } = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('Reusable UI Components', () => {
  it('renders StatusBadge with explicit status label', () => {
    render(<StatusBadge status="Confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders DataTable empty, loading, error, and populated states', () => {
    const { rerender } = render(
      <DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[]} isLoading />
    );
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    const onRetry = vi.fn();
    rerender(
      <DataTable
        columns={[{ key: 'name', label: 'Name' }]}
        rows={[]}
        error="Database timeout"
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Database timeout')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <DataTable
        columns={[{ key: 'name', label: 'Name' }]}
        rows={[]}
        emptyTitle="No units yet"
      />
    );
    expect(screen.getByText('No units yet')).toBeInTheDocument();

    rerender(
      <DataTable
        columns={[{ key: 'name', label: 'Name' }]}
        rows={[{ id: '1', name: 'Skyline Heights' }]}
      />
    );
    expect(screen.getByText('Skyline Heights')).toBeInTheDocument();
  });

  it('invokes ConfirmDialog handlers', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Archive Project"
        message="Confirm archival?"
      />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('Authentication & RBAC UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates login inputs and displays backend unavailable guidance', async () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      initializing: false,
      backendReachable: false,
      needsSetup: false,
      login: vi.fn(),
      setupInitialAdmin: vi.fn(),
      retryConnection: vi.fn(),
    });

    renderWithProviders(<LoginPage />);
    expect(screen.getByText('FastAPI Backend Not Reachable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeDisabled();
  });

  it('renders Initial Administrator Setup form when needsSetup is true and validates matching passwords', async () => {
    const user = userEvent.setup();
    const setupMock = vi.fn().mockResolvedValue({ id: '1', role_name: 'ADMIN' });
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      initializing: false,
      backendReachable: true,
      needsSetup: true,
      login: vi.fn(),
      setupInitialAdmin: setupMock,
      retryConnection: vi.fn(),
    });

    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Initial Administrator Setup')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('e.g. Amina Rahman'), 'Admin User');
    await user.type(screen.getByPlaceholderText('admin@company.com'), 'admin@erp.local');
    const pwInputs = document.querySelectorAll('input[type="password"]');
    await user.type(pwInputs[0], 'StrongPass123!');
    await user.type(pwInputs[1], 'MismatchPass!');
    await user.click(screen.getByRole('button', { name: /Create Administrator/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(setupMock).not.toHaveBeenCalled();
  });

  it('blocks unauthorized role inside ProtectedRoute', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        role_name: 'SALES_EXECUTIVE',
        is_superuser: false,
        permissions: ['bookings:read'],
      },
      initializing: false,
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/employees"
          element={
            <ProtectedRoute requiredPermissions={['employees:read']}>
              <div>Employee Directory</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/employees' }
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Employee Directory')).not.toBeInTheDocument();
  });
});

describe('Booking Workflow Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a booking via API and refreshes bookings list', async () => {
    const user = userEvent.setup();
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        role_name: 'ADMIN',
        is_superuser: true,
        permissions: ['bookings:read', 'bookings:write', 'bookings:cancel'],
      },
      initializing: false,
    });

    vi.spyOn(bookingsService, 'list').mockResolvedValue({
      items: [
        {
          id: 'b1',
          booking_reference: 'BKG-2026-001',
          customer_name: 'Kamrul Hasan',
          project_name: 'Skyline Heights',
          unit_number: 'A-101',
          booking_date: '2026-11-20',
          final_agreed_price: '245000.00',
          outstanding_balance: '195000.00',
          status: 'Confirmed',
        },
      ],
      total: 1,
      page: 1,
      page_size: 15,
      total_pages: 1,
    });

    vi.spyOn(projectsService, 'list').mockResolvedValue({
      items: [{ id: 'p1', project_code: 'PRJ-01', name: 'Skyline Heights' }],
    });
    vi.spyOn(inventoryService, 'list').mockResolvedValue({
      items: [
        {
          id: 'unit1',
          unit_number: 'A-102',
          unit_type: 'Apartment / Flat',
          final_selling_price: '250000.00',
        },
      ],
    });
    vi.spyOn(customersService, 'list').mockResolvedValue({
      items: [{ id: 'c1', full_name: 'Nusrat Jahan', phone: '+880-1811-000' }],
    });

    const createSpy = vi.spyOn(bookingsService, 'create').mockResolvedValue({
      id: 'b2',
      booking_reference: 'BKG-2026-002',
    });

    renderWithProviders(<BookingsPage />);

    expect(await screen.findByText('BKG-2026-001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /New Booking/i }));
    await waitFor(() => expect(screen.getByText('Create Property Booking')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText(/1\. Project/i), 'p1');
    await waitFor(() =>
      expect(screen.getByText(/A-102/i)).toBeInTheDocument()
    );
    await user.selectOptions(screen.getByLabelText(/2\. Available Unit/i), 'unit1');
    await user.selectOptions(screen.getByLabelText(/3\. Customer/i), 'c1');

    await user.click(screen.getByRole('button', { name: /^Create Booking$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'p1',
          inventory_unit_id: 'unit1',
          customer_id: 'c1',
        })
      );
    });
  });
});
