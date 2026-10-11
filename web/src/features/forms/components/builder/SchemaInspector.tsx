import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NodeLocation } from '../../model/formSchemaOperations';
import { nodeLabel, nodeTitle } from './builderUi';

export function SchemaInspector({ selected, editable, onEdit }: { selected: NodeLocation; editable: boolean; onEdit: () => void }) {
  const { node } = selected;
  return <div className="flex min-w-0 flex-col gap-4">
    <Badge variant="secondary" className="self-start">{nodeLabel(node)}</Badge>
    <h3 className="font-semibold break-words">{nodeTitle(node)}</h3>
    <p className="text-sm text-muted-foreground break-words">{node.description ?? 'Sin descripción.'}</p>
    <dl className="flex flex-col gap-3 text-sm">
      <div><dt className="text-xs text-muted-foreground">ID técnico</dt><dd className="mt-1 break-all" translate="no">{node.id}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Orden</dt><dd className="mt-1 tabular-nums">{node.order}</dd></div>
      {node.type === 'section' ? <div><dt className="text-xs text-muted-foreground">Entidad</dt><dd className="mt-1 break-all" translate="no">{node.entity}</dd></div> : null}
      {node.type === 'field' ? <>
        <div><dt className="text-xs text-muted-foreground">Variable externa</dt><dd className="mt-1 break-all" translate="no">{node.variable}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Protección</dt><dd className="mt-1">{node.core ? 'Campo esencial' : 'Campo editable'}</dd></div>
        {node.component === 'select' && 'dependency' in node ? <div><dt className="text-xs text-muted-foreground">Pregunta origen</dt><dd className="mt-1 break-all" translate="no">{node.dependency.field}</dd></div> : null}
      </> : null}
    </dl>
    {editable ? <Button variant="outline" onClick={onEdit}>Editar propiedades</Button> : null}
  </div>;
}
