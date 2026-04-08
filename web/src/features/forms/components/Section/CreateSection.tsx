import { useFormStructureStore } from "@/store/formStructure"
import { Seccion } from "@/types/seccion"
import { FormProvider, useForm } from "react-hook-form"
import SectionForm from "./SectionForm"
import { useState } from "react" // Import useState
import { ulid } from "ulid"

type CreateSectionProps = {
    handlerClose: () => void
}

const CreateSection = ({ handlerClose }: CreateSectionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const [isLoading, setIsLoading] = useState(false); // Add local loading state

    const sectionFormMethods = useForm<Seccion>({
        defaultValues: { preguntas: [] },
    })

    const addSection = (newSection: Seccion) => {
        newSection.id = ulid() // Generate a unique ID for the new section
        let newSections = [...data, newSection]
        setJsonFormStructure(newSections)
        console.log(data)
    }

    const onSubmit = (data: Seccion) => {
        setIsLoading(true); // Set loading to true on submit
        addSection(data);
        handlerClose();
    }

    return (
        <FormProvider {...sectionFormMethods}>
            <SectionForm onSubmit={onSubmit} handlerClose={handlerClose} isLoading={isLoading} />
        </FormProvider>
    )
}

export default CreateSection