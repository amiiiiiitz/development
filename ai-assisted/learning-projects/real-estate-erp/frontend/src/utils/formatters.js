export function formatCurrency(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function extractApiError(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'Unable to reach the Real Estate ERP API server. Verify the FastAPI backend is running.';
  }
  const data = error.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
  }
  if (typeof data?.message === 'string') return data.message;
  return fallback;
}
