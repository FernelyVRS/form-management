import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PreguntaWithSectionId } from '@/types';
import NumberTypeFields from '../NumberTypeFields';
import SelectTypeFields from '../SelectTypeFields';
import SelectDependedTypeFields from '../SelectDependedTypeFields';
import ComposedTypeFields from '../ComposedTypeFields';
import { useFormStructureStore } from '@/store/formStructure';
import { useFormContext } from 'react-hook-form';
import { Loader2 } from 'lucide-react';


type QuestionFormProps = {
    setOpen: (open: boolean) => void
    onSubmit: (data: PreguntaWithSectionId) => void,
    isChild?: boolean
    isLoading?: boolean
}

const questionTypes = ['text', 'numeric', 'select', 'selectDependent', 'composed'] as const

const QuestionForm = ({ setOpen, onSubmit, isChild, isLoading }: QuestionFormProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const methods = useFormContext<PreguntaWithSectionId>()
    const { handleSubmit, reset, watch, control, formState } = methods

    const questionType = watch('tipo')

    const isDisabled = isLoading // Use the passed isLoading prop

    const sectionsList: { id: string, titulo: string }[] = data?.filter(x => x.preguntas.length != 0).map(x =>
    ({
        id: x.id,
        titulo: x.titulo,
    })) || []

    const handlerFormSubmit = (e: React.FormEvent) => {
        if (isChild) {
            e.stopPropagation()
        }
        handleSubmit(onSubmit)(e)
    }

    useEffect(() => {
        if (formState.isSubmitSuccessful) {
            setOpen(false)
            reset()
        }
    }, [formState])

    return (
        // <Form {...form}>
        <form onSubmit={handlerFormSubmit}>
            <div className="grid gap-4 py-4">
                <FormField
                    name="label"
                    control={control}
                    rules={{ required: "Campo requerido" }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="label" className="text-right">
                                Label
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input id="label" {...field} value={field.value || ''} placeholder="Label" />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    name="tipo"
                    control={control}
                    rules={{ required: "Selecciona un tipo de pregunta" }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right" >
                                Tipo
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value || ''} >
                                        <SelectTrigger className="col-span-3 w-[345px]">
                                            <SelectValue placeholder="Selecciona un tipo de pregunta" />
                                        </SelectTrigger>
                                        <SelectContent >
                                            <SelectGroup>
                                                <SelectLabel>Tipos de preguntas</SelectLabel>
                                                {
                                                    questionTypes.map(x =>
                                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                                    )
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    name="orden"
                    control={control}
                    rules={{ required: "Campo requerido" }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order" className="text-right">
                                Orden
                            </Label>
                            <div className="col-span-3">
                                <FormControl>
                                    <Input id="order" {...field} value={field.value || ''} placeholder="Orden" />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    name="core"
                    control={control}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 ">
                            <Label htmlFor="core" className="text-right">
                                Core
                            </Label>
                            <div className="border rounded-md p-2.5 flex gap-3 md:col-span-2 col-span-3">
                                <FormControl>
                                    <Checkbox
                                        id='core'
                                        defaultChecked={false}
                                        checked={field.value === undefined ? false : field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel htmlFor="core" className="text-right font-normal">
                                    Pregunta core
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                />

                {!isChild && (
                    <FormField
                        control={control}
                        name='sectionId'
                        rules={{ required: 'Campo requerido' }}
                        render={({ field }) => (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="sectionId" className="text-right">
                                    Sección
                                </Label>
                                <div className="">
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={sectionsList.length == 0}>
                                            <SelectTrigger className="col-span-3 w-[345px]">
                                                <SelectValue placeholder="Selecciona una sección" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Pregunta de la cual depende</SelectLabel>
                                                    {
                                                        sectionsList.map(x =>
                                                            <SelectItem key={x.id} value={x.id}>{x.titulo}</SelectItem>
                                                        )
                                                    }
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </div>
                        )}
                    />
                )}

                {questionType != 'composed' && (
                    <FormField
                        control={control}
                        name='variable'
                        rules={{ required: 'Campo requerido' }}
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="variable" className="text-right">
                                    Variable
                                </Label>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input id="variable" {...field} value={field.value || ''} placeholder="Variable" />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                )}
                {questionType === 'numeric' && (
                    <NumberTypeFields />
                )}
                {questionType === 'text' && (
                    <FormField
                        control={control}
                        name='maxLength'
                        rules={{ required: 'Campo requerido' }}
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="maxLength" className="text-right">
                                    MaxLength
                                </Label>
                                <div className="col-span-3">
                                    <FormControl>
                                        <Input id="maxLength" {...field} value={field.value || ''} placeholder="Máximo" />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                )}
                {questionType === 'select' && (
                    <SelectTypeFields />
                )}
                {questionType === 'selectDependent' && (
                    <SelectDependedTypeFields questionsSameSection={data} />
                )}
                {questionType === 'composed' && (
                    <ComposedTypeFields />
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isDisabled} className="flex items-center">
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
        </form >
        // </Form>
    )
}

export default QuestionForm