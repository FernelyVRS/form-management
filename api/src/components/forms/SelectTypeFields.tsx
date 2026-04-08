import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Checkbox } from '../ui/checkbox'

const SelectTypeFields = () => {
    const { register, control } = useFormContext()
    const options = useFieldArray({
        control,
        name: 'options'
    })

    const { watch } = useFormContext();

    const isDynamicOptions = watch('dynamicOptions');

    return (
        <>
            <div className='grid grid-cols-1 items-center gap-4'>
                <FormField
                    name="dynamicOptions"
                    control={control}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 ">
                            <Label htmlFor="dynamicOptions" className="text-right">
                                Opciones dinámicas
                            </Label>
                            <div className="border rounded-md p-2.5 flex gap-3 md:col-span-2 col-span-3">
                                <FormControl>
                                    <Checkbox id='dynamicOptions' checked={field.value || false} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel htmlFor="dynamicOptions" className="text-right font-normal">
                                    Pregunta Opciones dinámicas
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
            {!isDynamicOptions && (
                <div>
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
                                        <FormField
                                            name={`options.${index}.value`}
                                            control={control}
                                            rules={{ required: "Campo requerido" }}
                                            render={() => (
                                                <FormItem className="col-span-2">
                                                    <div className="col-span-2">
                                                        <FormControl>
                                                            <Input id='value' {...register(`options.${index}.value`)} placeholder="Valor" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name={`options.${index}.description`}
                                            control={control}
                                            rules={{ required: "Campo requerido" }}
                                            render={() => (
                                                <FormItem className="col-span-4">
                                                    <div className="">
                                                        <FormControl>
                                                            <Input id='description' {...register(`options.${index}.description`)} placeholder="Descripción" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />

                                        {/* <Input id='value' className="col-span-2" {...register(`options.${index}.value`)} placeholder="Valor" /> */}
                                        {/* <Input id='description' className="col-span-4" {...register(`options.${index}.description`)} placeholder="Descripción" /> */}
                                        <Button id='removeSelectOption' variant='destructive' onClick={() => options.remove(index)}><Trash2 /></Button>
                                    </>
                                ))
                            }
                        </div>
                    </div>
                    <div className="flex justify-start mt-3">
                        <Button id='addSelectOption' type="button" variant="outline" size="sm" onClick={() => { options.append({ description: "", value: "" }) }}>
                            <Plus />
                            Agregar opción
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}

export default SelectTypeFields