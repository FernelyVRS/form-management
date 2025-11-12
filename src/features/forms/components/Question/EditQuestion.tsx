import { PreguntaWithSectionId } from "@/types"
import { FormProvider, useForm } from "react-hook-form"
import QuestionForm from "./QuestionForm"
import { useFormStructureStore } from "@/store/formStructure"
import { Seccion } from "@/types/seccion"
import { useState } from "react"

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
    console.log('question to edit ---> ', question)
    return question
}


const EditQuestion = ({ setOpen, questionId }: EditQuestionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const [isLoading, setIsLoading] = useState(false); // Add local loading state

    const questionToEdit = getPreguntasWithSectionId(data, questionId)
    const { id } = questionToEdit || {}


    const form = useForm<PreguntaWithSectionId>({
        defaultValues: {
            ...questionToEdit
        },
        shouldUnregister: true
    })

    const editPregunta = ({ questionEdited, questionId }: { questionEdited: PreguntaWithSectionId, questionId: string }) => {
        questionEdited.id = questionId
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
        setIsLoading(true); // Set loading to true on submit
        editPregunta({ questionEdited: data, questionId: id as string });
    }

    return (
        <FormProvider {...form} >
            <QuestionForm
                setOpen={setOpen}
                onSubmit={onSubmit}
                isChild={false}
                isLoading={isLoading}
            />
        </FormProvider>
    )
}

export default EditQuestion