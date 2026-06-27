'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService, programsService, inspectionsService, CreateDocumentInput, Document, EnvironmentalProgram, InspectionTemplate, TemplateWithStatus } from '@/lib/services';
import { DocumentModal } from '@/components/documents/DocumentModal';
import { InspectionDetailModal } from '@/components/documents/InspectionDetailModal';
import { ChecklistPickerModal } from '@/components/documents/ChecklistPickerModal';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { Plus, FileText, Calendar, CheckCircle, XCircle, Clock, FolderOpen, ClipboardList, Play, AlertTriangle, Eye, ClipboardCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';

const statusStyles: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'var(--sai-bg-tertiary)', text: 'var(--sai-text-secondary)' },
  IN_REVIEW: { bg: 'var(--sai-warning-bg)', text: 'var(--sai-warning)' },
  APPROVED: { bg: 'var(--sai-success-bg)', text: 'var(--sai-success)' },
  REJECTED: { bg: 'var(--sai-danger-bg)', text: 'var(--sai-danger)' },
  ARCHIVED: { bg: 'var(--sai-accent-light)', text: 'var(--sai-accent)' },
};

const statusIcons: Record<string, React.ReactNode> = {
  DRAFT: <FileText className="w-4 h-4" />,
  IN_REVIEW: <Clock className="w-4 h-4" />,
  APPROVED: <CheckCircle className="w-4 h-4" />,
  REJECTED: <XCircle className="w-4 h-4" />,
  ARCHIVED: <FileText className="w-4 h-4" />,
};

const frequencyLabels: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

const categoryLabels: Record<string, string> = {
  GUIDE: 'Guía',
  CHECKLIST_TEMPLATE: 'Plantilla',
  DATA_FORMAT: 'Formato',
  CERTIFICATE: 'Certificado',
  REPORT: 'Informe',
};

const typeLabels: Record<string, string> = {
  PLAN: 'Plan',
  PROGRAM: 'Programa',
  PROTOCOL: 'Protocolo',
  INSTRUCTIVE: 'Instructivo',
  MATRIX: 'Matriz',
  FORMAT: 'Formato',
  CHECKLIST: 'Checklist',
  REPORT: 'Informe',
  CERTIFICATE: 'Certificado',
  DATA_SHEET: 'Ficha Técnica',
  INDICATOR: 'Indicador',
  SCHEDULE: 'Cronograma',
  OTHER: 'Otro',
};

function docLabel(doc: Document): string {
  return categoryLabels[doc.category] || typeLabels[doc.type] || doc.type || doc.category;
}

function SectionSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}>
      <div className="px-6 py-4 animate-pulse" style={{ background: 'var(--sai-bg-tertiary)' }}>
        <div className="h-5 w-48 rounded" style={{ background: 'var(--sai-border)' }} />
      </div>
      <div className="p-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'var(--sai-bg-tertiary)', width: `${70 + i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'forms' | 'docs'>('docs');

  const { data: documents, isLoading: docsLoading, isError: docsError } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getAll(),
    retry: 1,
  });

  const { data: programs, isLoading: progsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsService.getAll(),
    retry: 1,
  });

  const { data: templates, isLoading: tempsLoading } = useQuery({
    queryKey: ['templates-status'],
    queryFn: () => inspectionsService.getTemplatesWithStatus(),
    retry: 1,
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['inspection-records'],
    queryFn: () => inspectionsService.getRecords(),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateDocumentInput; file?: File }) =>
      documentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDocumentInput> }) =>
      documentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDocument(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleSubmit = async (data: CreateDocumentInput, file?: File) => {
    if (editingDocument) {
      await updateMutation.mutateAsync({ id: editingDocument.id, data });
    } else {
      await createMutation.mutateAsync({ data, file });
    }
  };

  // Separate documents: informational vs checklist-linked
  const infoDocs = documents?.filter(d => !d.linkedTemplateId) || [];
  const checklistDocs = documents?.filter(d => d.linkedTemplateId) || [];

  // Group templates by program
  const groupedTemplates: Record<string, TemplateWithStatus[]> = {};
  const noProgramTemplates: TemplateWithStatus[] = [];
  templates?.forEach((tpl) => {
    if (tpl.programId) {
      if (!groupedTemplates[tpl.programId]) groupedTemplates[tpl.programId] = [];
      groupedTemplates[tpl.programId].push(tpl);
    } else {
      noProgramTemplates.push(tpl);
    }
  });

  // Group info docs by program
  const groupedInfoDocs: Record<string, Document[]> = {};
  const noProgramInfoDocs: Document[] = [];
  infoDocs.forEach((doc) => {
    if (doc.programId) {
      if (!groupedInfoDocs[doc.programId]) groupedInfoDocs[doc.programId] = [];
      groupedInfoDocs[doc.programId].push(doc);
    } else {
      noProgramInfoDocs.push(doc);
    }
  });

  const isAllLoaded = !docsLoading && !progsLoading && !tempsLoading && !recordsLoading;
  const hasPrograms = programs && programs.length > 0;
  const hasTemplates = templates && templates.length > 0;
  const hasDocuments = documents && documents.length > 0;
  const hasRecords = records && records.length > 0;

  // ── Tab Button ──
  const TabButton = ({ id, label, icon, count }: { id: 'forms' | 'docs'; label: string; icon: React.ReactNode; count: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200"
      style={{
        background: activeTab === id ? 'var(--sai-accent)' : 'var(--sai-bg-tertiary)',
        color: activeTab === id ? '#ffffff' : 'var(--sai-text-secondary)',
        border: activeTab === id ? 'none' : '1px solid var(--sai-border)',
      }}
    >
      {icon}
      {label}
      <span
        className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: activeTab === id ? 'rgba(255,255,255,0.25)' : 'var(--sai-border)',
          color: activeTab === id ? '#ffffff' : 'var(--sai-text-tertiary)',
        }}
      >
        {count}
      </span>
    </button>
  );

  // ── Checklist Card ──
  const ChecklistCard = ({ tpl, programName }: { tpl: TemplateWithStatus; programName?: string }) => {
    const statusColors: Record<string, string> = {
      ON_TRACK: 'var(--sai-success)',
      DUE_SOON: 'var(--sai-warning)',
      OVERDUE: 'var(--sai-danger)',
      PENDING: 'var(--sai-text-tertiary)',
    };
    const statusLabels: Record<string, string> = {
      ON_TRACK: 'Al día',
      DUE_SOON: 'Próximo',
      OVERDUE: 'Vencido',
      PENDING: 'Sin registros',
    };
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
    <div
      className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 group"
      style={{
        background: 'var(--sai-bg-card)',
        border: '1px solid var(--sai-border)',
        boxShadow: 'var(--sai-shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--sai-success)';
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--sai-success), var(--sai-shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--sai-border)';
        e.currentTarget.style.boxShadow = 'var(--sai-shadow-sm)';
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--sai-success-bg)' }}
        >
          <ClipboardCheck className="w-6 h-6" style={{ color: 'var(--sai-success)' }} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: 'var(--sai-accent-light)', color: 'var(--sai-accent-text)' }}
            >
              {tpl.code}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}
            >
              {frequencyLabels[tpl.frequency] || tpl.frequency}
            </span>
          </div>
          <h3 className="text-sm font-bold mt-1.5" style={{ color: 'var(--sai-text-primary)' }}>
            {tpl.name}
          </h3>
          {tpl.description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }}>
              {tpl.description}
            </p>
          )}
          {programName && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--sai-text-tertiary)' }}>
              <FolderOpen className="w-3 h-3" />
              {programName}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: statusColors[tpl.status] + '20', color: statusColors[tpl.status], border: `1px solid ${statusColors[tpl.status]}40` }}
            >
              {statusLabels[tpl.status]}
            </span>
            {tpl.lastRecordDate && (
              <span className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>
                Última: {formatDate(tpl.lastRecordDate)}
                {tpl.nextDueDate && ` · Próx: ${formatDate(tpl.nextDueDate)}`}
              </span>
            )}
            {tpl.status === 'PENDING' && (
              <span className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>Sin inspecciones registradas</span>
            )}
          </div>
        </div>
      </div>

      <Link href={`/dashboard/inspections/${tpl.id}/fill`}>
        <button
          className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 text-white shadow-sm"
          style={{ background: 'var(--sai-success)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Play className="w-4 h-4 mr-2" />
          Diligenciar
        </button>
      </Link>
    </div>
  );
};

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>Gestión Documental</h1>
          <p className="mt-1" style={{ color: 'var(--sai-text-secondary)' }}>
            Diligencia formularios de inspección y administra los documentos del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChecklistPicker(true)}
            className="flex items-center px-4 py-2 rounded-lg transition-all duration-200 text-white"
            style={{ background: 'var(--sai-success)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Play className="w-5 h-5 mr-2" />
            Diligenciar Formulario
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 rounded-lg transition-all duration-200"
            style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)', border: '1px solid var(--sai-border)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sai-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sai-bg-tertiary)'}
          >
            <Plus className="w-5 h-5 mr-2" />
            Subir Documento
        </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <TabButton
          id="forms"
          label="Formularios para Diligenciar"
          icon={<ClipboardCheck className="w-4 h-4" />}
          count={templates?.length || 0}
        />
        <TabButton
          id="docs"
          label="Documentos Informativos"
          icon={<BookOpen className="w-4 h-4" />}
          count={infoDocs.length}
        />
      </div>

      <div className="space-y-6">
        {/* Loading */}
        {(progsLoading || tempsLoading) && (
          <>
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: FORMULARIOS PARA DILIGENCIAR
           ════════════════════════════════════════════════════════════ */}
        {activeTab === 'forms' && (
          <>
            {/* Checklists grouped by program */}
            {hasPrograms && programs.map((program) => {
              const programTpls = groupedTemplates[program.id] || [];
              if (programTpls.length === 0) return null;
              return (
                <div key={program.id}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <FolderOpen className="w-4 h-4" style={{ color: 'var(--sai-accent)' }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>
                      {program.code} — {program.name}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {programTpls.map((tpl) => (
                      <ChecklistCard key={tpl.id} tpl={tpl} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Templates without program */}
            {noProgramTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <ClipboardList className="w-4 h-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>
                    Otros Formularios
                  </h2>
                </div>
                <div className="space-y-3">
                  {noProgramTemplates.map((tpl) => (
                    <ChecklistCard key={tpl.id} tpl={tpl} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {isAllLoaded && !hasTemplates && (
              <div
                className="rounded-xl text-center py-12"
                style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}
              >
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                <p className="font-semibold" style={{ color: 'var(--sai-text-secondary)' }}>No hay formularios configurados</p>
                <p className="text-sm mt-1" style={{ color: 'var(--sai-text-tertiary)' }}>
                  Los formularios tipo checklist se configuran desde las plantillas de inspección.
                </p>
              </div>
            )}

            {/* ── History of filled records ── */}
            {hasRecords && (
              <div
                className="rounded-xl overflow-hidden mt-4"
                style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}
              >
                <div
                  className="px-6 py-4 flex items-center"
                  style={{ background: 'var(--sai-success-bg)', borderBottom: '1px solid var(--sai-border)' }}
                >
                  <CheckCircle className="w-5 h-5 mr-2" style={{ color: 'var(--sai-success)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--sai-success)' }}>Historial de Formularios Diligenciados</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ background: 'var(--sai-bg-tertiary)' }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Formulario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Sede</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Responsable</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Puntuación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, idx) => (
                        <tr
                          key={record.id}
                          style={{
                            background: 'var(--sai-bg-card)',
                            borderBottom: idx < records.length - 1 ? '1px solid var(--sai-border-subtle)' : 'none',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sai-bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sai-bg-card)'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-primary)' }}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--sai-text-primary)' }}>
                            {record.template?.code ? `${record.template.code} — ${record.template.name}` : record.template?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-secondary)' }}>
                            {record.site?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-secondary)' }}>
                            {record.inspectorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.score !== undefined ? (
                              <span
                                className="px-2 py-1 rounded-full text-xs font-bold"
                                style={{
                                  background: record.score >= 80 ? 'var(--sai-success-bg)' : record.score >= 50 ? 'var(--sai-warning-bg)' : 'var(--sai-danger-bg)',
                                  color: record.score >= 80 ? 'var(--sai-success)' : record.score >= 50 ? 'var(--sai-warning)' : 'var(--sai-danger)',
                                }}
                              >
                                {record.score}%
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedRecordId(record.id)}
                              className="inline-flex items-center px-2 py-1 text-xs rounded-md transition-all duration-200"
                              style={{
                                background: 'var(--sai-bg-tertiary)',
                                color: 'var(--sai-accent)',
                                border: '1px solid var(--sai-border)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--sai-accent-light)';
                                e.currentTarget.style.color = 'var(--sai-accent-text)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--sai-bg-tertiary)';
                                e.currentTarget.style.color = 'var(--sai-accent)';
                              }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Ver respuestas
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {recordsLoading && <SectionSkeleton />}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: DOCUMENTOS INFORMATIVOS
           ════════════════════════════════════════════════════════════ */}
        {activeTab === 'docs' && (
          <>
            {hasPrograms && programs.map((program) => {
              const programDocs = groupedInfoDocs[program.id] || [];
              if (programDocs.length === 0) return null;
              return (
                <div
                  key={program.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}
                >
                  <div
                    className="px-6 py-4 flex items-center"
                    style={{ background: 'var(--sai-accent-light)', borderBottom: '1px solid var(--sai-border)' }}
                  >
                    <FolderOpen className="w-5 h-5 mr-2" style={{ color: 'var(--sai-accent)' }} />
                    <h2 className="text-lg font-bold" style={{ color: 'var(--sai-accent-text)' }}>{program.code} — {program.name}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead style={{ background: 'var(--sai-bg-tertiary)' }}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Documento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Versión</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programDocs.map((doc, idx) => {
                          const status = statusStyles[doc.status] || statusStyles.DRAFT;
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => doc.filePath && setPreviewDocument(doc)}
                              style={{
                                background: 'var(--sai-bg-card)',
                                borderBottom: idx < programDocs.length - 1 ? '1px solid var(--sai-border-subtle)' : 'none',
                                cursor: doc.filePath ? 'pointer' : 'default',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sai-bg-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sai-bg-card)'}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <FileText className="w-5 h-5 mr-3" style={{ color: 'var(--sai-text-tertiary)' }} />
                                  <div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>
                                      {doc.code ? `${doc.code} - ${doc.title}` : doc.title}
                                    </div>
                                    {doc.description && (
                                      <div className="text-xs" style={{ color: 'var(--sai-text-secondary)' }}>{doc.description}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{docLabel(doc)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full"
                                  style={{ background: status.bg, color: status.text }}
                                >
                                  {statusIcons[doc.status]}
                                  {doc.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>v{doc.version}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setEditingDocument(doc)} style={{ color: 'var(--sai-accent)' }} className="mr-1.5">Editar</button>
                                <button onClick={() => deleteMutation.mutate(doc.id)} style={{ color: 'var(--sai-danger)' }}>Eliminar</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Docs without program */}
            {noProgramInfoDocs.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}
              >
                <div
                  className="px-6 py-4 flex items-center"
                  style={{ background: 'var(--sai-bg-tertiary)', borderBottom: '1px solid var(--sai-border)' }}
                >
                  <FolderOpen className="w-5 h-5 mr-2" style={{ color: 'var(--sai-text-secondary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--sai-text-primary)' }}>Otros Documentos</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead style={{ background: 'var(--sai-bg-tertiary)' }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Documento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-secondary)' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noProgramInfoDocs.map((doc, idx) => {
                        const status = statusStyles[doc.status] || statusStyles.DRAFT;
                        return (
                          <tr
                            key={doc.id}
                            onClick={() => doc.filePath && setPreviewDocument(doc)}
                            style={{
                              background: 'var(--sai-bg-card)',
                              borderBottom: idx < noProgramInfoDocs.length - 1 ? '1px solid var(--sai-border-subtle)' : 'none',
                              cursor: doc.filePath ? 'pointer' : 'default',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sai-bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sai-bg-card)'}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 mr-3" style={{ color: 'var(--sai-text-tertiary)' }} />
                                <div>
                                  <div className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>
                                    {doc.code ? `${doc.code} - ${doc.title}` : doc.title}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{docLabel(doc)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full" style={{ background: status.bg, color: status.text }}>
                                {statusIcons[doc.status]}
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setEditingDocument(doc)} style={{ color: 'var(--sai-accent)' }} className="mr-1.5">Editar</button>
                              <button onClick={() => deleteMutation.mutate(doc.id)} style={{ color: 'var(--sai-danger)' }}>Eliminar</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {isAllLoaded && infoDocs.length === 0 && (
              <div
                className="rounded-xl text-center py-12"
                style={{ background: 'var(--sai-bg-card)', boxShadow: 'var(--sai-shadow-md)', border: '1px solid var(--sai-border)' }}
              >
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                <p style={{ color: 'var(--sai-text-secondary)' }}>No hay documentos informativos creados aún</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 font-medium"
                  style={{ color: 'var(--sai-accent)' }}
                >
                  Crear tu primer documento →
                </button>
              </div>
            )}

            {docsLoading && <SectionSkeleton />}
          </>
        )}

        {/* Error state */}
        {docsError && (
          <div
            className="rounded-xl px-6 py-4 flex items-center gap-3"
            style={{ background: 'var(--sai-warning-bg)', border: '1px solid var(--sai-warning)' }}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--sai-warning)' }} />
            <p className="text-sm" style={{ color: 'var(--sai-warning)' }}>
              No se pudieron cargar los documentos. Verificá que tu sesión tenga una organización asignada.
            </p>
          </div>
        )}
      </div>

      <ChecklistPickerModal
        isOpen={showChecklistPicker}
        onClose={() => setShowChecklistPicker(false)}
        onUploadDoc={() => setShowCreateModal(true)}
        templates={templates || []}
        programs={programs || []}
      />

      <DocumentModal
        isOpen={showCreateModal || !!editingDocument}
        onClose={() => {
          setShowCreateModal(false);
          setEditingDocument(null);
        }}
        onSubmit={handleSubmit}
        document={editingDocument}
        programs={programs || []}
        templates={templates || []}
      />

      <InspectionDetailModal
        isOpen={!!selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
        recordId={selectedRecordId}
      />

      <DocumentPreviewModal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />
    </div>
  );
}
