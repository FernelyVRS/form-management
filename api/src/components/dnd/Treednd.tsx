import { useMemo, useCallback } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { arrayMove } from '@dnd-kit/helpers';
import { Column } from './Column.js';
import { Item } from './Item.js';
import type { Seccion } from '@/types/seccion.ts';


type TreedndProps = {
    jsonFormStructure: Seccion[];
    handlerChangeStructure?: (newJsonFormStructure: Seccion[]) => void;
}

export default function Treednd({ jsonFormStructure, handlerChangeStructure }: TreedndProps) {
    const items = useMemo(() => jsonFormStructure, [jsonFormStructure]);

    const moveQuestionImmutable = useCallback((
        data: Seccion[],
        sourceSectionId: string,
        sourceIndex: number,
        targetSectionId: string,
        targetIndex: number
    ): Seccion[] => {
        const newData = data.map(section => ({
            ...section,
            preguntas: [...section.preguntas]
        }));

        const sourceSection = newData.find(se => se.id === sourceSectionId);
        const targetSection = newData.find(se => se.id === targetSectionId);

        if (!sourceSection || !targetSection) return data;

        const [question] = sourceSection.preguntas.splice(sourceIndex, 1);
        if (question) {
            targetSection.preguntas.splice(targetIndex, 0, question);
        }
        return newData;
    }, []);

    interface DragEvent {
        operation: {
            source: {
                type: string;
                sortable: {
                    initialIndex: number;
                    previousIndex: number;
                    initialGroup: string;
                    group: string;
                };
            };
        };
    }

    const dragEndHandler = useCallback((event: unknown) => {
        const e = event as DragEvent;
        const { source } = e.operation;
        const { initialIndex, previousIndex, initialGroup, group } = source.sortable;

        const sourceSectionId = initialGroup;
        const sourceIndex = initialIndex;
        const targetSectionId = group;
        const targetIndex = previousIndex;

        if (source.type === 'column') {
            const arrayWithColumnMoved = arrayMove([...items], initialIndex, previousIndex);
            handlerChangeStructure?.(arrayWithColumnMoved);
            return;
        }

        const questionMoved = moveQuestionImmutable(
            items,
            sourceSectionId,
            sourceIndex,
            targetSectionId,
            targetIndex
        );
        handlerChangeStructure?.(questionMoved);
    }, [items, moveQuestionImmutable, handlerChangeStructure]);

    if (!items.length) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                No hay secciones disponibles
            </div>
        );
    }

    return (
        <div>
            <DragDropProvider onDragEnd={dragEndHandler}>
                {items.map((seccion, indexx) => (
                    <Column key={seccion.id} seccion={seccion} index={indexx}>
                        {seccion.preguntas.map((pregunta, index) => (
                            <Item key={pregunta.id} index={index} column={seccion.id} pregunta={pregunta} />
                        ))}
                    </Column>
                ))}
            </DragDropProvider>
        </div>
    );
}