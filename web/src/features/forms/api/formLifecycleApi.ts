import { z } from 'zod';
import { requestJson } from '@/lib/api/apiClient';

export const lifecycleVersionSchema = z.object({
  formId: z.string().min(1),
  versionId: z.string().min(1),
  number: z.number().int().positive(),
  status: z.enum(['Draft', 'Published', 'Archived']),
  derivedFromVersionId: z.string().min(1).nullable(),
  rowVersion: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  archivedVersionId: z.string().min(1).nullable(),
});

export type LifecycleVersion = z.infer<typeof lifecycleVersionSchema>;

export const lifecycleProblemCodes = [
  'invalid_request',
  'version_not_found',
  'form_not_found',
  'invalid_version_state',
  'version_conflict',
  'not_publishable',
  'schema_identity_violation',
  'invalid_stored_schema',
] as const;

export type LifecycleProblemCode = (typeof lifecycleProblemCodes)[number];

export const getLifecycleProblemCode = (error: unknown): LifecycleProblemCode | null => {
  if (typeof error !== 'object' || error === null || !('body' in error)) return null;
  const body = (error as { body: unknown }).body;
  if (typeof body !== 'object' || body === null) return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' && (lifecycleProblemCodes as readonly string[]).includes(code)
    ? (code as LifecycleProblemCode)
    : null;
};

export const lifecycleErrorMessages: Record<LifecycleProblemCode, string> = {
  invalid_request: 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.',
  version_not_found: 'La versión ya no existe. Se actualizó el estado del formulario.',
  form_not_found: 'El formulario de origen ya no existe.',
  invalid_version_state: 'Esta operación no está disponible para el estado actual de la versión. Se actualizó el estado.',
  version_conflict: 'La versión cambió desde otra sesión. Se refrescó el estado; revisa y reintenta.',
  not_publishable: 'La versión debe contener al menos una pregunta para poder publicarse.',
  schema_identity_violation: 'La versión perdió campos protegidos de su origen y no puede publicarse.',
  invalid_stored_schema: 'El guardado de la versión está dañado y no puede procesarse. Contacta soporte.',
};

export const lifecycleMessage = (error: unknown): string =>
  getLifecycleProblemCode(error) !== null
    ? lifecycleErrorMessages[getLifecycleProblemCode(error)!]
    : error instanceof Error
      ? `Error: ${error.message}. Intenta de nuevo.`
      : 'Error en la operación. Intenta de nuevo.';

const parseLifecycle = (response: unknown): LifecycleVersion => lifecycleVersionSchema.parse(response);

export const deriveVersion = async (
  formId: string,
  sourceVersionId: string,
  signal?: AbortSignal,
): Promise<LifecycleVersion> => {
  const response = await requestJson<unknown>(`/forms/${encodeURIComponent(formId)}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceVersionId }),
    signal,
  });
  return parseLifecycle(response);
};

export const cloneForm = async (input: {
  name: string;
  description: string | null;
  sourceFormId: string;
  sourceVersionId: string;
  signal?: AbortSignal;
}): Promise<LifecycleVersion> => {
  const { signal, ...body } = input;
  const response = await requestJson<unknown>('/forms/from-version', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  return parseLifecycle(response);
};

export const publishVersion = async (
  formId: string,
  versionId: string,
  rowVersion: string,
): Promise<LifecycleVersion> => {
  const response = await requestJson<unknown>(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowVersion }),
    },
  );
  return parseLifecycle(response);
};

export const archiveVersion = async (
  formId: string,
  versionId: string,
  rowVersion: string,
): Promise<LifecycleVersion> => {
  const response = await requestJson<unknown>(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/archive`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowVersion }),
    },
  );
  return parseLifecycle(response);
};
