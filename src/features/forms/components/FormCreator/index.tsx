import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormProvider, useForm } from 'react-hook-form'

type FormDefinition = {
    id: string,
    nombre: string,
    descripcion: string,
    idFormPadre: number,
    createdBy: string,
    createdAt: Date
}

// type FormDefinitionProps = {
//     nombre: string,
//     descripcion: string,
//     idFormPadre: string,
//     version: number
// }

const NewForm = () => {
    const methodsF = useForm<FormDefinition>()
    const { handleSubmit, control, getValues } = methodsF

    const handlerFormDefinitionSubmit = () => {
        console.log(getValues())
    }

    return (
        <>
            <div className=''>FormCreator</div>
            <FormProvider {...methodsF}>
                <form onSubmit={handleSubmit(handlerFormDefinitionSubmit)} >
                    <FormField
                        control={control}
                        name="nombre"
                        rules={{ required: 'El título es obligatorio' }}
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="titulo" className="text-right">
                                    Titulo
                                </Label>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input id="titulo" className="col-span-3" {...field} value={field.value || ''} placeholder='Titulo' />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <Button type='submit'>Guardar</Button>
                </form>
            </FormProvider>

        </>
    )
}

export default NewForm