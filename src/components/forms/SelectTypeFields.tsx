import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

const SelectTypeFields = () => {
    const { register, control } = useFormContext()
    const options = useFieldArray({
        control,
        name: 'options'
    })

    return (
        <>
            <div className="grid grid-cols-1 items-center gap-4">
                <Label htmlFor="name" className="text-right mb-1">
                    Opciones
                </Label>
                <div className="grid grid-cols-7 gap-3">
                    <Label className="col-span-2 font-light">Valor</Label>
                    <Label className="col-span-4 font-light">Descripción</Label>
                    {
                        options.fields.map((_, index) => (
                            <>
                                <Input className="col-span-2" {...register(`options.${index}.value`)} placeholder="Valor" />
                                <Input className="col-span-4" {...register(`options.${index}.description`)} placeholder="Descripción" />
                                <Button variant='destructive' onClick={() => options.remove(index)}><Trash2 /></Button>
                            </>
                        ))
                    }
                </div>
            </div>
            <div className="flex justify-start">
                <Button type="button" variant="outline" size="sm" onClick={() => { options.append({ description: "", value: "" }) }}>
                    <Plus />
                    Agregar opción
                </Button>
            </div>
        </>
    )
}

export default SelectTypeFields