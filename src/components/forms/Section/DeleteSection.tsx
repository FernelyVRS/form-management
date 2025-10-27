import { Seccion } from '@/types/seccion'
import { Button } from '@/components/ui/button'
import { useFormStructureStore } from '@/store/formStructure'
import { FormProvider, useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

type DeleteSectionProps = {
    handlerClose: () => void
    sectionId: string
}

const DeleteSection = ({ handlerClose, sectionId }: DeleteSectionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const sectionToDelete = data.find(section => section.id === sectionId)

    const form = useForm<Seccion>({
        defaultValues: {
            ...sectionToDelete
        },
        shouldUnregister: true
    })

    const removeSection = () => {
        debugger
        // Only remove if the section exists and has no questions
        // const sectionToRemove = data.find(section => section.id === sectionId)
        // if (!sectionToRemove || sectionToRemove.preguntas.length > 0) {
        //     // You might want to show an error message here if the section has questions
        //     return
        // }

        const sectionsWithoutDeleted = data.filter(section => section.id !== sectionId)
        setJsonFormStructure(sectionsWithoutDeleted)
        handlerClose()
    }

    const isLoading = form.formState.isSubmitting

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(removeSection)}>
                <div className='grid gap-4 py-4'>
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-medium">¿Está seguro de eliminar esta sección?</h3>
                        <p className="text-sm text-gray-500">
                            Esta acción no se puede deshacer.
                            {(sectionToDelete?.preguntas?.length ?? 0) > 0 && (
                                <span className="text-red-500 block mt-2">
                                    No se puede eliminar una sección que contiene preguntas.
                                </span>
                            )}
                        </p>
                    </div>
                    <div className='flex gap-4'>
                        <div className="w-full flex justify-center sm:space-x-6">
                            <Button
                                size="lg"
                                variant="outline"
                                disabled={isLoading}
                                className="hidden sm:block"
                                type="button"
                                onClick={handlerClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                type="submit"
                                // disabled={isLoading || (sectionToDelete?.preguntas.length ?? 0) > 0}
                                className="bg-red-500 hover:bg-red-400"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <span>Eliminar</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default DeleteSection