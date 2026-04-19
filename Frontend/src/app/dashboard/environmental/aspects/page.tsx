'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentalService } from '@/lib/services';
import { AspectMatrix } from '@/components/environmental/AspectMatrix';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AspectsPage() {
  const queryClient = useQueryClient();

  const { data: aspects, isLoading } = useQuery({
    queryKey: ['aspects'],
    queryFn: environmentalService.getAspects,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => environmentalService.deleteAspect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspects'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este aspecto ambiental?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aspectos e Impactos Ambientales</h1>
          <p className="text-gray-600 mt-1">Matriz de valoración e identificación ISO 14001</p>
        </div>
        <Link
          href="/dashboard/environmental/aspects/new"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar Aspecto
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      ) : (
        <AspectMatrix aspects={aspects || []} onDelete={handleDelete} />
      )}
    </div>
  );
}
