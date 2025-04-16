import { useState } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { Column } from './Column.js';
import { Item } from './Item.js';
import { Seccion } from '@/types/seccion.ts';

export default function Treednd({ secciones }: { secciones: Seccion[] }) {
    const [items, setItems] = useState(secciones);

    const dragEndHandler = (event: any) => {
        const { source } = event.operation;
        if (source.type === 'column') return;
        setItems((items: any) => move(items, event));
    }

    return (
        <DragDropProvider onDragEnd={dragEndHandler} >
            <div className="container m-5">
                {items.map((seccion, index) => (
                    <Column key={seccion.titulo} seccion={seccion} index={index}>
                        {seccion.preguntas.map((pregunta, index) => (
                            <Item key={pregunta.label} index={index} column={seccion.titulo} pregunta={pregunta} />
                        ))}
                    </Column>
                ))}
            </div>
        </DragDropProvider>
    );
}