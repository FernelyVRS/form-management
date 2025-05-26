import React, { useState } from 'react'
import { Label } from '../ui/label'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import FormDialog from '../FormDialog'
import CreateQuestion from './CreateQuestion'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Pregunta, PreguntaWithSectionId } from '@/types'

type ComposedTypeFieldsProps = {
    onAddPreguntaHija: (data: PreguntaWithSectionId) => void
}

const ComposedTypeFields = ({ onAddPreguntaHija }: ComposedTypeFieldsProps) => {
    const [openPreguntaHijaDialog, setOpenPreguntaHijaDialog] = useState(false)
    const { control } = useFormContext<PreguntaWithSectionId>()
    const preguntasHijas = useFieldArray({ control, name: 'preguntasHijas' })

    const onAddPreguntaHija1 = (data: Pregunta) => {
        preguntasHijas.append(data)
    }

    return (
        <>
            <div className="grid grid-cols-1 items-center gap-3">
                <Label htmlFor="name" className="text-right">
                    Preguntas Hijas
                </Label>
                <div className="grid grid-cols-7 gap-3">
                    {
                        preguntasHijas.fields.map((preguntaHija, index) => (
                            <>
                                <Card className="col-span-7 p-4 px-3">
                                    <div className="grid grid-cols-7 gap-3">
                                        <div className="col-span-3">
                                            <Label>Variable</Label>
                                            {preguntaHija.variable}
                                        </div>
                                        <div className="col-span-3">
                                            <Label>Tipo</Label>
                                            {preguntaHija.tipo}
                                        </div>
                                        <div className="col-span-1">
                                            <Button variant='ghost' size='sm'
                                            // onClick={() => preguntasHijas.remove(index)}
                                            ><Pencil /></Button>
                                            <Button variant='ghost' size='sm' onClick={() => preguntasHijas.remove(index)}><Trash2 /></Button>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        ))
                    }
                    <div className="flex justify-start">
                        <Button type="button" variant="outline" size="sm" onClick={() => { setOpenPreguntaHijaDialog(true) }}>
                            <Plus />
                            Agregar pregunta hija
                        </Button>
                        <FormDialog open={openPreguntaHijaDialog} setOpen={setOpenPreguntaHijaDialog} title="Crear pregunta hija" description="En esta parte podrás crear nueva preguntas">
                            <CreateQuestion onAddQuestion={onAddPreguntaHija} setOpen={setOpenPreguntaHijaDialog} isChildQuestions />
                        </FormDialog>
                    </div>
                </div>
            </div>

        </>
    )
}

export default ComposedTypeFields