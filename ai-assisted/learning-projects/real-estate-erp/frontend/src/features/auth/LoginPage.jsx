import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, RefreshCw, ServerCrash, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormFields';
import { useToast } from '../../components/feedback/ToastContext';
import { extractApiError } from '../../utils/formatters';
import { getApiBaseUrl } from '../../services/apiClient';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const setupSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters.'),
    email: z.string().email('Enter a valid administrator email.'),
    phone: z.string().optional(),
    password: z.string().min(10, 'Password must be at least 10 characters.'),
    confirm_password: z.string().min(10, 'Confirm your password.'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

export function LoginPage() {
  const { login, setupInitialAdmin, needsSetup, backendReachable, retryConnection } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const setupForm = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '' },
  });

  const onLoginSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      toast.success('Signed in to Real Estate ERP.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(extractApiError(err, 'Invalid credentials.'));
    }
  };

  const onSetupSubmit = async (values) => {
    setServerError('');
    try {
      await setupInitialAdmin({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });
      toast.success('Primary administrator account created.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(extractApiError(err, 'Failed to initialize administrator account.'));
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setServerError('');
    await retryConnection();
    setRetrying(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Real Estate ERP</h1>
            <p className="text-xs text-slate-500">Enterprise Property & Operations Workspace</p>
          </div>
        </div>

        {!backendReachable && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
            <div className="flex items-start gap-2.5">
              <ServerCrash className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold">FastAPI Backend Not Reachable</p>
                <p className="leading-relaxed text-amber-900">
                  This interface connects directly to the Python FastAPI + PostgreSQL API at{' '}
                  <span className="font-mono">{getApiBaseUrl()}</span>. Start the backend service
                  via <span className="font-mono">docker compose up --build</span> or{' '}
                  <span className="font-mono">uvicorn app.main:app --port 8000</span>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={retrying}
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry API Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {needsSetup ? (
            <>
              <div className="mb-5 flex items-start gap-2.5 border-b border-slate-100 pb-4">
                <ShieldCheck className="h-5 w-5 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Initial Administrator Setup
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    No employee accounts exist yet. Create the first system administrator to unlock
                    the ERP workspace.
                  </p>
                </div>
              </div>

              {serverError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {serverError}
                </div>
              )}

              <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
                <Input
                  label="Administrator Full Name"
                  placeholder="e.g. Amina Rahman"
                  required
                  error={setupForm.formState.errors.full_name?.message}
                  {...setupForm.register('full_name')}
                />
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="admin@company.com"
                  required
                  error={setupForm.formState.errors.email?.message}
                  {...setupForm.register('email')}
                />
                <Input
                  label="Phone Number"
                  placeholder="+880-1700-000000"
                  error={setupForm.formState.errors.phone?.message}
                  {...setupForm.register('phone')}
                />
                <Input
                  label="Password (min 10 characters)"
                  type="password"
                  required
                  error={setupForm.formState.errors.password?.message}
                  {...setupForm.register('password')}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  error={setupForm.formState.errors.confirm_password?.message}
                  {...setupForm.register('confirm_password')}
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={setupForm.formState.isSubmitting}
                  disabled={!backendReachable}
                >
                  Create Administrator & Sign In
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">Employee Sign In</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Authenticate with your company employee credentials.
                </p>
              </div>

              {serverError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {serverError}
                </div>
              )}

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  autoComplete="email"
                  placeholder="employee@company.com"
                  required
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={loginForm.formState.isSubmitting}
                  disabled={!backendReachable}
                >
                  Sign In
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
