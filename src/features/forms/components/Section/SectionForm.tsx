// import { useEffect } from 'react' // Remove unused import if present
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Seccion } from '@/types/seccion'
import { useFormContext } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
// import { useState } from 'react' // Remove unused import if present

type SectionFormProps = {
    handlerClose: () => void,
    onSubmit: (data: Seccion) => void,
    isLoading: boolean; // Add isLoading prop
}

const SectionForm = ({ handlerClose, onSubmit, isLoading }: SectionFormProps) => { // Accept isLoading prop
    const sectionFormMethods = useFormContext<Seccion>()
    const { handleSubmit, control } = sectionFormMethods

    const isDisabled = isLoading // Use the passed isLoading prop

    const handleSave = () => {
        if (isDisabled) return
        onSubmit(sectionFormMethods.getValues())
    }

    return (
        <form onSubmit={handleSubmit(handleSave)} className="grid gap-6">
            <div className="grid gap-4 py-4">
                <FormField
                    control={control}
                    name="titulo"
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

                <FormField
                    control={control}
                    name="entidad"
                    rules={{ required: 'La entidad es obligatoria' }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="entidad" className="text-right">
                                Entidad
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input id="entidad" className="col-span-3" {...field} value={field.value || ''} placeholder='Entidad' />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="restriccion"
                    rules={{ required: 'La restricción es obligatoria' }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="restriccion" className="text-right">
                                Restricción
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input id="restriccion" className="col-span-3" {...field} value={field.value || ''} placeholder='Restricción' />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="orden"
                    rules={{ required: 'El orden es obligatorio' }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="Orden" className="text-right">
                                Orden
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input id="Orden" className="col-span-3" {...field} value={field.value || ''} placeholder='Orden' />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handlerClose}>Cerrar</Button>
                {/* Use the passed isLoading prop to disable the button */}
                <Button type="submit" disabled={isDisabled} className="flex items-center" >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <span>Guardar</span>
                    )}
                </Button>
            </div>
        </form>
    )
}

export default SectionForm