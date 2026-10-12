import { z } from 'zod';
import { requestJson } from '@/lib/api/apiClient';
import type { Form } from '@/types/form';

const formListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  totalVersions: z.number().int().nonnegative(),
  latestVersion: z.number().int().nonnegative(),
  latestVersionId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const formListSchema = z.array(formListItemSchema);

const mapForm = (form: z.infer<typeof formListItemSchema>): Form => ({
  id: form.id,
  nombre: form.name,
  descripcion: form.description ?? undefined,
  totalVersiones: form.totalVersions,
  ultimaVersion: form.latestVersion,
  ultimaVersionId: form.latestVersionId,
  createdAt: form.createdAt,
  updatedAt: form.updatedAt ?? form.createdAt,
});

export const getForms = async (signal?: AbortSignal): Promise<Form[]> => {
  const response = await requestJson<unknown>('/forms', { signal });
  return formListSchema.parse(response).map(mapForm);
};
