import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStructureStore } from "@/store/formStructure"
import { Seccion } from "@/types/seccion"
import { useEffect } from "react"
import { FormProvider, useForm } from "react-hook-form"

type CreateSectionProps = {
    setOpen: (value: boolean) => void
    // onAddSection: (newSection: Seccion) => void
}

const CreateSection = ({ setOpen }: CreateSectionProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const setJsonFormStructure = useFormStructureStore(store => store.setFormStructure)

    const addSection = (newSection: Seccion) => {
        let newSections = [...data, newSection]
        setJsonFormStructure(newSections)
    }

    const sectionFormMethods = useForm<Seccion>({ defaultValues: { preguntas: [] } })
    const { register, reset, handleSubmit, formState, } = sectionFormMethods

    const onSubmit = (data: Seccion) => {
        addSection(data)
    }

    useEffect(() => {
        if (formState.isSubmitSuccessful) {
            reset()
        }
    }, [formState])

    return (
        <FormProvider {...sectionFormMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Titulo
                        </Label>
                        <Input id="name" className="col-span-3" {...register('titulo')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Entidad
                        </Label>
                        <Input id="name" className="col-span-3" {...register('entidad')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Restricción
                        </Label>
                        <Input id="name" className="col-span-3" {...register('restriccion')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Orden
                        </Label>
                        <Input id="name" className="col-span-3" {...register('orden')} />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cerrar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </FormProvider>
    )
}

export default CreateSection