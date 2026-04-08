import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getForms } from '@/services/form';
import type { Form } from '@/types/form';

const FormListPage = () => {
    const navigate = useNavigate();
    const [forms, setForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadForms = async () => {
            try {
                const data = await getForms();
                setForms(data);
            } catch (error) {
                console.error('Failed to load forms:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadForms();
    }, []);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
                            <CardHeader>
                                <CardTitle className="text-lg">{form.nombre}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {form.descripcion || 'Sin descripción'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">
                                        {form.totalVersiones} {form.totalVersiones === 1 ? 'versión' : 'versiones'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        v{form.ultimaVersion}
                                    </span>
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