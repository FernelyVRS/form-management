import React from 'react';
import { CollisionPriority, } from '@dnd-kit/abstract';
import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '../ui/button';
import { GripVertical } from 'lucide-react'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { Seccion } from '@/types/seccion';
import { Badge } from '../ui/badge';

type ColumnProp = {
    children: React.ReactNode[],
    seccion: Seccion,
    index: number
}

export function Column({ children, seccion, index }: ColumnProp) {
    const { ref, handleRef } = useSortable({
        id: seccion.id,
        index,
        type: 'column',
        collisionPriority: CollisionPriority.Low,
        accept: ['column', 'item'],
        modifiers: [RestrictToVerticalAxis]
    });

    // const [isOpen, setIsOpen] = useState(true)

    return (
        <div ref={ref}>
            <div className='border-1 py-3'>
                <div className='px-4 flex items-center justify-between space-x-4 text-sm'>
                    <div className='flex items-center space-x-4'>
                        <h1 className='font-bold'>Seccion {seccion.orden} - {seccion.titulo}</h1>
                        <Badge variant="outline">
                            {seccion.entidad}
                        </Badge>
                    </div>
                    <div className='text-sm'>
                        <Button ref={handleRef} variant="ghost" size="sm" className='w-9 p-0'>
                            <GripVertical className="text-gray-500 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className='ms-7'>
                {children}
            </div>
        </div>
    );
}