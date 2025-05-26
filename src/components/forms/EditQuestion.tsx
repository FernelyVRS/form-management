import { PreguntaWithSectionId } from "@/types"
import { FormProvider, useForm } from "react-hook-form"
import QuestionForm from "./QuestionForm"
import { useFormStructureStore } from "@/store/formStructure"
import { Seccion } from "@/types/seccion"

type EditQuestionProps = {
    setOpen: (value: boolean) => void
    isChieldQuestions?: boolean
    questionId: string
}

const getPreguntasWithSectionId = (data: Seccion[], questionId: string) => {
    const question = data?.reduce<PreguntaWithSectionId | undefined>((acc, section) => {
        if (acc) return acc;

        const found = section.preguntas.find(p => p.id === questionId);
        if (found) {
            return { ...found, sectionId: section.id };
        }

        return undefined;
    }, undefined);

    return question
}


const EditQuestion = ({ setOpen, questionId }: EditQuestionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const questionToEdit = getPreguntasWithSectionId(data, questionId)

    const form = useForm<PreguntaWithSectionId>({
        defaultValues: {
            ...questionToEdit
        }
    })

    const editPregunta = (questionEdited: PreguntaWithSectionId) => {
        const sectionWithQuestionEdited = data.map(section => {
            if (section.id === questionEdited.sectionId) {
                return {
                    ...section,
                    preguntas: [
                        ...section.preguntas.filter((question) => question.id !== questionEdited.id),
                        questionEdited
                    ]
                }
            }
            return section
        })

        setJsonFormStructure(sectionWithQuestionEdited)
    }

    const onSubmit = (data: PreguntaWithSectionId) => {
        editPregunta(data)
    }

    return (
        <FormProvider {...form} >
            <QuestionForm
                setOpen={setOpen}
                onSubmit={onSubmit}
                isChild={false}
            />
        </FormProvider>
        // <></>
    )
}

export default EditQuestion