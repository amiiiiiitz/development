import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../../features/auth/ProtectedRoute';
import { LoginPage } from '../../features/auth/LoginPage';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { ProjectsPage } from '../../features/projects/ProjectsPage';
import { ProjectDetailPage } from '../../features/projects/ProjectDetailPage';
import { InventoryPage } from '../../features/inventory/InventoryPage';
import { InventoryDetailPage } from '../../features/inventory/InventoryDetailPage';
import { CustomersLeadsPage } from '../../features/customers/CustomersLeadsPage';
import { CustomerProfilePage } from '../../features/customers/CustomerProfilePage';
import { BookingsPage } from '../../features/bookings/BookingsPage';
import { BookingDetailPage } from '../../features/bookings/BookingDetailPage';
import { CollectionsPage } from '../../features/collections/CollectionsPage';
import { ComplaintsPage } from '../../features/complaints/ComplaintsPage';
import { ReportsPage } from '../../features/reports/ReportsPage';
import { EmployeesPage } from '../../features/employees/EmployeesPage';
import { SettingsPage } from '../../features/settings/SettingsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredPermissions={['dashboard:read']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="projects"
            element={
              <ProtectedRoute requiredPermissions={['projects:read']}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="projects/:id"
            element={
              <ProtectedRoute requiredPermissions={['projects:read']}>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute requiredPermissions={['inventory:read']}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/:id"
            element={
              <ProtectedRoute requiredPermissions={['inventory:read']}>
                <InventoryDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={
              <ProtectedRoute requiredPermissions={['customers:read', 'leads:read']}>
                <CustomersLeadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers/:id"
            element={
              <ProtectedRoute requiredPermissions={['customers:read']}>
                <CustomerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute requiredPermissions={['bookings:read']}>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/:id"
            element={
              <ProtectedRoute requiredPermissions={['bookings:read']}>
                <BookingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="collections"
            element={
              <ProtectedRoute requiredPermissions={['collections:read']}>
                <CollectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="complaints"
            element={
              <ProtectedRoute requiredPermissions={['complaints:read']}>
                <ComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute
                requiredPermissions={['reports:operational', 'reports:financial']}
              >
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute requiredPermissions={['employees:read']}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
