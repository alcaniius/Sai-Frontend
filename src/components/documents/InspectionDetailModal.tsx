'use client';

import { useEffect, useState } from 'react';
import { X, Calendar, User, MapPin, CheckCircle, AlertTriangle, EyeOff, ShieldAlert, Award, AlertOctagon } from 'lucide-react';
import { inspectionsService } from '@/lib/services';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | null;
}

interface InspectionResponseDetail {
  id: string;
  itemId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  observation?: string;
  item: {
    description: string;
    category?: string;
    order: number;
  };
}

interface InspectionRecordDetail {
  id: string;
  date: string;
  inspectorName: string;
  supervisorName?: string;
  observations?: string;
  score?: number;
  site?: {
    name: string;
  };
  template: {
    name: string;
    code: string;
    description?: string;
    formType?: string;
  };
  responses: InspectionResponseDetail[];
}

export function InspectionDetailModal({ isOpen, onClose, recordId }: InspectionDetailModalProps) {
  const [record, setRecord] = useState<InspectionRecordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingNC, setGeneratingNC] = useState(false);
  const [ncResult, setNcResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && recordId) {
      const fetchDetail = async () => {
        try {
          setLoading(true);
          setError('');
          const data = await inspectionsService.getRecordById(recordId);
          setRecord(data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Error al cargar el detalle de la inspección');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    } else {
      setRecord(null);
    }
  }, [isOpen, recordId]);

  if (!isOpen) return null;

  // Group responses by category
  const groupedResponses: Record<string, InspectionResponseDetail[]> = {};
  if (record?.responses) {
    record.responses.forEach((resp) => {
      const cat = resp.item.category || 'General';
      if (!groupedResponses[cat]) groupedResponses[cat] = [];
      groupedResponses[cat].push(resp);
    });
  }

  const isSiNo = record?.template?.formType === 'CHECKLIST_SI_NO';

  const nonCompliantCount = record?.responses?.filter((r) => r.status === 'NON_COMPLIANT').length ?? 0;

  const handleGenerateNC = async () => {
    if (!record) return;
    try {
      setGeneratingNC(true);
      setNcResult(null);
      const result = await inspectionsService.createNCFromInspection(record.id);
      if (result.message) {
        setNcResult(result.message);
      } else {
        setNcResult(`No Conformidad #${result.id?.slice(0, 8)} creada correctamente.`);
      }
    } catch (err: any) {
      setNcResult(err.response?.data?.message || 'Error al generar la No Conformidad');
    } finally {
      setGeneratingNC(false);
    }
  };

  // Helper for response status styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            {isSiNo ? 'Sí' : 'Cumple'}
          </span>
        );
      case 'NON_COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="w-3 h-3" />
            {isSiNo ? 'No' : 'No Cumple'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
            <EyeOff className="w-3 h-3" />
            No Aplica
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-sai-border transition-all duration-300 transform scale-100"
        style={{ background: 'var(--sai-bg-card)', borderColor: 'var(--sai-border)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-sai-bg-tertiary transition-colors"
          style={{ color: 'var(--sai-text-secondary)' }}
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-sai-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Cargando detalles de inspección...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <p className="text-lg font-bold text-red-500">Error</p>
            <p className="text-sm" style={{ color: 'var(--sai-text-secondary)' }}>{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : record ? (
          <div>
            {/* Header */}
            <div className="border-b pb-5 mb-6" style={{ borderColor: 'var(--sai-border-subtle)' }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-sai-accent-light" style={{ color: 'var(--sai-accent-text)' }}>
                    {record.template.code}
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold text-sai-text-primary" style={{ color: 'var(--sai-text-primary)' }}>
                    {record.template.name}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--sai-text-secondary)' }}>
                    {record.template.description}
                  </p>
                </div>

                {/* Score Circular Badge */}
                {record.score !== undefined && (
                  <div className="flex items-center gap-3 bg-sai-bg-tertiary px-4 py-2.5 rounded-xl border" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                    <Award className="w-6 h-6 text-yellow-500" />
                    <div>
                      <div className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Puntuación</div>
                      <div className="text-xl font-black" style={{ color: record.score >= 80 ? 'var(--sai-success)' : record.score >= 50 ? 'var(--sai-warning)' : 'var(--sai-danger)' }}>
                        {record.score}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate NC button — only if non-compliant items exist */}
                {nonCompliantCount > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={handleGenerateNC}
                      disabled={generatingNC}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 text-white shadow-sm disabled:opacity-50"
                      style={{ background: 'var(--sai-danger)' }}
                      onMouseEnter={(e) => !generatingNC && (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => !generatingNC && (e.currentTarget.style.opacity = '1')}
                    >
                      {generatingNC ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <AlertOctagon className="w-4 h-4" />
                      )}
                      Generar No Conformidad
                    </button>
                    {ncResult && (
                      <p className="text-xs" style={{ color: ncResult.includes('Error') ? 'var(--sai-danger)' : 'var(--sai-success)' }}>
                        {ncResult}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                  <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Fecha</p>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--sai-text-primary)' }}>
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                  <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Sede</p>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--sai-text-primary)' }}>
                      {record.site?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                  <User className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Responsable</p>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--sai-text-primary)' }}>
                      {record.inspectorName}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border flex items-center gap-3" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                  <User className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Supervisor</p>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--sai-text-primary)' }}>
                      {record.supervisorName || 'Ninguno'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Responses Grouped by Category */}
            <div className="space-y-6">
              {Object.entries(groupedResponses).map(([category, responses]) => (
                <div key={category} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sai-border)' }}>
                  <div className="px-5 py-3 border-b" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}>
                    <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--sai-text-primary)' }}>
                      {category}
                    </h3>
                  </div>
                  <div className="divide-y">
                    {responses.map((resp) => (
                      <div key={resp.id} className="p-4 grid grid-cols-1 md:grid-cols-[auto_1fr_150px] gap-3 items-start hover:bg-sai-bg-tertiary/20" style={{ borderBottom: '1px solid var(--sai-border-subtle)' }}>
                        <span className="font-extrabold text-sm w-6" style={{ color: 'var(--sai-text-secondary)' }}>
                          {resp.item.order}.
                        </span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>
                            {resp.item.description}
                          </p>
                          {resp.observation && (
                            <p className="text-xs mt-1.5 p-2 rounded-lg bg-sai-bg-tertiary/40 border border-dashed text-sai-text-secondary" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)', color: 'var(--sai-text-secondary)' }}>
                              <span className="font-semibold text-sai-text-tertiary">Obs: </span>
                              {resp.observation}
                            </p>
                          )}
                        </div>
                        <div className="flex md:justify-end">
                          {getStatusBadge(resp.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* General Observations */}
            {record.observations && (
              <div className="mt-6 p-5 rounded-2xl border" style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border)' }}>
                <h4 className="font-extrabold text-sm mb-2" style={{ color: 'var(--sai-text-primary)' }}>Observaciones Generales</h4>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--sai-text-secondary)' }}>
                  {record.observations}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
