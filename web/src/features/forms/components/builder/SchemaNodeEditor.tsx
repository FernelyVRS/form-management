import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X, LockKeyhole } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { FormSchemaDocument } from '../../model/formSchema';
import { fieldNodeSchema } from '../../model/formSchemaSchemas';
import { locations, type SchemaNode } from '../../model/formSchemaOperations';
import { schemaErrorMessage } from '../../builder/formBuilderStore';
import { DependencyMapEditor } from './DependencyMapEditor';
import { cn } from '@/lib/utils';

export type EditorTarget = { kind: SchemaNode['type']; node?: SchemaNode; parentId: string | null };
type Values = {
  id: string; label: string; description: string; entity: string; parentId: string;
  component: 'text' | 'number' | 'select'; variable: string; core: boolean;
  min: string; max: string; maxLength: string; mode: 'static' | 'dependent';
  dependency: string; map: string; options: { label: string; value: string }[];
};

export function SchemaNodeEditor({ target, schema, baseline, onClose, onApply, mode: presentation = 'dialog', onDirtyChange }: {
  target: EditorTarget; schema: FormSchemaDocument; baseline: FormSchemaDocument;
  onClose: (applied?: boolean) => void; onApply: (node: SchemaNode, parentId: string | null) => string | null;
  mode?: 'dialog' | 'panel'; onDirtyChange?: (dirty: boolean) => void;
}) {
  const node = target.node;
  const field = node?.type === 'field' ? node : undefined;
  const all = locations(schema);
  const persisted = field ? locations(baseline).find(item => item.node.id === field.id)?.node : undefined;
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const form = useForm<Values>({ defaultValues: {
    id: node?.id ?? '', label: node ? node.type === 'section' ? node.title : node.label : '',
    description: node?.description ?? '', entity: node?.type === 'section' ? node.entity : '',
    parentId: target.parentId ?? '', component: field?.component ?? 'text', variable: field?.variable ?? '', core: field?.core ?? false,
    min: field?.component === 'number' ? String(field.validation?.min ?? '') : '',
    max: field?.component === 'number' ? String(field.validation?.max ?? '') : '',
    maxLength: field?.component === 'text' ? String(field.validation?.maxLength ?? '') : '',
    mode: field?.component === 'select' && 'dependency' in field ? 'dependent' : 'static',
    dependency: field?.component === 'select' && 'dependency' in field ? field.dependency.field : '',
    map: field?.component === 'select' && 'map' in field ? JSON.stringify(field.map, null, 2) : '{}',
    options: field?.component === 'select' && 'options' in field ? field.options : [],
  }});
  const { register, control, handleSubmit, formState: { errors, isSubmitting, isDirty } } = form;
  const component = useWatch({ control, name: 'component' });
  const mode = useWatch({ control, name: 'mode' });
  const dependency = useWatch({ control, name: 'dependency' });
  const map = useWatch({ control, name: 'map' });
  const source = all.find(item => item.node.type === 'field' && item.node.variable === dependency)?.node;
  const optionRows = useFieldArray({ control, name: 'options' });
  const names = { section: 'sección', group: 'grupo', field: 'campo' };
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const submit = (values: Values) => {
    setError(null);
    try {
      if (!node && all.some(item => item.node.id === values.id)) throw new Error('Ese ID ya existe.');
      const description = values.description ? { description: values.description } : {};
      let next: SchemaNode;
      if (target.kind === 'section') next = { id: values.id, type: 'section', title: values.label, entity: values.entity,
        order: node?.order ?? 1, items: node?.type === 'section' ? node.items : [], ...description };
      else if (target.kind === 'group') next = { id: values.id, type: 'group', label: values.label,
        order: node?.order ?? 1, items: node?.type === 'group' ? node.items : [], ...description };
      else {
        const base = { id: values.id, type: 'field', label: values.label, variable: values.variable,
          core: persisted?.type === 'field' && persisted.core ? true : values.core,
          order: node?.order ?? 1, component: values.component, ...description };
        const validation = component === 'text'
          ? (values.maxLength === '' ? {} : { maxLength: Number(values.maxLength) })
          : { ...(values.min === '' ? {} : { min: Number(values.min) }), ...(values.max === '' ? {} : { max: Number(values.max) }) };
        next = fieldNodeSchema.parse(component === 'select'
          ? mode === 'static' ? { ...base, options: values.options } : { ...base, dependency: { field: values.dependency }, map: JSON.parse(values.map) }
          : { ...base, ...(Object.keys(validation).length ? { validation } : {}) });
      }
      const problem = onApply(next, target.kind === 'section' ? null : values.parentId);
      if (problem) setError(problem); else onClose(true);
    } catch (issue) { setError(schemaErrorMessage(issue)); }
  };

  const title = `${node ? 'Editar' : 'Crear'} ${names[target.kind]}`;
  const content = <form id="schema-node-editor-form" noValidate autoComplete="off" onSubmit={handleSubmit(submit)} className={cn('flex min-h-0 min-w-0 flex-col', presentation === 'panel' ? 'flex-1' : 'max-h-[calc(90dvh-9rem)]')}>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-4 pr-1">
        <FieldSet className="min-w-0"><FieldLegend variant="label">Información general</FieldLegend><FieldGroup className="gap-4">
          <Field data-invalid={!!errors.label}><FieldLabel htmlFor="node-label">{target.kind === 'section' ? 'Título' : 'Etiqueta'}</FieldLabel>
            <Input id="node-label" placeholder="Ej. Nombre de la persona…" aria-invalid={!!errors.label} {...register('label', { required: 'El título o etiqueta es obligatorio.' })} />
            <FieldError errors={[errors.label]} /></Field>
          <Field><FieldLabel htmlFor="node-description">Descripción</FieldLabel><Textarea id="node-description" placeholder="Instrucciones o ayuda para responder…" rows={3} {...register('description')} />
            <FieldDescription>{target.kind === 'field' ? 'Se mostrará como ayuda junto a la pregunta.' : 'Se mostrará debajo del título.'}</FieldDescription></Field>
          {target.kind === 'section' ? <Field data-invalid={!!errors.entity}><FieldLabel htmlFor="node-entity">Entidad</FieldLabel>
            <Input id="node-entity" placeholder="Ej. Persona…" aria-invalid={!!errors.entity} {...register('entity', { required: 'La entidad es obligatoria.' })} /><FieldError errors={[errors.entity]} /></Field> :
            <Field><FieldLabel htmlFor="node-parent">Contenedor</FieldLabel>
              <NativeSelect id="node-parent" {...register('parentId', { required: true })}>
                {all.filter(item => item.node.type === 'section' || (target.kind === 'field' && item.node.type === 'group')).map(item =>
                  <NativeSelectOption key={item.node.id} value={item.node.id}>{item.node.type === 'section' ? item.node.title : item.node.type === 'group' ? item.node.label : ''}</NativeSelectOption>)}
              </NativeSelect></Field>}
        </FieldGroup></FieldSet>
          {target.kind === 'field' ? <FieldSet className="min-w-0"><FieldLegend variant="label">Tipo y comportamiento</FieldLegend><FieldGroup className="gap-4">
            <Field><FieldLabel htmlFor="node-component">Componente</FieldLabel><NativeSelect id="node-component" {...register('component')}>
              <NativeSelectOption value="text">Texto</NativeSelectOption><NativeSelectOption value="number">Número</NativeSelectOption><NativeSelectOption value="select">Selección</NativeSelectOption>
            </NativeSelect></Field>
            {component === 'text' ? <Field data-invalid={!!errors.maxLength}><FieldLabel htmlFor="node-max-length">Longitud máxima</FieldLabel><Input id="node-max-length" type="number" min={1} step={1} aria-invalid={!!errors.maxLength}
              {...register('maxLength', { validate: value => value === '' || (Number.isInteger(Number(value)) && Number(value) > 0) || 'Introduce un entero mayor que cero.' })} /><FieldError errors={[errors.maxLength]} /></Field> : null}
            {component === 'number' ? <>
              <Field data-invalid={!!errors.min}><FieldLabel htmlFor="node-min">Mínimo</FieldLabel><Input id="node-min" type="number" step="any" aria-invalid={!!errors.min} {...register('min', { validate: value => value === '' || Number.isFinite(Number(value)) || 'Introduce un número válido.' })} /><FieldError errors={[errors.min]} /></Field>
              <Field data-invalid={!!errors.max}><FieldLabel htmlFor="node-max">Máximo</FieldLabel><Input id="node-max" type="number" step="any" aria-invalid={!!errors.max} {...register('max', { validate: value => {
                if (value === '') return true;
                if (!Number.isFinite(Number(value))) return 'Introduce un número válido.';
                const min = form.getValues('min');
                return min === '' || Number(min) <= Number(value) || 'El máximo debe ser mayor o igual que el mínimo.';
              } })} /><FieldError errors={[errors.max]} /></Field>
            </> : null}
            {component === 'select' ? <>
              <Field><FieldLabel htmlFor="node-mode">Opciones</FieldLabel><NativeSelect id="node-mode" {...register('mode')}>
                <NativeSelectOption value="static">Estáticas</NativeSelectOption><NativeSelectOption value="dependent">Dependientes</NativeSelectOption>
              </NativeSelect></Field>
              {mode === 'static' ? <FieldGroup className="gap-3">
                {optionRows.fields.map((option, index) => <div key={option.id} className="flex items-end gap-2">
                  <Field className="min-w-0 flex-1" data-invalid={!!errors.options?.[index]?.label}><FieldLabel htmlFor={`option-label-${index}`}>Etiqueta opción {index + 1}</FieldLabel><Input id={`option-label-${index}`} placeholder="Ej. Sí…" aria-invalid={!!errors.options?.[index]?.label} {...register(`options.${index}.label`, { required: 'Añade una etiqueta.' })} /><FieldError errors={[errors.options?.[index]?.label]} /></Field>
                  <Field className="min-w-0 flex-1" data-invalid={!!errors.options?.[index]?.value}><FieldLabel htmlFor={`option-value-${index}`}>Valor opción {index + 1}</FieldLabel><Input id={`option-value-${index}`} spellCheck={false} placeholder="Ej. 1…" aria-invalid={!!errors.options?.[index]?.value} {...register(`options.${index}.value`, { required: 'Añade un valor.' })} /><FieldError errors={[errors.options?.[index]?.value]} /></Field>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar opción ${index + 1}`} onClick={() => optionRows.remove(index)}><Trash2 aria-hidden="true" /></Button>
                </div>)}
                <Button type="button" variant="outline" onClick={() => optionRows.append({ label: '', value: '' })}><Plus data-icon="inline-start" aria-hidden="true" />Agregar opción</Button>
              </FieldGroup> : <>
                <Field><FieldLabel htmlFor="node-dependency">Variable origen</FieldLabel><NativeSelect id="node-dependency" {...register('dependency')}>
                  <NativeSelectOption value="">Selecciona un origen</NativeSelectOption>
                  {all.filter(item => item.node.type === 'field' && item.node.component === 'select' && item.node.id !== node?.id).map(item =>
                    <NativeSelectOption key={item.node.id} value={item.node.type === 'field' ? item.node.variable : ''}>{item.node.type === 'field' ? `${item.node.label} (${item.node.variable})` : ''}</NativeSelectOption>)}
                </NativeSelect></Field>
                <DependencyMapEditor value={map} source={source?.type === 'field' && source.component === 'select' ? source : undefined}
                  onChange={value => form.setValue('map', value, { shouldDirty: true })} />
                <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">JSON avanzado del mapa</summary>
                  <Field className="mt-3"><FieldLabel htmlFor="node-map">Mapa de opciones (JSON)</FieldLabel><Textarea id="node-map" rows={8} spellCheck={false} {...register('map')} />
                  <FieldDescription>{'Ejemplo: {"1":[{"label":"Primero","value":"1"}]}.'}</FieldDescription></Field></details>
              </>}
            </> : null}
          </FieldGroup></FieldSet> : null}
        <details open={!node} className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Identificación técnica</summary>
          <FieldGroup className="mt-4 gap-4">
            <Field data-invalid={!!errors.id}><FieldLabel htmlFor="node-id">ID técnico</FieldLabel>
              <Input id="node-id" autoComplete="off" spellCheck={false} readOnly={!!node} placeholder="Ej. nombre_persona…" aria-invalid={!!errors.id} {...register('id', { required: 'El ID es obligatorio.', pattern: { value: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, message: 'Usa snake_case.' } })} />
              <FieldDescription>Identificador interno. No cambia después de crear el elemento.</FieldDescription><FieldError errors={[errors.id]} /></Field>
            {target.kind === 'field' ? <>
              <Field data-invalid={!!errors.variable}><FieldLabel htmlFor="node-variable">Variable externa</FieldLabel>
                <Input id="node-variable" autoComplete="off" spellCheck={false} readOnly={!!persisted} placeholder="Ej. NombrePersona…" aria-invalid={!!errors.variable} {...register('variable', { required: 'La variable es obligatoria.', pattern: { value: /^[A-Z][A-Za-z0-9]*$/, message: 'Usa PascalCase.' } })} />
                <FieldDescription>{persisted ? 'La clave del sistema externo está protegida.' : 'Clave del sistema externo en PascalCase.'}</FieldDescription><FieldError errors={[errors.variable]} /></Field>
              <Field orientation="horizontal" data-disabled={persisted?.type === 'field' && persisted.core}><Input id="node-core" type="checkbox" className="size-4 shrink-0" disabled={persisted?.type === 'field' && persisted.core} {...register('core')} />
                <FieldLabel htmlFor="node-core"><LockKeyhole aria-hidden="true" className="size-4" />Campo esencial (core)</FieldLabel></Field>
            </> : null}
          </FieldGroup>
        </details>
        {error ? <FieldError ref={errorRef} tabIndex={-1} className="scroll-mb-24 whitespace-pre-wrap break-words" aria-live="polite">{error}</FieldError> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
          <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>Aplicar al borrador</Button>
          <p className="w-full text-right text-xs text-muted-foreground">Después, pulsa Guardar para enviar los cambios.</p>
        </div>
      </form>;
  if (presentation === 'panel') return <section aria-label="Propiedades del elemento" className="flex h-full min-h-0 min-w-0 flex-col gap-5">
    <header className="flex shrink-0 items-start justify-between gap-3"><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">Personaliza el elemento seleccionado.</p></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Cerrar propiedades" onClick={() => onClose()}><X aria-hidden="true" /></Button></header>{content}
  </section>;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent data-builder-overlay className="max-h-[90dvh] overflow-y-auto overscroll-contain sm:max-w-2xl" onOpenAutoFocus={event => { event.preventDefault(); dialogTitleRef.current?.focus(); }}>
      <DialogHeader><DialogTitle ref={dialogTitleRef} tabIndex={-1}>{title}</DialogTitle><DialogDescription>Personaliza el elemento. Aplica al borrador y luego guarda.</DialogDescription></DialogHeader>{content}
    </DialogContent>
  </Dialog>;
}
