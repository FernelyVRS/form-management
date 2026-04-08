import { FormField, FormItem, FormMessage } from '../ui/form';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import SelectDependentOptions from './SelectDependentOptions';
import { Seccion } from '@/types/seccion';
import { useFormContext } from 'react-hook-form';
import { DependentOptions, SelectField } from '@/types';
import { useEffect } from 'react';

type SelectDependedTypeFieldsProps = {
    questionsSameSection: Seccion[]
}

const SelectDependedTypeFields = ({ questionsSameSection }: SelectDependedTypeFieldsProps) => {
    const { control, watch, setValue, getFieldState } = useFormContext()
    const currentSection = watch('sectionId')
    const currentDependentOptions = watch('dependentOptions')
    const currentDependentQuestion = watch('dependiente')

    const questionSameSection = questionsSameSection?.flatMap(section =>
        section.preguntas
            .map(pregunta =>
            ({
                ...pregunta,
                sectionId: section.id
            }))
            .filter(x => x.sectionId == currentSection && x.tipo == 'select')
    ) as SelectField[]


    const addDependentOption = () => {
        const questionsWithSelectType = questionsSameSection?.flatMap(section => section.preguntas.filter(pregunta => pregunta.tipo == 'select')) as SelectField[]

        const composedOptions: DependentOptions = {}

        questionsWithSelectType?.map((question) => question.options.map(option => {
            if (question.id == currentDependentQuestion) {
                composedOptions[option.value] = currentDependentOptions[option.value]
                    ? []
                    : [{ description: '', value: '' }]
            }
        }
        ))
        // console.log('composedOptions ---> ', currentDependentOptions[1])
        // console.log('composedOptions0 ---> ', currentDependentOptions[0])
        setValue('dependentOptions', composedOptions)
    }

    useEffect(() => {
        addDependentOption()
    }, [currentDependentQuestion])

    useEffect(() => {
        if (getFieldState('sectionId').isDirty) {
            setValue('dependiente', '')
            setValue('dependentOptions', {})
        }
    }, [currentSection])

    return (
        <>
            <FormField
                name="dependiente"
                control={control}
                rules={{ required: "Selecciona de la cual dependa" }}
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dependent" className="text-right">
                            Dependiente
                        </Label>
                        <div >
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={currentSection == undefined}>
                                <SelectTrigger className="col-span-3 w-[345px]">
                                    <SelectValue placeholder="Selecciona un tipo de pregunta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Tipos de preguntas</SelectLabel>
                                        {
                                            questionSameSection?.map(x =>
                                                <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>
                                            )
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </div>
                    </FormItem>
                )} />

            <div className="grid grid-cols-1 items-center gap-4 mt-2">
                <Label htmlFor="name" className="text-right mb-1">
                    Opciones
                </Label>
                <div >
                    {currentDependentOptions && Object.keys(currentDependentOptions).map((key) => {
                        return (
                            <div key={key} className="my-3">
                                <Label className="col-span-7 font-light mb-2">Opción {key}</Label>
                                <SelectDependentOptions optionGroup={key} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    )
}

export default SelectDependedTypeFields