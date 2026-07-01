'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { inspectionsService, InspectionTemplate, sitesService, Site } from '@/lib/services';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

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
      
      const record = await inspectionsService.createRecord({
        templateId: id,
        siteId,
        inspectorName,
        supervisorName,
        date: new Date(date).toISOString(),
        observations: generalObservations,
      });

      const responsesArray = Object.entries(responses).map(([itemId, res]) => ({
        itemId,
        status: res.status,
        observation: res.observation,
      }));

      await inspectionsService.submitResponses(record.id, { responses: responsesArray });
      
      router.push('/documents');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el registro');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando formulario...</div>;
  }

  if (!template) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex flex-col items-center">
          <AlertCircle className="h-6 w-6 mb-2" />
          <p className="font-bold">Error</p>
          <p>{error || 'Formulario no encontrado'}</p>
          <button 
            type="button" 
            className="mt-4 inline-flex items-center px-4 py-2 bg-white text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </button>
        </div>
      </div>
    );
  }

  const isSiNo = template.formType === 'CHECKLIST_SI_NO';
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
          <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{template.name}</h2>
            <p className="text-gray-500">{template.code} - {template.description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Información General</h3>
          </div>
          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="siteId" className="block text-sm font-medium text-gray-700">Sede <span className="text-red-500">*</span></label>
              <select 
                id="siteId"
                value={siteId} 
                onChange={(e) => setSiteId(e.target.value)} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Seleccione una sede</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha de Inspección <span className="text-red-500">*</span></label>
              <input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="inspectorName" className="block text-sm font-medium text-gray-700">Responsable de Inspección <span className="text-red-500">*</span></label>
              <input 
                id="inspectorName" 
                value={inspectorName} 
                onChange={(e) => setInspectorName(e.target.value)} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700">Supervisor / Jefe de Área</label>
              <input 
                id="supervisorName" 
                value={supervisorName} 
                onChange={(e) => setSupervisorName(e.target.value)} 
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-blue-50/50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="p-4 grid gap-4 md:grid-cols-[1fr_200px_1fr] items-start hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="font-bold text-gray-700 mr-2">{item.order}.</span>
                      <span className="text-sm text-gray-800">{item.description}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={responses[item.id]?.status || 'COMPLIANT'} 
                        onChange={(e) => handleResponseChange(item.id, 'status', e.target.value as ResponseStatus)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="COMPLIANT">{isSiNo ? 'Sí (SI)' : 'Cumple (C)'}</option>
                        <option value="NON_COMPLIANT">{isSiNo ? 'No (NO)' : 'No Cumple (NC)'}</option>
                        <option value="NOT_APPLICABLE">No Aplica (NA)</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Observación (opcional)"
                        value={responses[item.id]?.observation || ''}
                        onChange={(e) => handleResponseChange(item.id, 'observation', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Observaciones Generales</h3>
          </div>
          <div className="p-6">
            <textarea 
              placeholder="Ingrese cualquier observación adicional sobre la inspección..."
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center border border-red-200">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={submitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
            <Save className="mr-2 h-4 w-4" />
            Guardar Inspección
          </button>
        </div>
      </form>
    </div>
  );
}
