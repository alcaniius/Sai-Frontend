'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentalService } from '@/lib/services';
import { AspectForm, AspectFormData } from '@/components/environmental/AspectForm';
import { useState } from 'react';

export default function AspectEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  
  const isNew = params.id === 'new';

  const { data: aspect, isLoading } = useQuery({
    queryKey: ['aspect', params.id],
    queryFn: () => environmentalService.getAspectById(params.id as string),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: (data: AspectFormData) => {
      if (isNew) {
        return environmentalService.createAspect(data);
      } else {
        return environmentalService.updateAspect(params.id as string, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aspects'] });
      router.push('/environmental/aspects');
    },
    onError: (error: any) => {
      setErrorMsg(error?.response?.data?.message || 'Error al guardar el aspecto.');
    }
  });

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Registrar Nuevo Aspecto' : 'Editar Aspecto Ambiental'}
        </h1>
        <p className="text-gray-600 mt-1">
          La significancia será calculada automáticamente por el backend al guardar.
        </p>
      </div>

      {errorMsg && (
        <div className="max-w-2xl mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <AspectForm
        initialData={aspect}
        onSubmit={async (data) => {
           await saveMutation.mutateAsync(data);
        }}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
