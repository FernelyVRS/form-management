import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { SelectFieldNode } from '../../model/formSchema';

const draftMapSchema = z.record(z.array(z.object({ label: z.string(), value: z.string() }).strict()));

export function DependencyMapEditor({ value, source, onChange }: {
  value: string; source?: SelectFieldNode; onChange: (value: string) => void;
}) {
  let parsed: z.SafeParseReturnType<unknown, z.infer<typeof draftMapSchema>>;
  try { parsed = draftMapSchema.safeParse(JSON.parse(value)); }
  catch { return <Alert variant="destructive"><AlertTitle>El mapa no es JSON válido</AlertTitle><AlertDescription>Corrige el JSON avanzado para recuperar la edición visual.</AlertDescription></Alert>; }
  if (!parsed.success) return <Alert variant="destructive"><AlertTitle>Revisa el formato del mapa</AlertTitle><AlertDescription>Cada entrada debe ser una lista de opciones con etiqueta y valor.</AlertDescription></Alert>;
  const map = parsed.data;
  const possible = source ? 'options' in source ? source.options : Object.values(source.map).flat() : [];
  const values = new Map(possible.map(option => [option.value, option.label]));
  const keys = [...new Set([...values.keys(), ...Object.keys(map)])];
  if (!source) return <FieldDescription>Selecciona la pregunta origen para configurar sus opciones.</FieldDescription>;
  if (!keys.length) return <FieldDescription>El origen aún no tiene opciones. Añádelas antes de configurar la dependencia.</FieldDescription>;
  return <FieldGroup className="gap-4">
    {keys.map((key, keyIndex) => {
      const options = map[key] ?? [];
      const write = (next: typeof options) => onChange(JSON.stringify({ ...map, [key]: next }, null, 2));
      return <FieldGroup key={key} role="group" aria-label={`Opciones para ${values.get(key) ?? key}`} className="min-w-0 rounded-lg border p-3 gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium"><span className="min-w-0 break-words">Si el origen es {values.get(key) ?? key}</span><Badge variant="outline" className="max-w-full truncate" title={key} translate="no">{key}</Badge></div>
        {!values.has(key) ? <FieldDescription>Este valor no existe en el origen. <Button type="button" variant="ghost" size="sm" onClick={() => { const next = { ...map }; delete next[key]; onChange(JSON.stringify(next, null, 2)); }}>Quitar entrada</Button></FieldDescription> : null}
        {options.map((option, index) => <div key={index} className="flex items-end gap-2">
          <Field className="min-w-0 flex-1"><FieldLabel htmlFor={`map-label-${keyIndex}-${index}`}>Etiqueta {index + 1}</FieldLabel>
            <Input id={`map-label-${keyIndex}-${index}`} name={`map.${key}.${index}.label`} autoComplete="off" value={option.label} placeholder="Ej. Asunción…" onChange={event => write(options.map((item, at) => at === index ? { ...item, label: event.target.value } : item))} /></Field>
          <Field className="min-w-0 flex-1"><FieldLabel htmlFor={`map-value-${keyIndex}-${index}`}>Valor {index + 1}</FieldLabel>
            <Input id={`map-value-${keyIndex}-${index}`} name={`map.${key}.${index}.value`} autoComplete="off" spellCheck={false} value={option.value} placeholder="Ej. asuncion…" onChange={event => write(options.map((item, at) => at === index ? { ...item, value: event.target.value } : item))} /></Field>
          <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar opción ${index + 1} para ${key}`} onClick={() => write(options.filter((_, at) => at !== index))}><Trash2 aria-hidden="true" /></Button>
        </div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => write([...options, { label: '', value: '' }])}><Plus data-icon="inline-start" aria-hidden="true" />Agregar opción para {values.get(key) ?? key}</Button>
        {!options.length ? <FieldDescription>Sin opciones: la pregunta mostrará una lista vacía para este valor.</FieldDescription> : null}
      </FieldGroup>;
    })}
  </FieldGroup>;
}
