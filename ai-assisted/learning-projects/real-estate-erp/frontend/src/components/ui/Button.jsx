import React from 'react';

const VARIANT_CLASSES = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 focus-visible:ring-slate-900',
  secondary:
    'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 focus-visible:ring-slate-400',
  danger:
    'bg-red-700 text-white hover:bg-red-800 border border-red-700 focus-visible:ring-red-700',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent focus-visible:ring-slate-400',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary
      } ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
