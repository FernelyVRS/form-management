import { z } from 'zod';
import { requestJson } from '@/lib/api/apiClient';
import type { Form } from '@/types/form';

const formListItemSchema = z.object({
  id: z.string().min(1),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  totalVersiones: z.number().int().nonnegative(),
  ultimaVersion: z.number().int().nonnegative(),
  ultimaVersionId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

const formListSchema = z.array(formListItemSchema);

const mapForm = (form: z.infer<typeof formListItemSchema>): Form => ({
  ...form,
  descripcion: form.descripcion ?? undefined,
  updatedAt: form.updatedAt ?? form.createdAt,
});

export const getForms = async (signal?: AbortSignal): Promise<Form[]> => {
  const response = await requestJson<unknown>('/forms', { signal });
  return formListSchema.parse(response).map(mapForm);
};
