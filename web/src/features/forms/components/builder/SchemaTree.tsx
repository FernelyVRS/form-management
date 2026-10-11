import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, LockKeyhole, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import type { FormSchemaDocument } from '../../model/formSchema';
import type { NodeLocation, SchemaCommand, SchemaNode } from '../../model/formSchemaOperations';
import type { EditorTarget } from './SchemaNodeEditor';
import { FieldHelp } from './FieldHelp';
import { nodeIcon, nodeLabel, nodeTitle } from './builderUi';

export type TreeProps = {
  schema: FormSchemaDocument; editable: boolean; selectedId?: string | null;
  onSelect?: (item: NodeLocation) => void;
  onEdit?: (target: EditorTarget) => void; onRemove?: (node: SchemaNode) => void; onCommand?: (command: SchemaCommand) => void;
  wrap?: (node: SchemaNode, content: ReactNode) => ReactNode;
  drop?: (parentId: string | null, index: number, accepts: string[]) => ReactNode;
};

export function SchemaTree(props: TreeProps) {
  const { schema, editable, onEdit, onRemove, onCommand, onSelect, selectedId, wrap, drop } = props;
  const render = (nodes: SchemaNode[], parentId: string | null, accepts: string[]): ReactNode => <div className="flex min-w-0 flex-col gap-1">
    {nodes.map((node, index) => {
      const title = nodeTitle(node);
      const Icon = nodeIcon(node);
      const location = { node, parentId, index };
      const content = <Card id={`node_${node.id}`} data-node-id={node.id} data-selected={selectedId === node.id}
        className={cn('min-w-0 gap-3 py-3', selectedId === node.id ? 'ring-2 ring-ring/50' : '')}>
        <CardHeader className="px-4">
          <div className={cn('flex min-w-0 flex-wrap items-start gap-2', editable ? 'pl-7' : '')}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon aria-hidden="true" className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><span className="tabular-nums">{node.order.toString().padStart(2, '0')}</span><span>{nodeLabel(node)}</span>
                {node.type === 'field' && node.core ? <LockKeyhole aria-label="Campo esencial" className="size-3" /> : null}</p>
              <CardTitle className="flex min-w-0 items-center gap-1">
                <button type="button" className="min-w-0 rounded text-left leading-snug break-words underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${editable ? 'Editar' : 'Inspeccionar'} ${title}`} aria-pressed={selectedId === node.id}
                  onClick={() => onSelect ? onSelect(location) : onEdit?.({ kind: node.type, node, parentId })}>{title}</button>
                {node.type === 'field' && node.description ? <FieldHelp label={title} description={node.description} /> : null}
              </CardTitle>
              {node.type === 'field' ? <p className="mt-1 truncate text-xs text-muted-foreground" translate="no" title={node.variable}>{node.variable}</p> : null}
            </div>
            {editable ? <div className="flex w-full shrink-0 items-center justify-end gap-0.5 sm:w-auto">
              <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${title}`} disabled={index === 0} onClick={() => onCommand?.({ type: 'move', id: node.id, parentId, index: index - 1 })}><ArrowUp aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${title}`} disabled={index === nodes.length - 1} onClick={() => onCommand?.({ type: 'move', id: node.id, parentId, index: index + 1 })}><ArrowDown aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar ${title}`} onClick={() => onRemove?.(node)}><Trash2 aria-hidden="true" /></Button>
            </div> : null}
          </div>
          {node.type !== 'field' ? <div className="mt-2 flex flex-col gap-2">
            {node.description ? <CardDescription className="break-words">{node.description}</CardDescription> : null}
            {node.type === 'section' ? <div className="flex min-w-0 flex-wrap items-center gap-2"><Badge variant="outline" className="max-w-full truncate" title={node.entity} translate="no">{node.entity}</Badge><span className="text-xs text-muted-foreground">{node.items.length} elementos</span></div> : null}
          </div> : null}
        </CardHeader>
        <CardContent className="px-4">
          {node.type !== 'field' ? render(node.items, node.id, node.type === 'section' ? ['field', 'group'] : ['field']) : <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {node.component === 'select' ? 'options' in node ? <>
              {node.options.slice(0, 3).map(option => <Badge key={option.value} variant="secondary" className="max-w-full truncate">{option.label}</Badge>)}
              {node.options.length > 3 ? <span>+{node.options.length - 3} opciones</span> : null}
              {!node.options.length ? <span>Sin opciones configuradas</span> : null}
            </> : <><GitBranch aria-hidden="true" className="size-3" /><span className="min-w-0 break-words">Depende de <span translate="no">{node.dependency.field}</span> · {Object.keys(node.map).length} valores configurados</span></> :
              node.component === 'text' && node.validation?.maxLength ? <span>Máximo {node.validation.maxLength} caracteres</span> :
              node.component === 'number' && node.validation ? <span>{node.validation.min !== undefined ? `Mínimo ${node.validation.min}` : ''}{node.validation.min !== undefined && node.validation.max !== undefined ? ' · ' : ''}{node.validation.max !== undefined ? `Máximo ${node.validation.max}` : ''}</span> : null}
          </div>}
        </CardContent>
        {editable && node.type !== 'field' ? <CardFooter className="flex flex-wrap gap-2 px-4">
          <Button type="button" variant="outline" size="sm" aria-label={`Crear campo en ${title}`} onClick={() => onEdit?.({ kind: 'field', parentId: node.id })}><Plus data-icon="inline-start" aria-hidden="true" />Pregunta</Button>
          {node.type === 'section' ? <Button type="button" variant="ghost" size="sm" aria-label={`Crear grupo en ${title}`} onClick={() => onEdit?.({ kind: 'group', parentId: node.id })}><Plus data-icon="inline-start" aria-hidden="true" />Grupo</Button> : null}
        </CardFooter> : null}
      </Card>;
      return <div key={node.id} className="min-w-0">{drop?.(parentId, index, accepts)}{wrap ? wrap(node, content) : content}</div>;
    })}
    {drop?.(parentId, nodes.length, accepts)}
    {!nodes.length ? <Empty className="border py-6"><EmptyHeader><EmptyTitle>{parentId ? 'Contenedor vacío' : 'Sin secciones'}</EmptyTitle>
      <EmptyDescription>{editable ? parentId ? 'Añade una pregunta o arrástrala aquí.' : 'Crea una sección para comenzar tu formulario.' : 'No hay elementos en esta estructura.'}</EmptyDescription></EmptyHeader></Empty> : null}
  </div>;
  return render(schema.sections, null, ['section']);
}
