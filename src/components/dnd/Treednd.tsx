import { DragDropProvider } from '@dnd-kit/react';
import { arrayMove } from '@dnd-kit/helpers';
import { Column } from './Column.js';
import { Item } from './Item.js';
import { Seccion } from '@/types/seccion.ts';
import { useState } from 'react';
import { useFormStructureStore } from '@/store/formStructure.js';


type TreedndProps = {
    jsonFormStructure: Seccion[],
    handlerChangeStructure: (newJsonFormStructure: Seccion[]) => void
}

export default function Treednd({ jsonFormStructure, handlerChangeStructure }: TreedndProps) {
    const [items, setItems] = useState(jsonFormStructure)
    const setFormStructureStore = useFormStructureStore(store => store.setFormStructure)
    // const items = useFormStructureStore(store => store.formStructure)

    const moveQuestionImmutable = (data: Seccion[], sourceSectionId: any, sourceIndex: any, targetSectionId: any, targetIndex: any) => {
        const newData = structuredClone(data)
        const sourceSection = newData.find(se => se.id === sourceSectionId);
        const targetSection = newData.find(se => se.id === targetSectionId);

        if (!sourceSection || !targetSection) return data;

        const [question] = sourceSection.preguntas.splice(sourceIndex, 1);
        if (question) {
            targetSection.preguntas.splice(targetIndex, 0, question);
        }
        return newData;
    }

    const dragEndHandler = (event: any) => {
        const { source } = event.operation;
        const { initialIndex, previousIndex, initialGroup, group } = source.sortable

        const sourceSectionId = initialGroup;
        const sourceIndex = initialIndex;
        const targetSectionId = group;
        const targetIndex = previousIndex;

        const i = structuredClone(items)
        if (source.type === 'column') {
            const arrayWithColumnMoved = arrayMove(i, initialIndex, previousIndex)
            setItems(arrayWithColumnMoved)
            // setFormStructureStore(arrayWithColumnMoved)
            // handlerChangeStructure(arrayWithColumnMoved);
            return
        };

        const questionMoved = moveQuestionImmutable(i, sourceSectionId, sourceIndex, targetSectionId, targetIndex);
        setItems(questionMoved)
        // setFormStructureStore([...questionMoved])
        // handlerChangeStructure(questionMoved);
    };

    return (
        <div >
            <DragDropProvider
                // onDragEnd={dragEndHandler}
                onDragEnd={(event) => {
                    dragEndHandler(event);
                }}>
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