import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestJson } from '@/lib/api/apiClient';
import { getFormDetail } from './useFormLifecycle';

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

const detail = {
  id: 'f-1',
  name: 'Formulario Alpha',
  description: 'Descripción',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  versions: [
    { id: 'v-1', number: 1, status: 'Published', rowVersion: 'AAAAAAAAAAE=', createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
    { id: 'v-2', number: 2, status: 'Draft', rowVersion: 'AAAAAAAAAAI=', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z' },
  ],
};

describe('getFormDetail', () => {
  beforeEach(() => {
    mockedRequestJson.mockReset();
  });

  it('maps English wire keys to the internal Spanish model', async () => {
    mockedRequestJson.mockResolvedValue(detail);
    const result = await getFormDetail('f-1');
    expect(result).toEqual({
      id: 'f-1',
      nombre: 'Formulario Alpha',
      descripcion: 'Descripción',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      versiones: [
        { id: 'v-1', numero: 1, estado: 'Published', rowVersion: 'AAAAAAAAAAE=', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'v-2', numero: 2, estado: 'Draft', rowVersion: 'AAAAAAAAAAI=', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-02T00:00:00Z' },
      ],
    });
  });

  it('rejects the legacy Spanish wire format', async () => {
    mockedRequestJson.mockResolvedValue({
      id: 'f-1',
      nombre: 'Legacy',
      descripcion: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
      versiones: [{ id: 'v-1', numeroVersion: 1, estado: 'Draft', rowVersion: 'AAAAAAAAAAE=', createdAt: '2026-01-01T00:00:00Z', updatedAt: null }],
    });
    await expect(getFormDetail('f-1')).rejects.toThrow();
  });

  it('encodes the form id in the route', async () => {
    mockedRequestJson.mockResolvedValue(detail);
    await getFormDetail('f/1');
    expect(mockedRequestJson).toHaveBeenCalledWith('/forms/f%2F1', { signal: undefined });
  });
});
