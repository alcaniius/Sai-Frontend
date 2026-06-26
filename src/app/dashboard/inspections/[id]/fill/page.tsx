'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { inspectionsService, InspectionTemplate, sitesService, Site } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ResponseStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';

interface ItemResponse {
  status: ResponseStatus;
  observation: string;
}

export default function FillInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [siteId, setSiteId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalObservations, setGeneralObservations] = useState('');
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});

  useEffect(() => {
    if (user?.firstName) {
      setInspectorName(`${user.firstName} ${user.lastName || ''}`.trim());
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tempData, sitesData] = await Promise.all([
          inspectionsService.getTemplateById(id),
          sitesService.getAll()
        ]);
        setTemplate(tempData);
        setSites(sitesData);
        
        // Initialize responses
        const initialResponses: Record<string, ItemResponse> = {};
        tempData.items?.forEach(item => {
          initialResponses[item.id] = { status: 'COMPLIANT', observation: '' };
        });
        setResponses(initialResponses);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar el formulario');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleResponseChange = (itemId: string, field: keyof ItemResponse, value: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) {
      setError('Debe seleccionar una sede');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // 1. Create Record
      const record = await inspectionsService.createRecord({
        templateId: id,
        siteId,
        inspectorName,
        supervisorName,
        date: new Date(date).toISOString(),
        observations: generalObservations,
      });

      // 2. Submit Responses
      const responsesArray = Object.entries(responses).map(([itemId, res]) => ({
        itemId,
        status: res.status,
        observation: res.observation,
      }));

      await inspectionsService.submitResponses(record.id, { responses: responsesArray });
      
      router.push('/dashboard/documents');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el registro');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>;
  }

  if (!template) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Formulario no encontrado'}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  // Group items by category
  const groupedItems: Record<string, NonNullable<typeof template.items>> = {};
  template.items?.forEach(item => {
    const cat = item.category || 'General';
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat]!.push(item);
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{template.name}</h2>
            <p className="text-muted-foreground">{template.code} - {template.description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteId">Sede <span className="text-red-500">*</span></Label>
              <Select value={siteId} onValueChange={setSiteId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Inspección <span className="text-red-500">*</span></Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspectorName">Responsable de Inspección <span className="text-red-500">*</span></Label>
              <Input 
                id="inspectorName" 
                value={inspectorName} 
                onChange={e => setInspectorName(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisorName">Supervisor / Jefe de Área</Label>
              <Input 
                id="supervisorName" 
                value={supervisorName} 
                onChange={e => setSupervisorName(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 grid gap-4 md:grid-cols-[1fr_200px_1fr] items-start hover:bg-muted/30 transition-colors">
                      <div>
                        <span className="font-medium mr-2">{item.order}.</span>
                        <span className="text-sm">{item.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={responses[item.id]?.status} 
                          onValueChange={(val) => handleResponseChange(item.id, 'status', val as ResponseStatus)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMPLIANT">Cumple (C)</SelectItem>
                            <SelectItem value="NON_COMPLIANT">No Cumple (NC)</SelectItem>
                            <SelectItem value="NOT_APPLICABLE">No Aplica (NA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Input
                          placeholder="Observación (opcional)"
                          value={responses[item.id]?.observation}
                          onChange={(e) => handleResponseChange(item.id, 'observation', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Ingrese cualquier observación adicional sobre la inspección..."
              value={generalObservations}
              onChange={e => setGeneralObservations(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>}
            <Save className="mr-2 h-4 w-4" />
            Guardar Inspección
          </Button>
        </div>
      </form>
    </div>
  );
}
