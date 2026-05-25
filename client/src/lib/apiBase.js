const defaultApiOrigin = 'http://localhost:5000';

export const normalizeApiOrigin = (rawOrigin = import.meta.env.VITE_API_URL) => {
  const trimmed = String(rawOrigin || defaultApiOrigin).trim().replace(/\/+$/, '');
  const withoutApiSuffix = trimmed.replace(/\/api$/i, '');

  if (/^https?:\/\//i.test(withoutApiSuffix)) {
    return withoutApiSuffix;
  }

  if (withoutApiSuffix.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}${withoutApiSuffix}`;
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(withoutApiSuffix)) {
    return `http://${withoutApiSuffix}`;
  }

  return `https://${withoutApiSuffix}`;
};

export const API_ORIGIN = normalizeApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;
