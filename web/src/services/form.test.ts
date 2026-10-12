import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createForm } from './form';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

const okResponse = (json: unknown) => ({ ok: true, json: async () => json });

describe('createForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('posts { name, description } and maps number to numeroVersion', async () => {
    fetchMock.mockResolvedValue(okResponse({ formId: 'f-1', versionId: 'v-1', number: 1 }));
    const created = await createForm({ nombre: 'Alpha', descripcion: 'Desc' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/forms');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Alpha', description: 'Desc' });
    expect(created).toEqual({ formId: 'f-1', versionId: 'v-1', numeroVersion: 1 });
  });

  it('sends null description when omitted', async () => {
    fetchMock.mockResolvedValue(okResponse({ formId: 'f-1', versionId: 'v-1', number: 1 }));
    await createForm({ nombre: 'Alpha' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Alpha', description: null });
  });

  it('rejects the legacy numeroVersion response', async () => {
    fetchMock.mockResolvedValue(okResponse({ formId: 'f-1', versionId: 'v-1', numeroVersion: 1 }));
    await expect(createForm({ nombre: 'Alpha' })).rejects.toThrow();
  });

  it('throws on non-ok responses', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await expect(createForm({ nombre: 'Alpha' })).rejects.toThrow('Failed to create form');
  });
});
