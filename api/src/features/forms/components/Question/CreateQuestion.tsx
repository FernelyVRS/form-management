import { PreguntaWithSectionId } from "@/types"
import { FormProvider, useForm } from "react-hook-form"
import QuestionForm from "./QuestionForm"
import { useFormStructureStore } from "@/store/formStructure"
import { ulid } from 'ulid'
import { useState } from "react"

type CreateQuestionProps = {
    setOpen: (value: boolean) => void
    isChildQuestions?: boolean
    onAddPreguntaHija?: (data: PreguntaWithSectionId) => void
}

const CreateQuestion = ({ setOpen, isChildQuestions, onAddPreguntaHija }: CreateQuestionProps) => {

    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const [isLoading, setIsLoading] = useState(false); // Add local loading state

    const questionFormMethods = useForm<PreguntaWithSectionId>({
        defaultValues: {
            id: "",
            core: false,
        },
        shouldUnregister: true
    })

    const addPreguntaToSection = (newQuestion: PreguntaWithSectionId) => {
        const sectionWithNewQuestion = data.map(section => {
            if (section.id === newQuestion.sectionId) {
                return {
                    ...section,
                    preguntas: [
                        ...section.preguntas,
                        newQuestion
                    ]
                }
            }
            return section
        })

        setJsonFormStructure(sectionWithNewQuestion)
    }

    const onSubmit = (data: PreguntaWithSectionId) => {
        setIsLoading(true); // Set loading to true on submit
        data.id = ulid()
        if (isChildQuestions && onAddPreguntaHija) {
            onAddPreguntaHija(data)
            setOpen(false)
            return
        }
        addPreguntaToSection(data)
    }

    //TODO : reset specific values when change "Tipo"

    return (
        <FormProvider {...questionFormMethods}>
            <QuestionForm
                setOpen={setOpen}
                onSubmit={onSubmit}
                isChild={isChildQuestions}
                isLoading={isLoading}
            />
        </FormProvider>
    )

}

export default CreateQuestion