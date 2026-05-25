import React from 'react';
import { Toaster } from 'react-hot-toast';

const toastStyle = {
  border: '1px solid var(--line-subtle)',
  borderRadius: '14px',
  background: 'color-mix(in oklab, var(--bg-elevated) 94%, white)',
  color: 'var(--ink-strong)',
  boxShadow: 'var(--shadow-float)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.92rem',
  lineHeight: 1.45,
  padding: '14px 16px',
  maxWidth: '420px',
};

const iconTheme = {
  primary: 'var(--brand-1)',
  secondary: 'color-mix(in oklab, var(--brand-3) 34%, white)',
};

const SystemNotifications = () => (
  <Toaster
    position="top-right"
    gutter={12}
    toastOptions={{
      duration: 4200,
      style: toastStyle,
      success: {
        iconTheme: {
          primary: 'var(--success)',
          secondary: 'white',
        },
      },
      error: {
        duration: 5600,
        iconTheme: {
          primary: 'var(--danger)',
          secondary: 'white',
        },
      },
      loading: {
        iconTheme,
      },
    }}
  />
);

export default SystemNotifications;
