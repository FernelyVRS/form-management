import { createStore } from 'zustand/vanilla';
import type { VersionSchema } from '../api/formSchemaApi';
import type { FormSchemaDocument } from '../model/formSchema';
import { applySchemaCommand, orderedSchema, protectBaseline, type SchemaCommand } from '../model/formSchemaOperations';
import { FormSchemaError, parseFormSchema } from '../model/formSchemaValidation';
import { ApiError } from '@/lib/api/apiClient';
import { ZodError } from 'zod';

const issueMessages: Record<string, string> = {
  duplicate_id: 'Este ID ya existe. Elige uno diferente.',
  duplicate_variable: 'Esta variable externa ya está en uso.',
  invalid_order: 'El orden debe ser consecutivo y no repetirse.',
  invalid_bounds: 'El mínimo no debe superar el máximo.',
  invalid_dependency: 'Selecciona como origen una pregunta de selección existente.',
  dependency_cycle: 'La dependencia forma un ciclo. Selecciona otro origen.',
  invalid_map_key: 'Este valor no existe en las opciones del origen. Revisa la entrada del mapa.',
  duplicate_option: 'Los valores de las opciones no pueden repetirse.',
  immutable_variable: 'La variable externa de un campo guardado no puede cambiar.',
  missing_core_field: 'Debes conservar los campos esenciales de la versión origen.',
  changed_core_field: 'Conserva la identidad y protección del campo esencial.',
};

export function schemaErrorMessage(error: unknown, context: 'save' | 'load' = 'save'): string {
  if (error instanceof FormSchemaError) return error.issues.map(issue => `${issue.path}: ${issueMessages[issue.code] ?? issue.message}`).join('\n');
  if (error instanceof ZodError) return error.issues.map(issue => `${issue.path.join('.') || 'Propiedades'}: Revisa el valor y el formato de este campo.`).join('\n');
  if (error instanceof ApiError) {
    if (context === 'load' && error.status === 404) return 'Esta versión no existe o no pertenece al formulario. Vuelve al listado y selecciona una versión disponible.';
    if (context === 'load' && error.status === 500) return 'La estructura guardada no se pudo leer. Reintenta la carga o revisa el documento de esta versión.';
    if (error.status === 409) return 'La versión cambió o ya no es editable. Recarga para obtener el estado actual; tus cambios se conservaron.';
    const body = error.body as { issues?: { path: string; message: string; code?: string }[] } | undefined;
    if (Array.isArray(body?.issues)) return body.issues.map(issue => `${issue.path}: ${issueMessages[issue.code ?? ''] ?? issue.message}`).join('\n');
    return context === 'load' ? 'No se pudo cargar la estructura. Comprueba la conexión e intenta nuevamente.' : 'No se pudo guardar. Tus cambios se conservaron; comprueba la conexión e intenta nuevamente.';
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) return context === 'load' ? 'No se pudo conectar con la API. Comprueba la conexión e intenta nuevamente.' : 'No se pudo conectar con la API. Tus cambios se conservaron; comprueba la conexión e intenta nuevamente.';
  return error instanceof Error ? error.message : 'Error inesperado.';
}

type DraftState = {
  remote: VersionSchema | null; schema: FormSchemaDocument | null; baseline: FormSchemaDocument | null;
  dirty: boolean; saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'; error: string | null;
  hydrate: (remote: VersionSchema, discard?: boolean) => void;
  apply: (command: SchemaCommand) => boolean;
  save: (write: (schema: FormSchemaDocument, token: string) => Promise<VersionSchema>) => Promise<void>;
};

export function createFormBuilderStore(formId: string, versionId: string) {
  return createStore<DraftState>((set, get) => ({
    remote: null, schema: null, baseline: null, dirty: false, saveStatus: 'idle', error: null,
    hydrate: (remote, discard = false) => {
      if (remote.formId.toLowerCase() !== formId.toLowerCase() || remote.versionId.toLowerCase() !== versionId.toLowerCase()) return;
      if (get().saveStatus === 'saving' || (get().dirty && !discard)) return;
      if (!discard && get().remote?.rowVersion === remote.rowVersion) return;
      const schema = orderedSchema(remote.schema);
      set({ remote, schema, baseline: schema, dirty: false, saveStatus: 'idle', error: null });
    },
    apply: command => {
      const { schema, baseline, remote, saveStatus } = get();
      if (!schema || !baseline || remote?.status !== 'Draft' || saveStatus === 'saving') return false;
      try {
        const next = applySchemaCommand(schema, command, baseline);
        set({ schema: next, dirty: JSON.stringify(next) !== JSON.stringify(baseline),
          saveStatus: saveStatus === 'conflict' ? 'conflict' : 'idle', error: saveStatus === 'conflict' ? get().error : null });
        return true;
      } catch (error) { set({ error: schemaErrorMessage(error) }); return false; }
    },
    save: async write => {
      const state = get();
      if (!state.schema || !state.baseline || !state.remote || !state.dirty || state.remote.status !== 'Draft' || state.saveStatus === 'saving' || state.saveStatus === 'conflict') return;
      try {
        const snapshot = parseFormSchema(state.schema);
        protectBaseline(snapshot, state.baseline);
        set({ saveStatus: 'saving', error: null });
        const response = await write(snapshot, state.remote.rowVersion);
        if (response.formId.toLowerCase() !== formId.toLowerCase() || response.versionId.toLowerCase() !== versionId.toLowerCase()) throw new Error('Respuesta de guardado de otra versión.');
        const saved = orderedSchema(response.schema);
        set({ remote: response, schema: saved, baseline: saved, dirty: false, saveStatus: 'saved', error: null });
      } catch (error) {
        set({ saveStatus: error instanceof ApiError && error.status === 409 ? 'conflict' : 'error', error: schemaErrorMessage(error) });
      }
    },
  }));
}
