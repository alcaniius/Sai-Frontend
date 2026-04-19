import React from 'react';
import { SignificanceBadge } from './SignificanceBadge';
import { FileEdit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Aspect {
  id: string;
  name: string;
  description?: string;
  impact: string;
  probability: string;
  significance: 'INSIGNIFICANT' | 'MODERATE' | 'SIGNIFICANT' | 'CRITICAL';
}

interface AspectMatrixProps {
  aspects: Aspect[];
  onDelete: (id: string) => void;
}

export const AspectMatrix: React.FC<AspectMatrixProps> = ({ aspects, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aspecto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impacto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probabilidad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Significancia</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {aspects.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                No hay aspectos ambientales registrados.
              </td>
            </tr>
          ) : (
            aspects.map((aspect) => (
              <tr key={aspect.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{aspect.name}</div>
                  {aspect.description && <div className="text-xs text-gray-500 truncate max-w-xs">{aspect.description}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {aspect.impact}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {aspect.probability}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SignificanceBadge level={aspect.significance} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <Link href={`/dashboard/environmental/aspects/${aspect.id}`} className="text-blue-600 hover:text-blue-900">
                      <FileEdit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => onDelete(aspect.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
