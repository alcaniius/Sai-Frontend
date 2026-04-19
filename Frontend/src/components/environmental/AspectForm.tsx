import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const aspectSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido'),
  description: z.string().optional(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { message: 'Seleccione un impacto' }),
  probability: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], { message: 'Seleccione una probabilidad' }),
});

export type AspectFormData = z.infer<typeof aspectSchema>;

interface AspectFormProps {
  initialData?: Partial<AspectFormData>;
  onSubmit: (data: AspectFormData) => Promise<void>;
  isLoading: boolean;
}

export const AspectForm: React.FC<AspectFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AspectFormData>({
    resolver: zodResolver(aspectSchema),
    defaultValues: {
      name: '',
      description: '',
      impact: 'LOW',
      probability: 'LOW',
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre del Aspecto</label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
          placeholder="Ej: Consumo de energía eléctrica"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción / Detalles</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
          placeholder="Opcional. Detalles adicionales del proceso o aspecto..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nivel de Impacto</label>
          <select
            {...register('impact')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900 bg-white"
          >
            <option value="LOW">Bajo (Low)</option>
            <option value="MEDIUM">Medio (Medium)</option>
            <option value="HIGH">Alto (High)</option>
            <option value="CRITICAL">Crítico (Critical)</option>
          </select>
          {errors.impact && <p className="mt-1 text-sm text-red-600">{errors.impact.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Probabilidad de Ocurrencia</label>
          <select
            {...register('probability')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900 bg-white"
          >
            <option value="LOW">Baja (Low)</option>
            <option value="MEDIUM">Media (Medium)</option>
            <option value="HIGH">Alta (High)</option>
            <option value="VERY_HIGH">Muy Alta (Very High)</option>
          </select>
          {errors.probability && <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p>}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-200">
        <Link
          href="/dashboard/environmental/aspects"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a la Matriz
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Guardando...' : 'Guardar Aspecto'}
        </button>
      </div>
    </form>
  );
};
