import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestJson } from '@/lib/api/apiClient';
import { getForms } from './formsApi';

vi.mock('@/lib/api/apiClient', () => ({
  requestJson: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly body: unknown,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockedRequestJson = vi.mocked(requestJson);

const listItem = {
  id: 'f-1',
  name: 'Formulario Alpha',
  description: 'Primer formulario',
  totalVersions: 2,
  latestVersion: 2,
  latestVersionId: 'v-2',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

describe('getForms', () => {
  beforeEach(() => {
    mockedRequestJson.mockReset();
  });

  it('maps English wire keys to the internal Spanish model', async () => {
    mockedRequestJson.mockResolvedValue([listItem]);
    const forms = await getForms();
    expect(forms).toEqual([{
      id: 'f-1',
      nombre: 'Formulario Alpha',
      descripcion: 'Primer formulario',
      totalVersiones: 2,
      ultimaVersion: 2,
      ultimaVersionId: 'v-2',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    }]);
  });

  it('defaults null description to undefined and null updatedAt to createdAt', async () => {
    mockedRequestJson.mockResolvedValue([{ ...listItem, description: null, updatedAt: null }]);
    const [form] = await getForms();
    expect(form.descripcion).toBeUndefined();
    expect(form.updatedAt).toBe(form.createdAt);
  });

  it('rejects the legacy Spanish wire format', async () => {
    mockedRequestJson.mockResolvedValue([{
      id: 'f-1',
      nombre: 'Legacy',
      descripcion: null,
      totalVersiones: 1,
      ultimaVersion: 1,
      ultimaVersionId: 'v-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
    }]);
    await expect(getForms()).rejects.toThrow();
  });

  it('passes the abort signal through', async () => {
    mockedRequestJson.mockResolvedValue([]);
    const signal = AbortSignal.abort();
    await getForms(signal);
    expect(mockedRequestJson).toHaveBeenCalledWith('/forms', { signal });
  });
});
