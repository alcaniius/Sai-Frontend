'use client';

import { X, Play, ClipboardCheck, FolderOpen, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { TemplateWithStatus } from '@/lib/services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadDoc: () => void;
  templates: TemplateWithStatus[];
  programs: { id: string; name: string; code: string }[];
}

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario', WEEKLY: 'Semanal', BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual', BIMONTHLY: 'Bimestral', QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral', ANNUAL: 'Anual',
};

const statusColors: Record<string, string> = {
  ON_TRACK: 'var(--sai-success)',
  DUE_SOON: 'var(--sai-warning)',
  OVERDUE: 'var(--sai-danger)',
  PENDING: 'var(--sai-text-tertiary)',
};

const statusLabels: Record<string, string> = {
  ON_TRACK: 'Al día', DUE_SOON: 'Próximo', OVERDUE: 'Vencido', PENDING: 'Sin registros',
};

export function ChecklistPickerModal({ isOpen, onClose, onUploadDoc, templates, programs }: Props) {
  if (!isOpen) return null;

  const grouped: Record<string, TemplateWithStatus[]> = {};
  const ungrouped: TemplateWithStatus[] = [];

  templates.forEach((tpl) => {
    if (tpl.programId && tpl.program) {
      if (!grouped[tpl.programId]) grouped[tpl.programId] = [];
      grouped[tpl.programId].push(tpl);
    } else {
      ungrouped.push(tpl);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)' }}>
        <button onClick={onClose} className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-sai-bg-tertiary transition-colors" style={{ color: 'var(--sai-text-secondary)' }}>
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>Diligenciar Formulario</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sai-text-secondary)' }}>Seleccioná el checklist que querés completar</p>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--sai-text-tertiary)' }} />
            <p style={{ color: 'var(--sai-text-secondary)' }}>No hay formularios disponibles</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Grouped by program */}
            {programs.filter(p => grouped[p.id]?.length).map((program) => (
              <div key={program.id}>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4" style={{ color: 'var(--sai-accent)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>
                    {program.code} — {program.name}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[program.id].map((tpl) => (
                    <TemplateRow key={tpl.id} tpl={tpl} onClose={onClose} />
                  ))}
                </div>
              </div>
            ))}

            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-4 h-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>
                    Otros Formularios
                  </span>
                </div>
                <div className="space-y-2">
                  {ungrouped.map((tpl) => (
                    <TemplateRow key={tpl.id} tpl={tpl} onClose={onClose} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-4 text-center" style={{ borderColor: 'var(--sai-border-subtle)' }}>
          <button
            onClick={() => { onClose(); onUploadDoc(); }}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--sai-accent)' }}
          >
            Subir documento informativo
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ tpl, onClose }: { tpl: TemplateWithStatus; onClose: () => void }) {
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : null;

  return (
    <div
      className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200"
      style={{ background: 'var(--sai-bg-tertiary)', borderColor: 'var(--sai-border-subtle)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--sai-accent-light)', color: 'var(--sai-accent-text)' }}>
            {tpl.code}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--sai-bg-card)', color: 'var(--sai-text-secondary)' }}>
            {frequencyLabels[tpl.frequency] || tpl.frequency}
          </span>
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: statusColors[tpl.status] + '20', color: statusColors[tpl.status] }}
          >
            {statusLabels[tpl.status]}
          </span>
        </div>
        <p className="text-sm font-medium mt-1 truncate" style={{ color: 'var(--sai-text-primary)' }}>{tpl.name}</p>
        {tpl.lastRecordDate && (
          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>
            <Calendar className="w-3 h-3" />
            Última: {formatDate(tpl.lastRecordDate)}
            {tpl.nextDueDate && ` · Próx: ${formatDate(tpl.nextDueDate)}`}
          </div>
        )}
      </div>

      <Link href={`/dashboard/inspections/${tpl.id}/fill`} onClick={onClose}>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl text-white shadow-sm transition-all duration-200" style={{ background: 'var(--sai-success)' }}>
          <Play className="w-3.5 h-3.5" />
          Diligenciar
        </button>
      </Link>
    </div>
  );
}
