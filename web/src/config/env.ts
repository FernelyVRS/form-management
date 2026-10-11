const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL is required in production');
}

export const apiUrl = (configuredApiUrl || 'http://localhost:5165').replace(/\/+$/, '');
