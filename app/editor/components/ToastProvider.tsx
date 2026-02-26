'use client';
import { useToastStore } from '@/store/toast';
import { useEffect } from 'react';

const toastStyles = {
  success: 'bg-green-50 text-green-800',
  error: 'bg-red-50 text-red-800',
  warning: 'bg-yellow-50 text-yellow-800',
  info: 'bg-blue-50 text-blue-800',
};

export default function ToastProvider() {
  const { toasts, removeToast, removeAllToasts } = useToastStore();

  useEffect(() => {
    return () => {
      removeAllToasts();
    };
  }, [removeAllToasts]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg ${toastStyles[toast.type]} shadow-sm ${toast.onClick ? 'cursor-pointer' : ''}`}
          onClick={() => {
            if (toast.onClick) {
              toast.onClick();
            }
            // Always remove toast after click, regardless of whether there's an onClick
            removeToast(toast.id);
          }}
        >
          <div className="flex items-center gap-2">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}
