import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
// import { useNavigate } from 'react-router'
import FormCreator from '../FormCreator'
import { useState } from 'react'
import FormDialog from '@/components/FormDialog'
import NewForm from '../FormCreator/index'



const Index = () => {

    const [isOpenCreateFormDialog, setIsOpenCReateFormDialog] = useState(false)
    // const navigate = useNavigate();
    return (
        <>
            <FormDialog
                open={isOpenCreateFormDialog}
                handlerClose={() => setIsOpenCReateFormDialog(false)}
                title=''
                description=''>
                <FormCreator />
            </FormDialog>


            <main className="container mx-auto px-4 py-8">
                <NewForm />

                <div className='flex flex-col gap-1 text-left'>
                    <h1 className="text-2xl font-semibold tracking-tight">Formularios</h1>
                    <p className="text-muted-foreground">Lista de todos los formularios disponibles.</p>
                </div>

                <div className='flex flex-col gap-4 my-6'>
                    <div className='flex items-center justify-between gap-2'>
                        <div className='relative '>
                            <Search className='absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                            <Input
                                type='text'
                                placeholder='Buscar formulario...'
                                className='pl-10'
                            />
                        </div>
                        <div className='flex items-center gap-2'>
                            {/* <Button onClick={() => navigate('/create')} variant="default">Crear Nuevo Formulario</Button> */}
                            <Button onClick={() => setIsOpenCReateFormDialog(true)} variant="default">Crear Nuevo Formulario</Button>
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <a href="/">
                        <Card className='hover:shadow-lg transition-shadow h-full rounded-md'>
                            <CardHeader className='text-lg font-semibold'>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* <FileText className="h-5 w-5 text-primary" /> */}
                                        <CardTitle className="text-lg">RSUH</CardTitle>
                                    </div>
                                    <Badge variant="secondary" className='bg-blue-100 text-blue-400'>v1.1.0</Badge>
                                </div>
                                <CardDescription className="line-clamp-2 text-left">Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate ipsam reprehenderit quod explicabo, obcaecati quibusdam aut quidem possimus, </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-left grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                    <div className="">
                                        <span className='text-xs'>Actualizado en</span>
                                        <div className='font-bold'>2/24/2024</div>
                                    </div>
                                    <div className="">
                                        <span className='text-xs'>Total versiones</span>
                                        <div className='font-bold'>2</div>
                                    </div>
                                    {/* <div className="">
                                    <span className='text-xs'>Status</span>
                                    <div className='font-bold'>Publicado</div>
                                    </div> */}
                                </div>
                            </CardContent>
                        </Card>
                    </a>
                    <a href="/">
                        <Card className='hover:shadow-lg transition-shadow h-full'>
                            <CardHeader className='text-lg font-semibold'>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* <FileText className="h-5 w-5 text-primary" /> */}
                                        <CardTitle className="text-lg">RSUH</CardTitle>
                                    </div>
                                    <Badge variant="secondary" className='bg-blue-100 text-blue-400'>v1.1.0</Badge>
                                </div>
                                <CardDescription className="line-clamp-2">Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate ipsam reprehenderit quod explicabo, obcaecati quibusdam aut quidem possimus, </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-left grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                    <div className="">
                                        <span className='text-xs'>Actualizado en</span>
                                        <div className='font-bold'>2/24/2024</div>
                                    </div>
                                    <div className="">
                                        <span className='text-xs'>Total versiones</span>
                                        <div className='font-bold'>2</div>
                                    </div>
                                    {/* <div className="">
                                    <span className='text-xs'>Status</span>
                                    <div className='font-bold'>Publicado</div>
                                </div> */}
                                </div>
                            </CardContent>
                        </Card>
                    </a>
                    <a href="/">
                        <Card className='hover:shadow-lg transition-shadow h-full'>
                            <CardHeader className='text-lg font-semibold'>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* <FileText className="h-5 w-5 text-primary" /> */}
                                        <CardTitle className="text-lg">RSUH</CardTitle>
                                    </div>
                                    <Badge variant="secondary" className='bg-blue-100 text-blue-400'>v1.1.0</Badge>
                                </div>
                                <CardDescription className="line-clamp-2">Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate ipsam reprehenderit quod explicabo, obcaecati quibusdam aut quidem possimus, </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-left grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                    <div className="">
                                        <span className='text-xs'>Actualizado en</span>
                                        <div className='font-bold'>2/24/2024</div>
                                    </div>
                                    <div className="">
                                        <span className='text-xs'>Total versiones</span>
                                        <div className='font-bold'>2</div>
                                    </div>
                                    {/* <div className="">
                                    <span className='text-xs'>Status</span>
                                    <div className='font-bold'>Publicado</div>
                                    </div> */}
                                </div>
                            </CardContent>
                        </Card>
                    </a>

                </div>
            </main>
        </>
    )
}

export default Index