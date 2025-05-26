import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useEffect, } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Pregunta, PreguntaWithSectionId } from '@/types';
import NumberTypeFields from './NumberTypeFields';
import SelectTypeFields from './SelectTypeFields';
import SelectDependedTypeFields from './SelectDependedTypeFields';
import ComposedTypeFields from './ComposedTypeFields';
import { useFormStructureStore } from '@/store/formStructure';
import { useFieldArray, useFormContext } from 'react-hook-form';


type QuestionFormProps = {
    setOpen: (open: boolean) => void
    onSubmit: (data: PreguntaWithSectionId) => void,
    isChild?: boolean
}

const questionTypes = ['text', 'numeric', 'select', 'selectDependent', 'composed'] as const

const QuestionForm = ({ setOpen, onSubmit, isChild }: QuestionFormProps) => {
    const data = useFormStructureStore(store => store.formStructure)
    const methods = useFormContext<PreguntaWithSectionId>()
    const { handleSubmit, reset, watch, control, formState } = methods

    const questionType = watch('tipo')
    const preguntasHijas = useFieldArray({ control, name: 'preguntasHijas' })

    const sectionsList: { id: string, titulo: string }[] = data?.filter(x => x.preguntas.length != 0).map(x =>
    ({
        id: x.id,
        titulo: x.titulo
    })) || []

    const onAddPreguntaHija = (data: Pregunta) => {
        preguntasHijas.append(data)
    }

    useEffect(() => {
        if (formState.isSubmitSuccessful) {
            reset()
            setOpen(false)
        }
    }, [formState])

    return (
        // <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                            <FormControl className="col-span-3">
                                <Input id="label" {...field} placeholder="Label" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="tipo"
                    control={control}
                    rules={{ required: "Selecciona un tipo de pregunta" }}
                    render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right" >
                                Tipo
                            </Label>
                            <div className="col-span-3">
                                <Select onValueChange={field.onChange} defaultValue={field.value} >
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
                            <Label htmlFor="name" className="text-right">
                                Orden
                            </Label>
                            <div className="col-span-3">
                                <Input id="name" {...field} placeholder="Orden" />
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
                            <Label htmlFor="name" className="text-right">
                                Core
                            </Label>
                            <div className="border rounded-md p-2.5 flex gap-3 md:col-span-2 col-span-3">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel htmlFor="name" className="text-right font-normal">
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
                                <Label htmlFor="name" className="text-right">
                                    Sección
                                </Label>
                                <div className="">
                                    <Select onValueChange={field.onChange} value={field.value} disabled={sectionsList.length == 0}>
                                        <SelectTrigger className="col-span-3 w-[345px]">
                                            <SelectValue placeholder="Selecciona una sección" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Pregunta de la cual depende</SelectLabel>
                                                {
                                                    sectionsList.map(x =>
                                                        <SelectItem value={x.id}>{x.titulo}</SelectItem>
                                                    )
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
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
                                <Label htmlFor="name" className="text-right">
                                    Variable
                                </Label>
                                <div className="col-span-3">
                                    <Input id="name" className="col-span-3" {...field} placeholder="Variable" />
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                )}
                {questionType === 'number' && (
                    <NumberTypeFields />
                )}
                {questionType === 'text' && (
                    <FormField
                        control={control}
                        name='maxLength'
                        rules={{ required: 'Campo requerido' }}
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    MaxLength
                                </Label>
                                <div className="col-span-3">
                                    <Input id="name" {...field} placeholder="Máximo" />
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
                    <ComposedTypeFields onAddPreguntaHija={onAddPreguntaHija} />
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
            </div>
        </form >
        // </Form>
    )
}

export default QuestionForm