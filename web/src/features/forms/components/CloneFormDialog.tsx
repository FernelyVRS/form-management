import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Version } from '@/types/form';
import { useCloneFormMutation } from '@/features/forms/hooks/useFormLifecycle';
import { lifecycleMessage } from '@/features/forms/api/formLifecycleApi';

type CloneFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceFormId: string;
  sourceVersion: Version;
  onCloned: (formId: string, versionId: string) => void;
};

const CloneFormDialog = ({ open, onOpenChange, sourceFormId, sourceVersion, onCloned }: CloneFormDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const clone = useCloneFormMutation();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('');
      setDescription('');
      setLocalError(null);
      clone.reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = () => {
    if (clone.isPending) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError('El nombre es requerido');
      return;
    }
    setLocalError(null);
    clone.mutate(
      {
        name: trimmed,
        description: description.trim() ? description.trim() : null,
        sourceFormId,
        sourceVersionId: sourceVersion.id,
      },
      {
        onSuccess: version => onCloned(version.formId, version.versionId),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clonar formulario</DialogTitle>
          <DialogDescription>
            Crea un nuevo formulario a partir de la Versión {sourceVersion.numero} (
            {sourceVersion.estado === 'Published' ? 'publicada' : 'archivada'}). El original no se modifica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <Label htmlFor="clone-name">Nombre *</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Nombre del nuevo formulario"
              autoComplete="off"
              disabled={clone.isPending}
            />
            {localError && (
              <p className="text-sm text-red-500 mt-1" role="alert">{localError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="clone-description">Descripción (opcional)</Label>
            <Input
              id="clone-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Descripción breve…"
              autoComplete="off"
              disabled={clone.isPending}
            />
          </div>

          {clone.isError && (
            <p className="text-sm text-red-500" role="alert">{lifecycleMessage(clone.error)}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={clone.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={clone.isPending}>
              {clone.isPending ? 'Clonando…' : 'Clonar formulario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CloneFormDialog;
