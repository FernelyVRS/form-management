import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Files, PlusSquare } from 'lucide-react'

const FormCreator = () => {
    return (
        <>
            <div className='text-center text-3xl font-bold text-foreground'>Como deseas crear el formulario?</div>
            <div className="grid grid-cols-1 gap-3 container p-4">
                <Card className='grid grid-cols-6 px-3 gap-0 '>
                    <div className='col-1 flex m-auto '>
                        <PlusSquare size={48} className='text-blue-700' />
                    </div>
                    <CardContent className='col-span-5 pe-3'>
                        <CardTitle className='text-xl mb-1'>
                            Desde cero
                        </CardTitle>
                        <div className='text-foreground'>
                            Comienza con un formulario en blanco y agrega tus propias preguntas y secciones.
                        </div>
                    </CardContent>
                </Card>
                {/* <Card className='grid grid-cols-6 px-3 gap-0 '>
                    <div className='col-1 flex m-auto '>
                        <Files size={48} className='text-blue-700' />
                    </div>
                    <CardContent className='col-span-5 pe-3'>
                        <CardTitle className='text-xl mb-1'>
                            A partir de un formulario existente
                        </CardTitle>
                        <div className='text-foreground'>
                            Crear un formulario nuevo basado en una version de otro.
                        </div>
                    </CardContent>
                </Card> */}

                <Label className="hover:bg-accent/50 p-5 rounded-md border  has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                    <div className='grid grid-cols-6 gap-3 w-full justify-between'>
                        <div className='col-1 flex m-auto '>
                            <Files size={48} className='text-blue-700' />
                        </div>
                        <div className="col-span-4 font-normal">
                            <div className='text-xl font-semibold mb-2'>
                                A partir de un formulario existente
                            </div>
                            <div className='text-foreground'>
                                Crear un formulario nuevo basado en una version de otro.
                            </div>
                        </div>
                        <div className='col-6 flex justify-end'>
                            <Checkbox
                                id="toggle-2"
                                // defaultChecked
                                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                            />
                        </div>
                    </div>
                </Label>



            </div >
        </>
    )
}

export default FormCreator