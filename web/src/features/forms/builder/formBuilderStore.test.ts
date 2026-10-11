import { expect, it, vi } from 'vitest';
import { createFormBuilderStore } from './formBuilderStore';
import type { VersionSchema } from '../api/formSchemaApi';
import type { FormSchemaDocument } from '../model/formSchema';
import { ApiError } from '@/lib/api/apiClient';

const remote: VersionSchema = { formId: 'form', versionId: 'version', number: 1, status: 'Draft', updatedAt: null,
  schema: { schemaVersion: 1, sections: [] }, rowVersion: 'AAAAAAAAAAE=' };
const section = { id: 'section', type: 'section' as const, title: 'Sección', entity: 'Hogar', order: 1, items: [] };

it('isolates version identity and never hydrates over a dirty draft', () => {
  const store = createFormBuilderStore('form', 'version');
  store.getState().hydrate({ ...remote, versionId: 'other' });
  expect(store.getState().schema).toBeNull();
  store.getState().hydrate(remote);
  store.getState().apply({ type: 'put', node: section, parentId: null });
  store.getState().hydrate(remote);
  expect(store.getState().schema?.sections).toHaveLength(1);
  expect(store.getState().dirty).toBe(true);
});

it('blocks edits/repeated save while pending and adopts the new token on success', async () => {
  const store = createFormBuilderStore('form', 'version');
  store.getState().hydrate(remote);
  store.getState().apply({ type: 'put', node: section, parentId: null });
  let finish!: (response: VersionSchema) => void;
  const write = vi.fn((schema: FormSchemaDocument, token: string) => {
    expect(schema.sections).toHaveLength(1); expect(token).toBe(remote.rowVersion);
    return new Promise<VersionSchema>(resolve => { finish = resolve; });
  });
  const pending = store.getState().save(write);
  expect(store.getState().apply({ type: 'remove', id: 'section' })).toBe(false);
  await store.getState().save(write);
  expect(write).toHaveBeenCalledTimes(1);
  finish({ ...remote, schema: store.getState().schema!, rowVersion: 'AAAAAAAAAAI=' });
  await pending;
  expect(store.getState()).toMatchObject({ dirty: false, saveStatus: 'saved', remote: { rowVersion: 'AAAAAAAAAAI=' } });
});

it('retains content after conflict and requires deliberate reload before retry', async () => {
  const store = createFormBuilderStore('form', 'version');
  store.getState().hydrate(remote);
  store.getState().apply({ type: 'put', node: section, parentId: null });
  const write = vi.fn().mockRejectedValue(new ApiError('conflict', 409, {}));
  await store.getState().save(write);
  expect(store.getState()).toMatchObject({ dirty: true, saveStatus: 'conflict' });
  await store.getState().save(write);
  expect(write).toHaveBeenCalledTimes(1);
  store.getState().hydrate(remote, true);
  expect(store.getState().schema?.sections).toHaveLength(0);
});
