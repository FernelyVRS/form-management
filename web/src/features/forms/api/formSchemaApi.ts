import { z } from 'zod';
import { requestJson } from '@/lib/api/apiClient';
import { parseFormSchema } from '../model/formSchemaValidation';
import type { FormSchemaDocument } from '../model/formSchema';

const responseSchema = z.object({
  formId: z.string().min(1), versionId: z.string().min(1), number: z.number().int().positive(),
  status: z.enum(['Draft', 'Published', 'Archived']), schema: z.unknown(),
  rowVersion: z.string().refine(value => { try { return atob(value).length === 8; } catch { return false; } }),
  updatedAt: z.string().nullable(),
}).strict();

export type VersionSchema = Omit<z.infer<typeof responseSchema>, 'schema'> & { schema: FormSchemaDocument };
const endpoint = (formId: string, versionId: string) => `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/schema`;
export const schemaKeys = { version: (formId: string, versionId: string) => ['forms', formId, 'versions', versionId, 'schema'] as const };

function parseResponse(input: unknown, formId: string, versionId: string): VersionSchema {
  const result = responseSchema.parse(input);
  if (result.formId.toLowerCase() !== formId.toLowerCase() || result.versionId.toLowerCase() !== versionId.toLowerCase())
    throw new Error('La respuesta no corresponde a la versión solicitada.');
  return { ...result, schema: parseFormSchema(result.schema) };
}

export async function getFormSchema(formId: string, versionId: string, signal?: AbortSignal): Promise<VersionSchema> {
  return parseResponse(await requestJson<unknown>(endpoint(formId, versionId), { signal }), formId, versionId);
}

export async function saveFormSchema(formId: string, versionId: string, schema: FormSchemaDocument, rowVersion: string): Promise<VersionSchema> {
  return parseResponse(await requestJson<unknown>(endpoint(formId, versionId), {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema: parseFormSchema(schema), rowVersion }),
  }), formId, versionId);
}
