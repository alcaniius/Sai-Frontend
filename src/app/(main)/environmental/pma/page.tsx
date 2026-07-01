'use client';

import { useQuery } from '@tanstack/react-query';
import { environmentalService } from '@/lib/services';
import { PMACard } from '@/components/environmental/PMACard';
import { Plus } from 'lucide-react';

export default function PMAPage() {
  const { data: pmas, isLoading } = useQuery({
    queryKey: ['pmas'],
    queryFn: environmentalService.getPMAs,
  });

  const handleDownload = (id: string) => {
    // Week 3 integration: Generate PDF via BullMQ
    alert(`En la semana 3 el backend generará este PDF asícronamente (PMA: ${id})`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planes de Manejo Ambiental</h1>
          <p className="text-gray-600 mt-1">Gestión y control de medidas correctivas.</p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          onClick={() => alert('Pendiente para integración de formularios complejos.')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear PMA
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : pmas?.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay PMAs registrados</h3>
          <p className="text-gray-500">Comience creando un nuevo plan de manejo ambiental.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pmas?.map((pma: any) => (
            <PMACard key={pma.id} pma={pma} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
