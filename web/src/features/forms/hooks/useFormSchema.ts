import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFormSchema, saveFormSchema, schemaKeys } from '../api/formSchemaApi';
import type { FormSchemaDocument } from '../model/formSchema';

export function useFormSchemaQuery(formId: string, versionId: string) {
  return useQuery({ queryKey: schemaKeys.version(formId, versionId),
    queryFn: ({ signal }) => getFormSchema(formId, versionId, signal), retry: false,
    refetchOnWindowFocus: false, staleTime: 0 });
}

export function useSaveFormSchemaMutation(formId: string, versionId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ schema, rowVersion }: { schema: FormSchemaDocument; rowVersion: string }) => saveFormSchema(formId, versionId, schema, rowVersion),
    onMutate: () => client.cancelQueries({ queryKey: schemaKeys.version(formId, versionId) }),
    onSuccess: response => client.setQueryData(schemaKeys.version(formId, versionId), response),
    retry: false,
  });
}
