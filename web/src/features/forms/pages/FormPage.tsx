import { useMemo, useState, lazy, Suspense, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import CreateQuestion from "@/features/forms/components/Question/CreateQuestion";
import CreateSection from "@/features/forms/components/Section/CreateSection";
import FormDialog from "@/features/forms/components/FormDialog";
import TableMod from "@/features/forms/components/Table";
import VersionModal from "@/features/forms/components/VersionModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FieldWithEntity } from "@/types";
import type { Seccion, Version } from "@/types";
import { Plus, Loader2 } from "lucide-react";
import { useFormStructureStore } from "@/store/formStructure";
import { getFormByIdWithVersions, getVersionEstructura, updateFormStructure } from "@/services/form";
import type { FormWithVersions } from "@/types/form";

const Treednd = lazy(() => import("@/components/dnd/Treednd"));

const FormPage = () => {
    const { formId, versionId } = useParams<{ formId: string; versionId: string }>();
    const navigate = useNavigate();
    const { formStructure, setFormStructure } = useFormStructureStore();

    const [currentForm, setCurrentForm] = useState<FormWithVersions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEstructura, setIsLoadingEstructura] = useState(false);
    const [versionModalOpen, setVersionModalOpen] = useState(false);

    const [openSectionDialog, setOpenSectionDialog] = useState(false);
    const [openQuestionDialog, setOpenQuestionDialog] = useState(false);

    const loadFormMetadata = async () => {
        if (!formId) return;
        
        try {
            setIsLoading(true);
            const form = await getFormByIdWithVersions(formId);
            setCurrentForm(form);
        } catch (error) {
            console.error('Failed to load form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadVersionEstructura = async (vid: string) => {
        if (!formId || !vid) return;
        
        try {
            setIsLoadingEstructura(true);
            const estructura = await getVersionEstructura(formId, vid);
            setFormStructure(estructura);
        } catch (error) {
            console.error('Failed to load version estructura:', error);
        } finally {
            setIsLoadingEstructura(false);
        }
    };

    useEffect(() => {
        loadFormMetadata();
    }, [formId]);

    useEffect(() => {
        if (versionId) {
            loadVersionEstructura(versionId);
        }
    }, [formId, versionId]);

    const handleVersionChange = (newVersionId: string) => {
        navigate(`/forms/${formId}/versions/${newVersionId}/builder`);
    };

    const handleStructureChange = async (newStructure: Seccion[]) => {
        setFormStructure(newStructure);

        if (formId && versionId) {
            try {
                await updateFormStructure(formId, versionId, newStructure);
            } catch (error) {
                console.error('Failed to save structure:', error);
            }
        }
    };

    const handleVersionCreated = (version: Version) => {
        setCurrentForm(prev => prev ? {
            ...prev,
            versiones: [...prev.versiones, version]
        } : null);
        navigate(`/forms/${formId}/versions/${version.id}/builder`);
    };

    const seccionesSinPreguntas = useMemo(() =>
        formStructure.map(({ preguntas, ...rest }) => rest),
        [formStructure]
    );

    const preguntasPorSeccion = useMemo(() =>
        formStructure.flatMap(seccion =>
            seccion?.preguntas.map(pregunta => ({
                ...pregunta,
                entidad: seccion.entidad
            }))
        ),
        [formStructure]
    );

    const preguntas: FieldWithEntity[] = useMemo(() =>
        preguntasPorSeccion.map(x => ({
            id: x.id,
            orden: x.orden,
            label: x.label,
            tipo: x.tipo,
            core: x.core,
            entidad: x.entidad
        })),
        [preguntasPorSeccion]
    );

    const handlerClose = () => {
        setOpenSectionDialog(false);
        setOpenQuestionDialog(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!currentForm) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Formulario no encontrado</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{currentForm.nombre}</h1>
                    {currentForm.descripcion && (
                        <p className="text-muted-foreground">{currentForm.descripcion}</p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Select value={versionId} onValueChange={handleVersionChange}>
                        <SelectTrigger className="w-[200px]" disabled={isLoadingEstructura}>
                            <SelectValue placeholder="Selecciona versión" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Versiones</SelectLabel>
                                {currentForm.versiones.map((version) => (
                                    <SelectItem key={version.id} value={version.id}>
                                        v{version.numero} ({version.estado})
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setVersionModalOpen(true)}>
                        Nueva Versión
                    </Button>
                </div>
            </div>

            {isLoadingEstructura ? (
                <div className="flex items-center justify-center h-[800px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
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
                                <Suspense fallback={
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                }>
                                    <Treednd
                                        jsonFormStructure={formStructure}
                                        handlerChangeStructure={handleStructureChange}
                                    />
                                </Suspense>
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
            )}

            <VersionModal
                open={versionModalOpen}
                onOpenChange={setVersionModalOpen}
                formId={formId!}
                versions={currentForm.versiones}
                onVersionCreated={handleVersionCreated}
            />
        </div>
    );
};

export default FormPage;