import { describe, expect, it, vi, beforeEach } from 'vitest';
import { requestJson, ApiError } from '@/lib/api/apiClient';
import {
  archiveVersion,
  cloneForm,
  deriveVersion,
  getLifecycleProblemCode,
  lifecycleMessage,
  lifecycleVersionSchema,
  publishVersion,
} from './formLifecycleApi';

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

const lifecycleVersion = {
  formId: 'f-1',
  versionId: 'v-2',
  number: 2,
  status: 'Draft' as const,
  derivedFromVersionId: 'v-1',
  rowVersion: 'AAAAAAAAAAE=',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  archivedVersionId: null,
};

describe('lifecycleVersionSchema', () => {
  it('accepts a valid lifecycle version response', () => {
    expect(lifecycleVersionSchema.parse(lifecycleVersion)).toEqual(lifecycleVersion);
  });

  it('rejects unknown statuses', () => {
    expect(() => lifecycleVersionSchema.parse({ ...lifecycleVersion, status: 'Legacy' })).toThrow();
  });

  it('rejects non-positive version numbers', () => {
    expect(() => lifecycleVersionSchema.parse({ ...lifecycleVersion, number: 0 })).toThrow();
  });
});

describe('request routes and bodies', () => {
  beforeEach(() => {
    mockedRequestJson.mockReset();
    mockedRequestJson.mockResolvedValue(lifecycleVersion);
  });

  it('deriveVersion posts { sourceVersionId } to /forms/{id}/versions', async () => {
    await deriveVersion('f-1', 'v-1');
    expect(mockedRequestJson).toHaveBeenCalledWith('/forms/f-1/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceVersionId: 'v-1' }),
      signal: undefined,
    });
  });

  it('deriveVersion encodes the form id', async () => {
    await deriveVersion('f/1', 'v-1');
    expect(mockedRequestJson.mock.calls[0][0]).toBe('/forms/f%2F1/versions');
  });

  it('cloneForm posts exactly four keys to /forms/from-version', async () => {
    await cloneForm({
      name: 'Copia',
      description: null,
      sourceFormId: 'f-1',
      sourceVersionId: 'v-1',
    });
    const [, init] = mockedRequestJson.mock.calls[0];
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['description', 'name', 'sourceFormId', 'sourceVersionId']);
    expect(mockedRequestJson.mock.calls[0][0]).toBe('/forms/from-version');
  });

  it('cloneForm strips the signal from the request body', async () => {
    await cloneForm({
      name: 'Copia',
      description: 'x',
      sourceFormId: 'f-1',
      sourceVersionId: 'v-1',
      signal: AbortSignal.abort(),
    });
    const [, init] = mockedRequestJson.mock.calls[0];
    expect(init?.body).not.toContain('signal');
  });

  it('publishVersion posts { rowVersion } to the publish route', async () => {
    await publishVersion('f-1', 'v-2', 'AAAAAAAAAAE=');
    expect(mockedRequestJson).toHaveBeenCalledWith('/forms/f-1/versions/v-2/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowVersion: 'AAAAAAAAAAE=' }),
    });
  });

  it('archiveVersion posts { rowVersion } to the archive route', async () => {
    await archiveVersion('f-1', 'v-2', 'AAAAAAAAAAE=');
    expect(mockedRequestJson).toHaveBeenCalledWith('/forms/f-1/versions/v-2/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowVersion: 'AAAAAAAAAAE=' }),
    });
  });

  it('rejects responses that do not match the lifecycle contract', async () => {
    mockedRequestJson.mockResolvedValue({ formId: 'f-1' });
    await expect(deriveVersion('f-1', 'v-1')).rejects.toThrow();
  });
});

describe('ProblemDetails mapping', () => {
  const apiErrorWithCode = (code: string) =>
    new ApiError('Request failed with status 409', 409, { title: 'Conflict', code });

  it('extracts a known code from the ProblemDetails body', () => {
    expect(getLifecycleProblemCode(apiErrorWithCode('version_conflict'))).toBe('version_conflict');
  });

  it('returns null for unknown codes', () => {
    expect(getLifecycleProblemCode(apiErrorWithCode('made_up'))).toBeNull();
  });

  it('returns null for non-ApiError values', () => {
    expect(getLifecycleProblemCode(new Error('boom'))).toBeNull();
    expect(getLifecycleProblemCode(null)).toBeNull();
    expect(getLifecycleProblemCode('boom')).toBeNull();
  });

  it('maps stable codes to actionable Spanish messages', () => {
    expect(lifecycleMessage(apiErrorWithCode('version_conflict'))).toContain('cambió desde otra sesión');
    expect(lifecycleMessage(apiErrorWithCode('invalid_version_state'))).toContain('estado actual');
    expect(lifecycleMessage(apiErrorWithCode('not_publishable'))).toContain('al menos una pregunta');
    expect(lifecycleMessage(apiErrorWithCode('form_not_found'))).toContain('ya no existe');
  });

  it('falls back to a generic message for unmapped errors', () => {
    expect(lifecycleMessage(new Error('boom'))).toBe('Error: boom. Intenta de nuevo.');
    expect(lifecycleMessage(undefined)).toBe('Error en la operación. Intenta de nuevo.');
  });
});
