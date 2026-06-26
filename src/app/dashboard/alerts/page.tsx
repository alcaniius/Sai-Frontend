'use client';

import { useState, useEffect } from 'react';
import { alertsService, Alert } from '@/lib/services';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertsService.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await alertsService.markAsRead(id);
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM': return <Info className="w-5 h-5 text-yellow-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-blue-600" />
            Centro de Alertas
          </h1>
          <p className="text-gray-500 mt-1">Notificaciones y tareas pendientes del sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Cargando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">¡Todo al día!</h3>
            <p className="text-gray-500">No tienes alertas o notificaciones pendientes.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <li 
                key={alert.id} 
                className={`p-6 hover:bg-gray-50 transition-colors ${!alert.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1">{getPriorityIcon(alert.priority)}</div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {alert.type.replace(/_/g, ' ')}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.read && (
                    <button 
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
