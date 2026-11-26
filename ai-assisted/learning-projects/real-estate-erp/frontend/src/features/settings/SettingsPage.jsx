import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../../services/erpServices';
import { PageHeader } from '../../components/common/CommonStates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError } from '../../utils/formatters';

const pwSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required.'),
    new_password: z.string().min(10, 'New password must be at least 10 characters.'),
    confirm_password: z.string().min(10, 'Confirm your new password.'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const form = useForm({
    resolver: zodResolver(pwSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const pwMutation = useMutation({
    mutationFn: (values) =>
      authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      }),
    onSuccess: () => {
      toast.success('Password updated successfully.');
      form.reset();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Review your employee profile, granted permissions, and update your password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Employee Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Full Name</span>
              <span className="font-medium text-slate-900">{user?.full_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Employee Code</span>
              <span className="font-mono text-slate-900">{user?.employee_code}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Work Email</span>
              <span className="text-slate-900">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Role</span>
              <span className="font-medium text-slate-900">{user?.role_name}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-700 block mb-2">
              Granted Permissions ({user?.permissions?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(user?.permissions || []).map((p) => (
                <span
                  key={p}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Change Password</h2>
          <form onSubmit={form.handleSubmit((v) => pwMutation.mutate(v))} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              error={form.formState.errors.current_password?.message}
              {...form.register('current_password')}
            />
            <Input
              label="New Password (min 10 characters)"
              type="password"
              required
              error={form.formState.errors.new_password?.message}
              {...form.register('new_password')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              error={form.formState.errors.confirm_password?.message}
              {...form.register('confirm_password')}
            />
            <Button type="submit" loading={pwMutation.isPending}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
