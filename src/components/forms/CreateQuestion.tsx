import { PreguntaWithSectionId } from "@/types"
import { FormProvider, useForm } from "react-hook-form"
import QuestionForm from "./QuestionForm"
import { useFormStructureStore } from "@/store/formStructure"

type CreateQuestionProps = {
    setOpen: (value: boolean) => void
    isChildQuestions?: boolean
}

const CreateQuestion = ({ setOpen, isChildQuestions }: CreateQuestionProps) => {

    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const form = useForm<PreguntaWithSectionId>({
        defaultValues: {
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