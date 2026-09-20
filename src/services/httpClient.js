const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const isApiDataSource = import.meta.env.VITE_DATA_SOURCE === 'api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  if (!API_BASE_URL) throw new ApiError('VITE_API_BASE_URL is required when VITE_DATA_SOURCE=api');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new ApiError(`Request failed (${response.status})`, response.status);
  return response.status === 204 ? null : response.json();
}
