import { useFormStructureStore } from '@/store/formStructure'
import { FormProvider, useForm } from 'react-hook-form'
import SectionForm from './SectionForm'
import { Seccion, SeccionSinPreguntas } from '@/types/seccion';
import { useState } from 'react'; // Import useState

type EditSectionProps = {
    sectionId: string;
    handlerClose: () => void;
}

const getSectionsWithOutQuestions = (data: Seccion[], sectionId: string) => {
    const section: SeccionSinPreguntas | undefined = data?.find(section => section.id === sectionId);
    if (!section) {
        return null;
    }
    return section;
}

const EditSection = ({ sectionId, handlerClose }: EditSectionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const [isLoading, setIsLoading] = useState(false); // Add local loading state

    const sectionToEdit = getSectionsWithOutQuestions(data, sectionId)
    const { id } = sectionToEdit || {}

    const form = useForm({
        defaultValues: {
            ...sectionToEdit
        },
        shouldUnregister: true
    })

    const editSection = (sectionEdited: Seccion, sectionId: string) => {

        const updatedSections = data.map(section => {
            sectionEdited.id = sectionId
            if (section.id === sectionEdited.id) {
                return {
                    ...section,
                    ...sectionEdited
                }
            }
            return section
        })
        setJsonFormStructure(updatedSections)
    }

    const onSubmit = (data: any) => {
        setIsLoading(true); // Set loading to true on submit
        editSection(data, id as string);
        handlerClose()
    }

    return (
        <FormProvider {...form}>
            {/* Pass isLoading prop to SectionForm */}
            <SectionForm
                onSubmit={onSubmit}
                handlerClose={handlerClose}
                isLoading={isLoading} // Pass the isLoading statie
            />
        </FormProvider>
    )
}

export default EditSection