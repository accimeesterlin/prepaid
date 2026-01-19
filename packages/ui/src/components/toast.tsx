import * as React from 'react';
import { cn } from '../lib/utils';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const variantStyles = {
  default: 'bg-background border-border',
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
};

const variantIcons = {
  default: AlertCircle,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const variantIconColors = {
  default: 'text-foreground',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
};

export function Toast({
  title,
  description,
  variant = 'default',
  onClose,
}: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        'animate-in slide-in-from-top-full',
        variantStyles[variant]
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', variantIconColors[variant])} />
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-semibold text-sm leading-tight mb-1">{title}</p>
            )}
            {description && (
              <p className="text-sm opacity-90 leading-tight">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                'flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2'
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toaster({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
