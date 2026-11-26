import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasAnyPermission } from '../../utils/permissions';

export function ProtectedRoute({ children, requiredPermissions = [] }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          Verifying workspace session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermissions.length > 0 && !hasAnyPermission(user, requiredPermissions)) {
    return (
      <div className="p-8">
        <div className="max-w-lg rounded-lg border border-red-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Your assigned role ({user.role_name}) does not include permission to view this module.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
