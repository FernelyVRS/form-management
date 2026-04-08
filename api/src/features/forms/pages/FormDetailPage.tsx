import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Eye, Rocket, Loader2, ArrowLeft, FileText, Layers } from 'lucide-react';
import { getFormByIdWithVersions, publishVersion } from '@/services/form';
import type { FormWithVersions, Version, VersionEstado } from '@/types/form';
import VersionModal from '@/features/forms/components/VersionModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FormDetailPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormWithVersions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  const loadForm = async () => {
    if (!formId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFormByIdWithVersions(formId);
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}. Intenta de nuevo.` : 'Error al cargar el formulario. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [formId]);

  const draftVersion = form?.versiones.find(v => v.estado === 'borrador');
  const hasDraft = !!draftVersion;

  const handleCreateVersion = (version: Version) => {
    setForm(prev => prev ? {
      ...prev,
      versiones: [...prev.versiones, version]
    } : null);
    setVersionModalOpen(false);
    navigate(`/forms/${formId}/versions/${version.id}/builder`);
  };

  const handlePublish = async (versionId: string) => {
    if (!formId) return;
    
    try {
      setIsPublishing(versionId);
      const published = await publishVersion(formId, versionId);
      setForm(prev => prev ? {
        ...prev,
        versiones: prev.versiones.map(v => 
          v.id === versionId ? published : v
        )
      } : null);
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}. Intenta de nuevo.` : 'Error al publicar la versión. Intenta de nuevo.');
    } finally {
      setIsPublishing(null);
    }
  };

  const handleEditDraft = () => {
    if (draftVersion) {
      navigate(`/forms/${formId}/versions/${draftVersion.id}/builder`);
    }
  };

  const handleViewVersion = (version: Version) => {
    navigate(`/forms/${formId}/versions/${version.id}/view`);
  };

  const getStatusBadge = (estado: VersionEstado) => {
    if (estado === 'borrador') {
      return (
        <Badge 
          variant="secondary" 
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Borrador
        </Badge>
      );
    }
    return (
      <Badge 
        variant="secondary" 
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Publicada
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" aria-label="Cargando formulario" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500 font-medium">Cargando formulario…</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/forms')} 
            className="mb-8 -ml-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Volver a formularios"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a formularios
          </Button>
          
          <Card className="border-2 border-red-100 bg-red-50/50 shadow-lg shadow-red-100/50">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-red-700 font-semibold text-lg mb-2" role="alert">{error || 'Formulario no encontrado'}</p>
                <p className="text-red-600/70 text-sm mb-6">Por favor, intenta de nuevo o contacta soporte.</p>
                <Button 
                  onClick={loadForm}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/forms')} 
          className="mb-8 -ml-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Volver a formularios"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a formularios
        </Button>

        <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                    <FileText className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-xs font-medium text-blue-200">Formulario</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                    <Layers className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-xs font-medium text-emerald-200">{form.versiones.length} versiones</span>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{form.nombre}</h1>
                {form.descripcion && (
                  <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">{form.descripcion}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
              {draftVersion && (
                <Button 
                  onClick={handleEditDraft}
                  className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow-lg shadow-amber-500/25 rounded-lg transition-all hover:scale-105"
                >
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Editar Borrador
                </Button>
              )}
              <Button 
                onClick={() => setVersionModalOpen(true)} 
                disabled={hasDraft}
                className={`rounded-lg font-semibold shadow-lg transition-all hover:scale-105 ${
                  hasDraft 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed hover:bg-slate-700 hover:scale-100' 
                    : 'bg-white text-slate-900 hover:bg-slate-50 shadow-white/10'
                }`}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Nueva Versión
              </Button>
              {hasDraft && (
                <span className="text-sm text-amber-300/80 ml-2">
                  Hay un borrador activo
                </span>
              )}
            </div>
          </div>
        </div>

        {hasDraft && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50 shadow-lg shadow-amber-100/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Borrador activo</p>
                  <p className="text-sm text-amber-700/80">Hay un borrador sin publicar. Solo puedes tener un borrador a la vez.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Historial de Versiones</CardTitle>
                <CardDescription className="text-slate-500 mt-1">Lista de todas las versiones del formulario</CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-600">
                <Layers className="w-4 h-4" />
                {form.versiones.length} {form.versiones.length === 1 ? 'versión' : 'versiones'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="font-semibold text-slate-700 pl-6">Versión</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Creado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actualizado</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.versiones
                    .sort((a, b) => b.numero - a.numero)
                    .map((version, index) => (
                      <TableRow 
                        key={version.id} 
                        className="hover:bg-slate-50/80 border-b border-slate-50 transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-semibold text-slate-900 pl-6">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-sm shadow-md">
                            v{version.numero}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(version.estado)}</TableCell>
                        <TableCell className="text-slate-600">
                          {version.createdAt ? new Date(version.createdAt).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          }) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {version.updatedAt ? new Date(version.updatedAt).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          }) : '-'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            {version.estado === 'borrador' ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-lg transition-all"
                                  onClick={() => navigate(`/forms/${formId}/versions/${version.id}/builder`)}
                                  aria-label={`Editar versión ${version.numero}`}
                                >
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 rounded-lg transition-all"
                                  onClick={() => handlePublish(version.id)}
                                  disabled={isPublishing === version.id}
                                  aria-label={isPublishing === version.id ? `Publicando versión ${version.numero}` : `Publicar versión ${version.numero}`}
                                >
                                  {isPublishing === version.id ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                  ) : (
                                    <Rocket className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                  Publicar
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg transition-all"
                                onClick={() => handleViewVersion(version)}
                                aria-label={`Ver versión ${version.numero}`}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                Ver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <VersionModal
          open={versionModalOpen}
          onOpenChange={setVersionModalOpen}
          formId={formId!}
          versions={form.versiones}
          onVersionCreated={handleCreateVersion}
        />
      </div>
    </div>
  );
};

export default FormDetailPage;
