import CreateQuestion from "@/features/forms/components/Question/CreateQuestion";
import CreateSection from "@/features/forms/components/Section/CreateSection";
import FormDialog from "@/components/FormDialog";
import TableMod from "@/components/Table";
import Treednd from "@/components/dnd/Treednd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldWithEntity } from "@/types";
import { Seccion } from "@/types/seccion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useFormStructureStore } from "@/store/formStructure";

const Forms = () => {
    const data = useFormStructureStore(store => store.formStructure)

    const [openSectionDialog, setOpenSectionDialog] = useState(false)
    const [openQuestionDialog, setOpenQuestionDialog] = useState(false)

    const seccionesSinPreguntas = data.map(({ preguntas, ...rest }) => rest)

    const preguntasPorSeccion = data.flatMap(seccion =>
        seccion?.preguntas.map(pregunta =>
        ({
            ...pregunta,
            entidad: seccion.entidad
        }))
    )

    const preguntas: FieldWithEntity[] = preguntasPorSeccion.map(x =>
    ({
        id: x.id,
        orden: x.orden,
        label: x.label,
        tipo: x.tipo,
        core: x.core,
        entidad: x.entidad
    })
    )

    // const addFieldToPregunta = (preguntaId: string) => {
    //   const newOptions: [] = []

    //   setJsonFormStructure(prev =>
    //     prev.map(section => ({
    //       ...section,
    //       preguntas: section.preguntas.map(p =>
    //         p.label === preguntaId
    //           ? { ...p, ...newOptions }
    //           : p
    //       )
    //     }))
    //   );
    // };

    // const handleSubmit = () => {
    //   mutation.mutate(formStructure)
    // }

    const handlerChangeStructure = (newJsonFormStructure: Seccion[]) => {
        console.log('inp ---> ', newJsonFormStructure)
    }

    const handlerClose = () => {
        setOpenSectionDialog(false)
        setOpenQuestionDialog(false)
    }

    return (
        <div>
            {/* <Index /> */}
            <Tabs defaultValue="structure" className="flex w-full flex-col justify-start gap-6">
                <TabsList className='h-10 text-sm'>
                    <TabsTrigger value='structure' className=''>
                        Estructura
                    </TabsTrigger>
                    <TabsTrigger value="sections">
                        Secciones{" "}
                        <Badge
                            variant="secondary"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30">
                            {seccionesSinPreguntas?.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="questions">
                        Preguntas{" "}
                        <Badge
                            variant="secondary"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30">
                            {preguntas?.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value='options'>
                        Opciones
                    </TabsTrigger>
                </TabsList>
                <TabsContent value='structure'>
                    <div>
                        <ScrollArea className="h-[800px] pe-3">
                            <Treednd jsonFormStructure={data} handlerChangeStructure={handlerChangeStructure} />
                        </ScrollArea>
                    </div>
                </TabsContent>
                <TabsContent value="sections">
                    <div>
                        <div className='flex justify-between mb-2'>
                            <Input placeholder='Filtrar por titulo' className='w-1/4' />
                            <Button variant="outline" onClick={() => setOpenSectionDialog(true)}><Plus /> Crear</Button>
                            <FormDialog open={openSectionDialog} handlerClose={handlerClose} title="Crear Sección" description="Crear una nueva sección" width="800">
                                <CreateSection handlerClose={handlerClose} />
                            </FormDialog>
                        </div>
                        <TableMod data={seccionesSinPreguntas} identifier="sections" />
                    </div>
                </TabsContent>
                <TabsContent value="questions">
                    <div className=''>
                        <div className='flex justify-between mb-2'>
                            <Input placeholder='Filtrar por titulo' className='w-1/4' />
                            <Button variant="outline" onClick={() => setOpenQuestionDialog(true)}><Plus /> Crear</Button>
                            <FormDialog open={openQuestionDialog} handlerClose={handlerClose} title="Crear Pregunta" description="Crear una nueva pregunta" width="800">
                                <CreateQuestion setOpen={setOpenQuestionDialog} />
                            </FormDialog>
                        </div>
                        <TableMod data={preguntas} identifier="questions" />
                    </div>
                </TabsContent>
                <TabsContent value='options'>
                    <h1>Opciones</h1>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default Forms