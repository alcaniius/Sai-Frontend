'use client';

import { useQuery } from '@tanstack/react-query';
import { environmentalService } from '@/lib/services';
import { Clock, AlertCircle } from 'lucide-react';

export default function ANLAPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['anla'],
    queryFn: environmentalService.getANLAReports,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes ANLA</h1>
        <p className="text-gray-600 mt-1">Cronograma de obligaciones normativas ambientales.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reports?.length === 0 ? (
             <div className="p-12 text-center">
               <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes listados</h3>
               <p className="text-gray-500">Agregue obligaciones normativas para hacer seguimiento.</p>
             </div>
          ) : (
            <div className="p-6">
               <div className="space-y-8">
                 {/* Línea de tiempo visual simulada para los reportes */}
                 {reports?.map((report: any, index: number) => (
                   <div key={report.id} className="relative flex">
                     {index !== reports.length - 1 && (
                       <div className="absolute top-8 left-4 bottom-[-32px] w-0.5 bg-gray-200"></div>
                     )}
                     <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${new Date(report.dueDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                       {new Date(report.dueDate) < new Date() ? <AlertCircle className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                     </div>
                     <div className="ml-6 flex-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
                            <p className="text-sm text-gray-500 font-mono mt-1">Tipo: {report.reportType}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            Vence: {new Date(report.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
