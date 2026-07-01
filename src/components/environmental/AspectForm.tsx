import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EnvironmentalAspectInput } from '@/lib/services';

const operationConditions = ['NORMAL', 'ABNORMAL', 'EMERGENCY'] as const;
const characters = ['POSITIVE', 'NEGATIVE'] as const;
const scores = [1, 5, 10] as const;

const scoreSchema = () =>
  z.coerce.number().refine(
    (v) => (scores as readonly number[]).includes(v as number),
    { message: 'Valor inválido' },
  );

const aspectSchema = z.object({
  process: z.string().min(1, 'El proceso es requerido'),
  activity: z.string().min(1, 'La actividad es requerida'),
  operationCondition: z.enum(operationConditions, { message: 'Seleccione una condición' }),
  aspectType: z.string().min(1, 'El tipo de aspecto es requerido'),
  aspectDescription: z.string().optional(),
  impactDescription: z.string().optional(),
  character: z.enum(characters, { message: 'Seleccione un carácter' }),
  legalExistence: scoreSchema(),
  legalCompliance: scoreSchema(),
  frequency: scoreSchema(),
  dangerousness: scoreSchema(),
  magnitude: scoreSchema(),
  stakeholderDemand: scoreSchema(),
  stakeholderMgmt: scoreSchema(),
  controls: z.string().optional(),
});

export type AspectFormData = z.infer<typeof aspectSchema>;

interface AspectFormProps {
  initialData?: Partial<EnvironmentalAspectInput>;
  onSubmit: (data: AspectFormData) => Promise<void>;
  isLoading: boolean;
}

const defaultValues: AspectFormData = {
  process: '',
  activity: '',
  operationCondition: 'NORMAL',
  aspectType: '',
  aspectDescription: '',
  impactDescription: '',
  character: 'NEGATIVE',
  legalExistence: 1,
  legalCompliance: 10,
  frequency: 1,
  dangerousness: 1,
  magnitude: 1,
  stakeholderDemand: 1,
  stakeholderMgmt: 1,
  controls: '',
};

export const AspectForm: React.FC<AspectFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AspectFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(aspectSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({ ...defaultValues, ...initialData } as AspectFormData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proceso / Área</label>
          <input
            type="text"
            {...register('process')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
            placeholder="Ej: Gestión de cobro"
          />
          {errors.process && <p className="mt-1 text-sm text-red-600">{errors.process.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Actividad</label>
          <input
            type="text"
            {...register('activity')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
            placeholder="Ej: Atención al usuario"
          />
          {errors.activity && <p className="mt-1 text-sm text-red-600">{errors.activity.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Condición Operativa</label>
          <select
            {...register('operationCondition')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900 bg-white"
          >
            <option value="NORMAL">Normal</option>
            <option value="ABNORMAL">Anormal</option>
            <option value="EMERGENCY">Emergencia</option>
          </select>
          {errors.operationCondition && <p className="mt-1 text-sm text-red-600">{errors.operationCondition.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Aspecto</label>
          <input
            type="text"
            {...register('aspectType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
            placeholder="Ej: Consumo de energía"
          />
          {errors.aspectType && <p className="mt-1 text-sm text-red-600">{errors.aspectType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Carácter</label>
          <select
            {...register('character')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900 bg-white"
          >
            <option value="POSITIVE">Positivo</option>
            <option value="NEGATIVE">Negativo</option>
          </select>
          {errors.character && <p className="mt-1 text-sm text-red-600">{errors.character.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción del Aspecto</label>
        <textarea
          {...register('aspectDescription')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción del Impacto</label>
        <textarea
          {...register('impactDescription')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'legalExistence', label: 'Existencia Legal' },
          { name: 'legalCompliance', label: 'Cumplimiento Legal' },
          { name: 'frequency', label: 'Frecuencia' },
          { name: 'dangerousness', label: 'Peligrosidad' },
          { name: 'magnitude', label: 'Magnitud' },
          { name: 'stakeholderDemand', label: 'Exigencia Partes' },
          { name: 'stakeholderMgmt', label: 'Gestión Partes' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            <select
              {...register(field.name as keyof AspectFormData)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900 bg-white"
            >
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            {errors[field.name as keyof AspectFormData] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[field.name as keyof AspectFormData]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Controles</label>
        <textarea
          {...register('controls')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 text-gray-900"
        />
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-gray-200">
        <Link
          href="/environmental/aspects"
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
