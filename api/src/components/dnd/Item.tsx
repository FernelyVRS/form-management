import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '../ui/button';
import { GripVertical } from 'lucide-react';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Pregunta } from '@/types';
// import { Badge } from './ui/badge';

type ItemProp = {
    index: number,
    column: string | undefined,
    pregunta: Pregunta
}

export function Item({ index, column, pregunta }: ItemProp) {
    const { ref, handleRef, isDragging } = useSortable({
        id: pregunta.id,
        index,
        type: 'item',
        accept: 'item',
        group: column,
        modifiers: [RestrictToVerticalAxis]
    });

    return (
        <div
            className='border-1 py-3 flex items-center justify-between space-x-4 px-4'
            ref={ref}
            data-dragging={isDragging}>
            <div className='flex items-center space-x-4'>
                <div className='text-sm'>
                    {pregunta.label}
                </div>
                {/* <Badge variant="secondary">
                </Badge> */}
                <p className='text-gray-400'>
                    {pregunta.tipo}
                </p>
            </div>
            <div className='text-sm'>
                <Button ref={handleRef} variant="ghost" size="sm" className='w-9 p-0'>
                    <GripVertical className="text-gray-500 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}