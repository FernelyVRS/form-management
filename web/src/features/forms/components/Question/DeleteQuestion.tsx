import { Seccion } from '@/types/seccion'
import { Button } from '@/components/ui/button'
import { useFormStructureStore } from '@/store/formStructure'
import { PreguntaWithSectionId } from '@/types'
import { FormProvider, useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'

type DeleteQuestionProps = {
    handlerClose: () => void
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

const DeleteQuestion = ({ handlerClose, questionId }: DeleteQuestionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const questionToDelete = getPreguntasWithSectionId(data, questionId)

    const form = useForm<PreguntaWithSectionId>({
        defaultValues: {
            ...questionToDelete
        },
        shouldUnregister: true
    })

    const removeQuestion = () => {
        const sectionWithQuestionRemoved = data.map(section => {
            if (section.preguntas.some(p => p.id === questionId)) {
                return {
                    ...section,
                    preguntas: section.preguntas.filter((question) => question.id !== questionId)
                }
            }
            return section
        }
        )
        setJsonFormStructure(sectionWithQuestionRemoved)
    }

    const isLoading = form.formState.isSubmitting

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(removeQuestion)}>
                <div className='grid gap-4 py-4'>
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
                                disabled={isLoading}
                                className=" bg-red-500 hover:bg-red-400">
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
        </FormProvider >
    )
}

export default DeleteQuestion