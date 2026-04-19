'use client';

import { useAuthStore } from '@/store/authStore';
import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      name: 'Documentos Activos',
      value: '24',
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'Alertas Pendientes',
      value: '5',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Aprobados',
      value: '18',
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      name: 'En Revisión',
      value: '6',
      icon: Clock,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-600 mt-2">
          Panel de control del Sistema Ambiental Integrado
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Nuevo Documento</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Ver Alertas</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Aprobar Documentos</p>
          </button>
        </div>
      </div>
    </div>
  );
}
