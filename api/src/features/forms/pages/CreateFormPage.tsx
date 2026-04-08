import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Form, Version, FormCreated } from '@/types/form';
import { createForm, createFormFromVersion, getForms, getFormByIdWithVersions } from '@/services/form';

type CreateMode = 'nuevo' | 'desde-version';

type FormData = {
  nombre: string;
  descripcion?: string;
  formularioOrigenId?: string;
  versionOrigenId?: string;
};

const CreateFormPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreateMode>('nuevo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedFormVersions, setSelectedFormVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

  const loadForms = async () => {
    try {
      const data = await getForms();
      setForms(data);
    } catch (err) {
      console.error('Failed to load forms:', err);
    }
  };

  const loadFormVersions = async (formId: string) => {
    try {
      const formData = await getFormByIdWithVersions(formId);
      console.log('Loaded form data with versions:', formData);
      setSelectedFormVersions(formData.versiones);
    } catch (err) {
      console.error('Failed to load form versions:', err);
    }
  };

  const handleModeChange = async (newMode: CreateMode) => {
    setMode(newMode);
    setSelectedFormId('');
    setSelectedFormVersions([]);
    setSelectedVersionId('');
    setValue('formularioOrigenId', '');
    setValue('versionOrigenId', '');

    if (newMode === 'desde-version') {
      await loadForms();
    }
  };

  const handleFormSelect = async (formId: string) => {
    setSelectedFormId(formId);
    setSelectedVersionId('');
    setValue('formularioOrigenId', formId);
    setValue('versionOrigenId', '');
    setSelectedFormVersions([]);

    await loadFormVersions(formId);
  };

  const selectedForm = forms.find(f => f.id === selectedFormId);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      let newForm: FormCreated;

      if (mode === 'nuevo') {
        newForm = await createForm({
          nombre: data.nombre,
          descripcion: data.descripcion
        });
      } else {
        if (!data.formularioOrigenId || !data.versionOrigenId) {
          setError('Selecciona un formulario y una versión para continuar');
          setIsLoading(false);
          return;
        }

        newForm = await createFormFromVersion({
          nombre: data.nombre,
          descripcion: data.descripcion,
          formularioOrigenId: data.formularioOrigenId,
          versionOrigenId: data.versionOrigenId
        });
      }

      navigate(`/forms/${newForm.formId}/versions/${newForm.versionId}/builder`);
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}. Intenta de nuevo.` : 'Error al crear el formulario. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Formulario</CardTitle>
          <CardDescription>
            {mode === 'nuevo'
              ? 'Crea un formulario nuevo vacío'
              : 'Crea un formulario basándote en una versión existente'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="mb-2 block">Modo de creación:</Label>
            <div className="flex gap-4">
              <Button
                variant={mode === 'nuevo' ? 'default' : 'outline'}
                onClick={() => handleModeChange('nuevo')}
              >
                Nuevo
              </Button>
              <Button
                variant={mode === 'desde-version' ? 'default' : 'outline'}
                onClick={() => handleModeChange('desde-version')}
              >
                Desde versión existente
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...register('nombre', { required: 'El nombre es requerido' })}
                placeholder="p. ej., Formulario de evaluación"
                autoComplete="off"
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 mt-1" role="alert">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                {...register('descripcion')}
                placeholder="Descripción breve del formulario…"
                autoComplete="off"
              />
            </div>

            {mode === 'desde-version' && (
              <>
                <div>
                  <Label htmlFor="formularioOrigenId">Formulario origen *</Label>
                  <Select
                    value={selectedFormId}
                    onValueChange={handleFormSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un formulario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Formularios</SelectLabel>
                        {forms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.nombre} (v{form.ultimaVersion})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <input type="hidden" {...register('formularioOrigenId', { required: mode === 'desde-version' ? 'Selecciona un formulario' : false })} />
                  {errors.formularioOrigenId && (
                    <p className="text-sm text-red-500 mt-1">{errors.formularioOrigenId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="versionOrigenId">Versión origen *</Label>
                  <Select
                    value={selectedVersionId}
                    onValueChange={(value) => {
                      setSelectedVersionId(value);
                      setValue('versionOrigenId', value);
                    }}
                    disabled={!selectedForm}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedForm ? "Selecciona una versión" : "Selecciona un formulario primero"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Versiones</SelectLabel>
                        {selectedFormVersions.map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            Versión {version.numero} ({version.estado})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <input type="hidden" {...register('versionOrigenId', { required: mode === 'desde-version' ? 'Selecciona una versión' : false })} />
                  {errors.versionOrigenId && (
                    <p className="text-sm text-red-500 mt-1">{errors.versionOrigenId.message}</p>
                  )}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-500" role="alert">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/forms')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando…' : 'Crear Formulario'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateFormPage;
