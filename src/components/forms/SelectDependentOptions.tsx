import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '../ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../ui/input'
import { PreguntaWithSectionId } from '@/types'


type SelectDependentOptionsProps = {
    optionGroup: string,
    // control: Control<PreguntaWithSectionId>,
    // register: UseFormRegister<PreguntaWithSectionId>
}

const SelectDependentOptions = ({ optionGroup }: SelectDependentOptionsProps) => {
    const { register, control } = useFormContext<PreguntaWithSectionId>()
    const { fields, append, remove } = useFieldArray({
        control,
        name: `dependentOptions.${optionGroup}`
    })

    return (
        <div>
            {
                <div className=''>
                    {fields.map((field, index) => (
                        <>
                            <div key={field.id} className="grid grid-cols-7 gap-3 my-2">
                                <Input id='value' className="col-span-2" {...register(`dependentOptions.${optionGroup}.${index}.value`, { required: true })} placeholder="Valor" />
                                <Input id='description' className="col-span-4" {...register(`dependentOptions.${optionGroup}.${index}.description`, { required: true })} placeholder="Descripción" />
                                <div className='flex flex-row gap-2'>
                                    <Button id='removeOption' variant='destructive' title='Eliminar opción' onClick={() => remove(index)}><Trash2 /></Button>
                                    {
                                        index === fields.length - 1 &&
                                        <Button id='addOption' type="button" variant="outline" title='Nueva opción' onClick={() => append({ description: "", value: "" })}>
                                            <Plus />
                                        </Button>
                                    }
                                </div>
                            </div>
                        </>
                    ))}
                </div>
            }
        </div >
    )
}

export default SelectDependentOptions