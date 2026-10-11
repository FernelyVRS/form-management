import { useState, type ReactNode } from 'react';
import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SchemaTree, type TreeProps } from './SchemaTree';
import { locations, type SchemaNode } from '../../model/formSchemaOperations';

function DragFrame({ node, children }: { node: SchemaNode; children: ReactNode }) {
  const { ref, handleRef, isDragging } = useDraggable({ id: node.id, type: node.type });
  return <div ref={ref} className={cn('relative min-w-0', isDragging ? 'select-none opacity-50' : '')}>
    <Button ref={handleRef} type="button" variant="ghost" size="icon" className="absolute left-2 top-3 touch-none" aria-label={`Arrastrar ${node.type === 'section' ? node.title : node.label}`}><GripVertical aria-hidden="true" /></Button>
    <div inert={isDragging}>{children}</div>
  </div>;
}

function DropTarget({ parentId, index, accepts, active }: { parentId: string | null; index: number; accepts: string[]; active: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: `drop_${parentId ?? 'root'}_${index}`, accept: accepts, data: { parentId, index } });
  return <div ref={ref} data-testid={`drop-${parentId ?? 'root'}-${index}`} className={cn('flex min-h-3 items-center justify-center rounded text-xs text-muted-foreground', active ? 'min-h-7 border border-dashed' : '', isDropTarget ? 'bg-accent ring-1 ring-ring' : '')}><span className={active ? '' : 'sr-only'}>Soltar aquí</span></div>;
}

export default function DraggableSchemaTree(props: TreeProps) {
  const [active, setActive] = useState(false);
  return <DragDropProvider onDragStart={() => setActive(true)} onDragEnd={event => {
    setActive(false);
    if (event.canceled) return;
    const { source, target } = event.operation;
    if (!source || !target) return;
    const data = target.data;
    if (typeof data.index !== 'number' || (data.parentId !== null && typeof data.parentId !== 'string')) return;
    const original = locations(props.schema).find(item => item.node.id === String(source.id));
    const index = original && original.parentId === data.parentId && original.index < data.index ? data.index - 1 : data.index;
    props.onCommand?.({ type: 'move', id: String(source.id), parentId: data.parentId, index });
  }}>
    <SchemaTree {...props} wrap={(node, content) => <DragFrame node={node}>{content}</DragFrame>}
      drop={(parentId, index, accepts) => <DropTarget parentId={parentId} index={index} accepts={accepts} active={active} />} />
  </DragDropProvider>;
}
