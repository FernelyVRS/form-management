import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getFormByIdWithVersions } from '@/services/form';
import type { FormWithVersions, Version } from '@/types/form';
import VersionModal from '@/features/forms/components/VersionModal';
import { VersionCard } from '@/features/forms/components/VersionCard';
import { Badge } from '@/components/ui/badge';

const FormDetailPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormWithVersions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  // const [isPublishing, setIsPublishing] = useState<string | null>(null);

  const loadForm = async () => {
    if (!formId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getFormByIdWithVersions(formId);
      console.log('Form data loaded:', data);
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

  const draftVersion = form?.versiones.filter(v => v.estado === 'Draft').length;
  // const hasDraft = !!draftVersion;

  const handleCreateVersion = (version: Version) => {
    setForm(prev => prev ? {
      ...prev,
      versiones: [...prev.versiones, version]
    } : null);
    setVersionModalOpen(false);
    navigate(`/forms/${formId}/versions/${version.id}/builder`);
  };

  // const handlePublish = async (versionId: string) => {
  //   if (!formId) return;

  //   try {
  //     setIsPublishing(versionId);
  //     const published = await publishVersion(formId, versionId);
  //     setForm(prev => prev ? {
  //       ...prev,
  //       versiones: prev.versiones.map(v =>
  //         v.id === versionId ? published : v
  //       )
  //     } : null);
  //   } catch (err) {
  //     setError(err instanceof Error ? `Error: ${err.message}. Intenta de nuevo.` : 'Error al publicar la versión. Intenta de nuevo.');
  //   } finally {
  //     setIsPublishing(null);
  //   }
  // };

  // const handleEditDraft = () => {
  //   if (draftVersion) {
  //     navigate(`/forms/${formId}/versions/${draftVersion.id}/builder`);
  //   }
  // };

  const handleViewVersion = (version: Version) => {
    navigate(`/forms/${formId}/versions/${version.id}/view`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-lg flex items-center justify-center">
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
    <div className="container mx-auto py-10">
      <div
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/forms')}
          className="mb-8 -ml-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Volver a formularios"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a formularios
        </Button>

        <div className="flex mb-8">
          <div className="flex items-start flex-col ">
            <div className="text-3xl font-bold">{form.nombre}</div>
            <p className="text-muted-foreground mt-1">{form.descripcion}</p>
          </div>
          {/* <Button onClick={handleCreateForm}>
            <span className="mr-2">+</span>
            Nuevo Formulario
          </Button> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="text-left">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-5">
                Version actual
              </div>
              <div className="text-xl font-bold flex items-center gap-2">
                v1.0.0
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                  Publicada
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-left">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-5">
                Total versiones
              </div>
              <div className="text-xl font-bold">
                {form.versiones.length}
                <span>
                  {draftVersion ? ` (${draftVersion} borrador(es))` : ''}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-left">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-5">
                Ultima actualización
              </div>
              <div className="text-xl font-bold">
                {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : new Date(form.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-lg font-semibold text-justify mb-4">
          Historial de versiones
        </div>
        <div className="space-y-3">
          {form.versiones
            .sort((a, b) => b.numero - a.numero)
            .map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                onView={() => handleViewVersion(version)}
              />
            ))}
        </div>

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
