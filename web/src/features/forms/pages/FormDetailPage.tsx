import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Version } from '@/types/form';
import VersionModal from '@/features/forms/components/VersionModal';
import CloneFormDialog from '@/features/forms/components/CloneFormDialog';
import { VersionCard } from '@/features/forms/components/VersionCard';
import { Badge } from '@/components/ui/badge';
import {
  useArchiveVersionMutation,
  useFormDetailQuery,
  usePublishVersionMutation,
} from '@/features/forms/hooks/useFormLifecycle';
import { getLifecycleProblemCode, lifecycleMessage } from '@/features/forms/api/formLifecycleApi';

type PendingCommand = { kind: 'publish' | 'archive'; version: Version };

const ConfirmCommandDialog = ({
  command,
  onOpenChange,
  onConfirm,
  busy,
  error,
}: {
  command: PendingCommand;
  onOpenChange: () => void;
  onConfirm: () => void;
  busy: boolean;
  error: string | null;
}) => {
  const publishing = command.kind === 'publish';
  return (
    <Dialog open onOpenChange={next => { if (!busy) { if (!next) onOpenChange(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {publishing ? 'Publicar versión' : 'Archivar borrador'}
          </DialogTitle>
          <DialogDescription>
            {publishing
              ? `Se publicará la Versión ${command.version.numero} y se archivará la publicación actual si existe. Esta acción no se puede deshacer.`
              : `Se archivará la Versión ${command.version.numero}. Podrás derivar una nueva versión desde el archivo.`}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-500" role="alert">{error}</p>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onOpenChange} disabled={busy}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {busy ? (publishing ? 'Publicando…' : 'Archivando…') : (publishing ? 'Confirmar publicación' : 'Confirmar archivado')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FormDetailPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const detail = useFormDetailQuery(formId);
  const publish = usePublishVersionMutation(formId ?? '');
  const archive = useArchiveVersionMutation(formId ?? '');

  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(null);
  const [cloneTarget, setCloneTarget] = useState<Version | null>(null);

  const form = detail.data;
  const versionsNewestFirst = form ? [...form.versiones].sort((a, b) => b.numero - a.numero) : [];
  const draft = form?.versiones.find(version => version.estado === 'Draft') ?? null;
  const published = form?.versiones.find(version => version.estado === 'Published') ?? null;

  const commandBusy = publish.isPending || archive.isPending;
  const commandError = pendingCommand
    ? (publish.isError ? lifecycleMessage(publish.error)
      : archive.isError ? lifecycleMessage(archive.error)
      : null)
    : null;

  const handleCommandError = (error: unknown) => {
    const code = getLifecycleProblemCode(error);
    if (code === 'version_conflict' || code === 'invalid_version_state' || code === 'version_not_found') {
      detail.refetch();
    }
  };

  const confirmPendingCommand = () => {
    if (!pendingCommand || commandBusy) return;
    const { kind, version } = pendingCommand;
    const onDone = { onSuccess: () => setPendingCommand(null), onError: handleCommandError };
    if (kind === 'publish') {
      publish.mutate({ versionId: version.id, rowVersion: version.rowVersion }, onDone);
    } else {
      archive.mutate({ versionId: version.id, rowVersion: version.rowVersion }, onDone);
    }
  };

  const handleViewVersion = (version: Version) => {
    navigate(`/forms/${formId}/versions/${version.id}/${version.estado === 'Draft' ? 'builder' : 'view'}`);
  };

  const handleDeriveSuccess = (version: { versionId: string }) => {
    setVersionModalOpen(false);
    navigate(`/forms/${formId}/versions/${version.versionId}/builder`);
  };

  const handleCloneSuccess = (newFormId: string) => {
    setCloneTarget(null);
    navigate(`/forms/${newFormId}`);
  };

  if (detail.isLoading) {
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

  if (detail.isError || !form) {
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
                <p className="text-red-700 font-semibold text-lg mb-2" role="alert">
                  {detail.error instanceof Error ? `Error: ${detail.error.message}.` : 'Error al cargar el formulario.'}
                </p>
                <p className="text-red-600/70 text-sm mb-6">Por favor, intenta de nuevo o contacta soporte.</p>
                <Button
                  onClick={() => detail.refetch()}
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

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-start flex-col ">
            <div className="text-3xl font-bold">{form.nombre}</div>
            <p className="text-muted-foreground mt-1">{form.descripcion}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft ? (
              <Button onClick={() => handleViewVersion(draft)}>
                Continuar borrador
              </Button>
            ) : (
              <Button onClick={() => setVersionModalOpen(true)}>
                Nueva versión
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="text-left">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-5">
                Publicación actual
              </div>
              {published ? (
                <div className="text-xl font-bold flex items-center gap-2">
                  v{published.numero}
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Publicada
                  </Badge>
                </div>
              ) : (
                <div className="text-xl font-bold text-muted-foreground">
                  Sin publicación
                </div>
              )}
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
                  {draft ? ' (1 borrador)' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-left">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-5">
                Última actualización
              </div>
              <div className="text-xl font-bold">
                {new Date(form.updatedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-lg font-semibold text-justify mb-4">
          Historial de versiones
        </div>
        <div className="space-y-3">
          {versionsNewestFirst.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este formulario todavía no tiene versiones.</p>
          ) : (
            versionsNewestFirst.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                busy={commandBusy && pendingCommand?.version.id === version.id}
                onView={() => handleViewVersion(version)}
                onPublish={() => setPendingCommand({ kind: 'publish', version })}
                onArchive={() => setPendingCommand({ kind: 'archive', version })}
                onCreateVersion={() => setVersionModalOpen(true)}
                onClone={() => setCloneTarget(version)}
              />
            ))
          )}
        </div>

        <VersionModal
          open={versionModalOpen}
          onOpenChange={setVersionModalOpen}
          formId={formId!}
          versions={form.versiones}
          onVersionCreated={handleDeriveSuccess}
        />

        {pendingCommand && (
          <ConfirmCommandDialog
            command={pendingCommand}
            onOpenChange={() => setPendingCommand(null)}
            onConfirm={confirmPendingCommand}
            busy={commandBusy}
            error={commandError}
          />
        )}

        {cloneTarget && (
          <CloneFormDialog
            open
            onOpenChange={next => { if (!next) setCloneTarget(null); }}
            sourceFormId={form.id}
            sourceVersion={cloneTarget}
            onCloned={handleCloneSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default FormDetailPage;
