import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Version } from '@/types/form';
import { createVersion } from '@/services/form';

type VersionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  versions: Version[];
  onVersionCreated: (version: Version) => void;
};

const VersionModal = ({ open, onOpenChange, formId, versions, onVersionCreated }: VersionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const { handleSubmit } = useForm();

  const availableVersions = versions.filter(v => v.estado === 'publicada');

  const onSubmit = async () => {
    if (!selectedVersionId) {
      setError('Selecciona una versión para continuar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newVersion = await createVersion({
        formularioId: formId,
        versionOrigenId: selectedVersionId
      });
      
      onVersionCreated(newVersion);
      setSelectedVersionId('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}. Intenta de nuevo.` : 'Error al crear la versión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedVersionId('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Versión</DialogTitle>
          <DialogDescription>
            Crea una nueva versión copiando la estructura de una versión existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="versionOrigen">Versión base *</Label>
            <Select
              value={selectedVersionId}
              onValueChange={setSelectedVersionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una versión" />
              </SelectTrigger>
              <SelectContent>
                {availableVersions.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Versiones disponibles</SelectLabel>
                    {availableVersions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        Versión {version.numero} ({version.estado})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <SelectGroup>
                    <SelectLabel>No hay versiones publicadas</SelectLabel>
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-sm text-red-500 mt-1" role="alert">{error}</p>
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
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || availableVersions.length === 0}>
              {isLoading ? 'Creando…' : 'Crear Versión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VersionModal;
