import { FormField, FormItem, FormMessage } from '../ui/form'
import { Label } from '@radix-ui/react-label'
import { Input } from '../ui/input'
import { useFormContext } from 'react-hook-form'

const NumberTypeFields = () => {

    const { control } = useFormContext()

    return (
        <>
            <FormField
                control={control}
                name='max'
                rules={{ required: 'Campo requerido' }}
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-left">
                            Max
                        </Label>
                        <div className="col-span-3">
                            <Input id="name" {...field} value={field.value || ''} placeholder="Máximo" />
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name='min'
                rules={{ required: 'Campo requerido' }}
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-left">
                            Min
                        </Label>
                        <div className="col-span-3">
                            <Input id="name" {...field} value={field.value || ''} placeholder="Mínimo" />
                            <FormMessage />
                        </div>
                    </FormItem>
                )}
            />
        </>
    )
}

export default NumberTypeFields