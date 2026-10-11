import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useFormsQuery } from '@/features/forms/hooks/useForms';

const FormListPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: forms = [], isPending, isError, isFetching, refetch } = useFormsQuery();

    const filteredForms = forms.filter(form =>
        form.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateForm = () => {
        navigate('/forms/create');
    };

    const handleFormClick = (formId: string) => {
        navigate(`/forms/${formId}`);
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center gap-3 h-64" role="status">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="text-muted-foreground">Cargando formularios...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container mx-auto flex min-h-64 flex-col items-center justify-center gap-4 py-10" role="alert">
                <div className="text-center">
                    <h1 className="text-xl font-semibold">No se pudieron cargar los formularios</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Comprueba la conexión con la API e intenta nuevamente.</p>
                </div>
                <Button onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? 'Reintentando...' : 'Reintentar'}
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Formularios</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tus formularios</p>
                </div>
                <Button onClick={handleCreateForm}>
                    <span className="mr-2">+</span>
                    Nuevo Formulario
                </Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Buscar formularios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredForms.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron formularios' : 'No hay formularios todavía'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map((form) => (
                        <Card
                            key={form.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleFormClick(String(form.id))}
                        >
                            <CardHeader className="text-left">
                                <div className="flex items-center justify-between space-x-2">
                                    <CardTitle className="text-lg">{form.nombre}</CardTitle>
                                    <Badge variant="secondary">
                                        v{form.ultimaVersion}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {form.descripcion || 'Sin descripción'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex flex-col items-start">
                                        <span className="text-muted-foreground">
                                            Ultima actualización
                                        </span>
                                        <span>
                                            {form.updatedAt
                                                ? new Date(form.updatedAt).toLocaleDateString()
                                                : new Date(form.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-muted-foreground">
                                            Versiones
                                        </span>
                                        <span>
                                            {form.totalVersiones}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FormListPage;
