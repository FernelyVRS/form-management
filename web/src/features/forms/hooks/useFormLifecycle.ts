import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestJson } from '@/lib/api/apiClient';
import { z } from 'zod';
import type { FormWithVersions } from '@/types/form';
import {
  archiveVersion,
  cloneForm,
  deriveVersion,
  publishVersion,
  type LifecycleVersion,
} from '../api/formLifecycleApi';

export const formDetailKeys = {
  all: ['forms'] as const,
  detail: (formId: string) => ['forms', 'detail', formId] as const,
};

const formDetailSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  versiones: z.array(
    z.object({
      id: z.string(),
      numeroVersion: z.number().int().positive(),
      estado: z.enum(['Draft', 'Published', 'Archived']),
      rowVersion: z.string().min(1),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
    }),
  ),
});

const mapDetail = (detail: z.infer<typeof formDetailSchema>): FormWithVersions => ({
  id: detail.id,
  nombre: detail.nombre,
  descripcion: detail.descripcion ?? undefined,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt ?? detail.createdAt,
  versiones: detail.versiones.map(version => ({
    id: version.id,
    numero: version.numeroVersion,
    estado: version.estado,
    rowVersion: version.rowVersion,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt ?? version.createdAt,
  })),
});

export const getFormDetail = async (formId: string, signal?: AbortSignal): Promise<FormWithVersions> => {
  const response = await requestJson<unknown>(`/forms/${encodeURIComponent(formId)}`, { signal });
  return mapDetail(formDetailSchema.parse(response));
};

export function useFormDetailQuery(formId: string | undefined) {
  return useQuery({
    queryKey: formDetailKeys.detail(formId ?? 'unknown'),
    queryFn: ({ signal }) => getFormDetail(formId!, signal),
    enabled: Boolean(formId),
    retry: 1,
  });
}

const useInvalidateFormCaches = () => {
  const client = useQueryClient();
  return async (formId: string) => {
    await client.invalidateQueries({ queryKey: formDetailKeys.all });
    await client.invalidateQueries({ queryKey: ['forms', formId] });
  };
};

export function useDeriveVersionMutation(formId: string) {
  const invalidate = useInvalidateFormCaches();
  return useMutation({
    mutationFn: ({ sourceVersionId }: { sourceVersionId: string }) =>
      deriveVersion(formId, sourceVersionId),
    onSuccess: (version: LifecycleVersion) => invalidate(version.formId),
    retry: false,
  });
}

export function usePublishVersionMutation(formId: string) {
  const invalidate = useInvalidateFormCaches();
  return useMutation({
    mutationFn: ({ versionId, rowVersion }: { versionId: string; rowVersion: string }) =>
      publishVersion(formId, versionId, rowVersion),
    onSuccess: () => invalidate(formId),
    retry: false,
  });
}

export function useArchiveVersionMutation(formId: string) {
  const invalidate = useInvalidateFormCaches();
  return useMutation({
    mutationFn: ({ versionId, rowVersion }: { versionId: string; rowVersion: string }) =>
      archiveVersion(formId, versionId, rowVersion),
    onSuccess: () => invalidate(formId),
    retry: false,
  });
}

export function useCloneFormMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cloneForm,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: formDetailKeys.all });
    },
    retry: false,
  });
}
