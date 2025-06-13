import { PreguntaWithSectionId } from "@/types"
import { FormProvider, useForm } from "react-hook-form"
import QuestionForm from "./QuestionForm"
import { useFormStructureStore } from "@/store/formStructure"
import { ulid } from 'ulid'

type CreateQuestionProps = {
    setOpen: (value: boolean) => void
    isChildQuestions?: boolean
    onAddPreguntaHija?: (data: PreguntaWithSectionId) => void
}

const CreateQuestion = ({ setOpen, isChildQuestions, onAddPreguntaHija }: CreateQuestionProps) => {

    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const form = useForm<PreguntaWithSectionId>({
        defaultValues: {
            id: "",
            // label: "",
            // options: [{ description: "", value: "" }],
            // options: [{ description: "", value: "" }],
            // preguntasHijas: [
            //     {
            //         label: "Pregunta hija",
            //         tipo: "text",
            //         orden: 0,
            //         core: false,
            //         variable: "TieneRadio",
            //     }
            // ],
        }
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
        <FormProvider {...form}>
            <QuestionForm
                setOpen={setOpen}
                onSubmit={onSubmit}
                isChild={isChildQuestions} />
        </FormProvider>
    )

}

export default CreateQuestion