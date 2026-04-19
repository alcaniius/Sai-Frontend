import React from 'react';
import { FileUp, Calendar, CheckCircle } from 'lucide-react';

interface PMA {
  id: string;
  name: string;
  project: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUBMITTED';
  startDate: string;
  endDate: string;
}

interface PMACardProps {
  pma: PMA;
  onDownload?: (pmaId: string) => void;
}

export const PMACard: React.FC<PMACardProps> = ({ pma, onDownload }) => {
  const isApproved = pma.status === 'APPROVED' || pma.status === 'SUBMITTED';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{pma.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ${isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {pma.status}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4">Proyecto: <span className="font-medium text-gray-700">{pma.project}</span></p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Inicio: {new Date(pma.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>Fin: {new Date(pma.endDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onDownload && onDownload(pma.id)}
        disabled={!isApproved}
        className="w-full flex items-center justify-center py-2 px-4 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
      >
        <FileUp className="w-4 h-4 mr-2" />
        Generar PDF
      </button>
    </div>
  );
};
