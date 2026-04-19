'use client';

import Link from 'next/link';
import { Leaf, FileText, AlertTriangle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { environmentalService } from '@/lib/services';

export default function EnvironmentalDashboard() {
  const { data: aspects } = useQuery({
    queryKey: ['aspects'],
    queryFn: environmentalService.getAspects,
  });

  const { data: pmas } = useQuery({
    queryKey: ['pmas'],
    queryFn: environmentalService.getPMAs,
  });

  const significantAspects = aspects?.filter((a: any) => a.significance === 'SIGNIFICANT' || a.significance === 'CRITICAL')?.length || 0;
  const activePmas = pmas?.filter((p: any) => p.status === 'APPROVED' || p.status === 'IN_REVIEW')?.length || 0;

  const stats = [
    {
      name: 'Aspectos Totales',
      value: aspects?.length || 0,
      icon: Leaf,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      name: 'Aspectos Significativos',
      value: significantAspects,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      name: 'PMAs Activos',
      value: activePmas,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'Reportes Próximos',
      value: '2', // Mock, eventually calculate from ANLA reports
      icon: Activity,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Módulo Ambiental (ISO 14001)</h1>
        <p className="text-gray-600 mt-2">
          Gestión de aspectos, impactos y planes de manejo ambiental.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/environmental/aspects" className="block bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:bg-gray-50 transition-colors">
          <Leaf className="w-8 h-8 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Matriz de Aspectos</h2>
          <p className="text-gray-600 text-sm">Evalúa aspectos e impactos ambientales. Calcula significancias automáticamente.</p>
        </Link>
        
        <Link href="/dashboard/environmental/pma" className="block bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:bg-gray-50 transition-colors">
          <FileText className="w-8 h-8 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Planes de Manejo (PMA)</h2>
          <p className="text-gray-600 text-sm">Gestiona y genera PDFs de los Planes de Manejo Ambiental.</p>
        </Link>

        <Link href="/dashboard/environmental/anla" className="block bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 hover:bg-gray-50 transition-colors">
          <Activity className="w-8 h-8 text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reportes ANLA</h2>
          <p className="text-gray-600 text-sm">Cronograma y seguimiento de reportes obligatorios.</p>
        </Link>
      </div>
    </div>
  );
}
