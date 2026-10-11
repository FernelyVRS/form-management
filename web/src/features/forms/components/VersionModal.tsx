import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Version } from '@/types/form';
import { useDeriveVersionMutation } from '@/features/forms/hooks/useFormLifecycle';
import { lifecycleMessage, type LifecycleVersion } from '@/features/forms/api/formLifecycleApi';

type VersionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  versions: Version[];
  onVersionCreated: (version: LifecycleVersion) => void;
};

const sourceLabel = (version: Version) =>
  version.estado === 'Published' ? `Versión ${version.numero} (publicada)` : `Versión ${version.numero} (archivada)`;

const VersionModal = ({ open, onOpenChange, formId, versions, onVersionCreated }: VersionModalProps) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const availableVersions = versions.filter(version =>
    version.estado === 'Published' || version.estado === 'Archived');
  const derive = useDeriveVersionMutation(formId);

  useEffect(() => {
    if (!open) return;
    // Keep the most recent selection valid: drop it if the source disappeared after a refresh.
    if (selectedVersionId && !availableVersions.some(version => version.id === selectedVersionId)) {
      setSelectedVersionId('');
    }
  }, [open, availableVersions, selectedVersionId]);

  const onSubmit = () => {
    if (!selectedVersionId || derive.isPending) return;
    derive.mutate(
      { sourceVersionId: selectedVersionId },
      { onSuccess: version => onVersionCreated(version) },
    );
  };

  const handleClose = () => {
    setSelectedVersionId('');
    derive.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Versión</DialogTitle>
          <DialogDescription>
            Crea una nueva versión copiando la estructura de una versión publicada o archivada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <Label htmlFor="versionOrigen">Versión base *</Label>
            <Select
              value={selectedVersionId}
              onValueChange={setSelectedVersionId}
              disabled={derive.isPending}
            >
              <SelectTrigger id="versionOrigen">
                <SelectValue placeholder="Selecciona una versión" />
              </SelectTrigger>
              <SelectContent>
                {availableVersions.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Versiones disponibles</SelectLabel>
                    {availableVersions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {sourceLabel(version)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectGroup>
                    <SelectLabel>No hay versiones publicadas ni archivadas</SelectLabel>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {derive.isError && (
              <p className="text-sm text-red-500 mt-1" role="alert">{lifecycleMessage(derive.error)}</p>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Información:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Se creará una nueva versión en estado &quot;borrador&quot;</li>
              <li>La nueva versión copiará la estructura de la versión seleccionada</li>
              <li>Podrás editar la nueva versión antes de publicarla</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={derive.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={derive.isPending || availableVersions.length === 0}>
              {derive.isPending ? 'Creando…' : 'Crear Versión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VersionModal;
