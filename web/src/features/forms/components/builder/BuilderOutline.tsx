import { useState } from 'react';
import { Search, Plus, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FormSchemaDocument } from '../../model/formSchema';
import { locations, type NodeLocation } from '../../model/formSchemaOperations';
import { fieldCount, nodeIcon, nodeLabel, nodeTitle } from './builderUi';

export function BuilderOutline({ schema, selectedId, editable, onSelect, onCreate }: {
  schema: FormSchemaDocument; selectedId: string | null; editable: boolean;
  onSelect: (item: NodeLocation) => void; onCreate: () => void;
}) {
  const [search, setSearch] = useState('');
  const all = locations(schema);
  const results = all.filter(({ node }) => `${nodeTitle(node)} ${node.id} ${node.type === 'field' ? node.variable : ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <nav aria-label="Estructura del formulario" className="flex h-full min-w-0 flex-col gap-4">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Estructura</h2>
      <Badge variant="secondary" className="tabular-nums">{fieldCount(schema)} preguntas</Badge></div>
    <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
      <Input name="builder-search" aria-label="Buscar en la estructura" autoComplete="off" placeholder="Buscar pregunta…" className="pl-9" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
      {results.map(item => {
        const { node } = item;
        const Icon = nodeIcon(node);
        const parent = all.find(entry => entry.node.id === item.parentId)?.node;
        return <button type="button" key={node.id} aria-label={`Seleccionar ${nodeTitle(node)}`} aria-current={selectedId === node.id ? 'true' : undefined}
          onClick={() => onSelect(item)} className={cn('flex min-h-10 w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
            selectedId === node.id ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground',
            node.type === 'section' ? 'mt-2 font-medium text-foreground' : parent?.type === 'group' ? 'pl-7' : 'pl-4')}>
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate" title={nodeTitle(node)}>{nodeTitle(node)}</span>
          {node.type === 'field' && node.core ? <LockKeyhole aria-label="Campo esencial" className="size-3 shrink-0" /> : null}
          <span className="sr-only">{nodeLabel(node)}</span>
        </button>;
      })}
      {!results.length ? <p className="p-2 text-sm text-muted-foreground">{search ? 'No hay coincidencias.' : 'Añade tu primera sección.'}</p> : null}
    </div>
    {editable ? <Button type="button" variant="outline" onClick={onCreate}><Plus data-icon="inline-start" aria-hidden="true" />Crear sección</Button> : null}
    <p className="text-xs leading-relaxed text-muted-foreground">Selecciona una pregunta para editar sus propiedades. Arrastra el asa o usa las flechas para moverla.</p>
  </nav>;
}
