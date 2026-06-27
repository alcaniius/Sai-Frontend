'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  inspectionsService, documentsService, nonConformitiesService, alertsService,
  environmentalService,
} from '@/lib/services';
import {
  ClipboardCheck, Award, AlertOctagon, FileText, AlertTriangle,
  CheckCircle, Clock, TrendingUp, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

function KpiSkeleton() {
  return (
    <div className="rounded-xl p-6 animate-pulse" style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)' }}>
      <div className="h-4 w-24 rounded mb-3" style={{ background: 'var(--sai-bg-tertiary)' }} />
      <div className="h-8 w-16 rounded" style={{ background: 'var(--sai-bg-tertiary)' }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: templates } = useQuery({
    queryKey: ['templates-status'],
    queryFn: () => inspectionsService.getTemplatesWithStatus(),
    retry: 1,
  });

  const { data: records } = useQuery({
    queryKey: ['inspection-records'],
    queryFn: () => inspectionsService.getRecords(),
    retry: 1,
  });

  const { data: docs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getAll(),
    retry: 1,
  });

  const { data: ncs } = useQuery({
    queryKey: ['non-conformities'],
    queryFn: () => nonConformitiesService.getAll(),
    retry: 1,
  });

  const { data: aspects } = useQuery({
    queryKey: ['environmental-aspects'],
    queryFn: () => environmentalService.getAspects(),
    retry: 1,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAll(),
    retry: 1,
  });

  // ── Computed metrics ──
  const totalInspections = records?.length ?? 0;
  const avgScore = records?.length
    ? Math.round(records.filter((r: any) => r.score != null).reduce((sum: number, r: any) => sum + r.score, 0) / records.filter((r: any) => r.score != null).length)
    : null;
  const overdueInspections = templates?.filter((t) => t.status === 'OVERDUE').length ?? 0;
  const dueSoonInspections = templates?.filter((t) => t.status === 'DUE_SOON').length ?? 0;
  const openNCs = ncs?.filter((n) => n.status === 'OPEN' || n.status === 'IN_PROGRESS').length ?? 0;
  const totalDocs = docs?.length ?? 0;
  const approvedDocs = docs?.filter((d) => d.status === 'APPROVED').length ?? 0;
  const openAlerts = alerts?.filter((a: any) => !a.read).length ?? 0;
  const totalAspects = aspects?.length ?? 0;
  const highSignificanceAspects = aspects?.filter((a: any) => a.significanceLevel === 'HIGH_SIGNIFICANCE').length ?? 0;

  const isLoading = !templates || !records || !docs;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>
          Bienvenido, {user?.firstName}
        </h1>
        <p className="mt-1" style={{ color: 'var(--sai-text-secondary)' }}>
          Panel de control del Sistema Ambiental Integrado
        </p>
      </div>

      {/* ═══════════ KPI Cards ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={<ClipboardCheck className="w-5 h-5" />}
              label="Inspecciones"
              value={totalInspections}
              sub={`${overdueInspections} vencidas · ${dueSoonInspections} próximas`}
              color="var(--sai-accent)"
              href="/dashboard/documents"
            />
            <KpiCard
              icon={<Award className="w-5 h-5" />}
              label="Puntuación Promedio"
              value={avgScore != null ? `${avgScore}%` : '—'}
              sub={totalInspections > 0 ? `${totalInspections} registros` : 'Sin datos'}
              color={avgScore != null && avgScore >= 80 ? 'var(--sai-success)' : avgScore != null && avgScore >= 50 ? 'var(--sai-warning)' : 'var(--sai-danger)'}
            />
            <KpiCard
              icon={<AlertOctagon className="w-5 h-5" />}
              label="No Conformidades"
              value={openNCs}
              sub={openNCs > 0 ? 'Abiertas' : 'Sin NC abiertas'}
              color={openNCs > 0 ? 'var(--sai-danger)' : 'var(--sai-success)'}
              href="/dashboard/quality"
            />
            <KpiCard
              icon={<FileText className="w-5 h-5" />}
              label="Documentos"
              value={totalDocs}
              sub={`${approvedDocs} aprobados`}
              color="var(--sai-accent)"
              href="/dashboard/documents"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══════════ Pending / Overdue Inspections ═══════════ */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)', boxShadow: 'var(--sai-shadow-sm)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sai-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--sai-warning)' }} />
              <h2 className="font-bold" style={{ color: 'var(--sai-text-primary)' }}>Inspecciones Pendientes</h2>
            </div>
            <Link href="/dashboard/documents" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: 'var(--sai-accent)' }}>
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--sai-border-subtle)' }}>
            {isLoading ? (
              <div className="p-6 text-center" style={{ color: 'var(--sai-text-tertiary)' }}>Cargando...</div>
            ) : templates?.filter(t => t.status === 'OVERDUE' || t.status === 'DUE_SOON').length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--sai-text-tertiary)' }}>
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--sai-success)' }} />
                Todas las inspecciones están al día
              </div>
            ) : (
              templates?.filter(t => t.status === 'OVERDUE' || t.status === 'DUE_SOON').slice(0, 5).map((tpl) => (
                <Link key={tpl.id} href={`/dashboard/inspections/${tpl.id}/fill`} className="flex items-center justify-between px-6 py-3 hover:bg-sai-bg-hover transition-colors block">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--sai-text-primary)' }}>{tpl.name}</p>
                    <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>{tpl.code}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: tpl.status === 'OVERDUE' ? 'var(--sai-danger-bg)' : 'var(--sai-warning-bg)',
                      color: tpl.status === 'OVERDUE' ? 'var(--sai-danger)' : 'var(--sai-warning)',
                    }}
                  >
                    {tpl.status === 'OVERDUE' ? 'Vencida' : 'Próxima'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ═══════════ Recent Activity ═══════════ */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)', boxShadow: 'var(--sai-shadow-sm)' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sai-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--sai-accent)' }} />
              <h2 className="font-bold" style={{ color: 'var(--sai-text-primary)' }}>Actividad Reciente</h2>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--sai-border-subtle)' }}>
            {isLoading ? (
              <div className="p-6 text-center" style={{ color: 'var(--sai-text-tertiary)' }}>Cargando...</div>
            ) : records?.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--sai-text-tertiary)' }}>
                <ClipboardCheck className="w-8 h-8 mx-auto mb-2" />
                No hay inspecciones registradas aún
              </div>
            ) : (
              records?.slice(0, 5).map((record: any) => (
                <div key={record.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--sai-text-primary)' }}>
                        {record.template?.name || record.template?.code || 'Inspección'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>
                        {record.site?.name || 'N/A'} · {new Date(record.date).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    {record.score != null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={{
                          background: record.score >= 80 ? 'var(--sai-success-bg)' : record.score >= 50 ? 'var(--sai-warning-bg)' : 'var(--sai-danger-bg)',
                          color: record.score >= 80 ? 'var(--sai-success)' : record.score >= 50 ? 'var(--sai-warning)' : 'var(--sai-danger)',
                        }}
                      >
                        {record.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ Secondary KPIs ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MiniKpi label="Aspectos Ambientales" value={totalAspects} sub={`${highSignificanceAspects} significativos`} icon={<AlertTriangle className="w-4 h-4" />} href="/dashboard/environmental/aspects" />
        <MiniKpi label="Alertas Pendientes" value={openAlerts} sub={openAlerts > 0 ? 'Sin leer' : 'Al día'} icon={<AlertTriangle className="w-4 h-4" />} color={openAlerts > 0 ? 'var(--sai-warning)' : undefined} href="/dashboard/alerts" />
        <MiniKpi label="Docs Aprobados" value={`${approvedDocs}/${totalDocs}`} sub="Documentos" icon={<CheckCircle className="w-4 h-4" />} href="/dashboard/documents" />
        <MiniKpi label="Programas" value={2} sub="PGIRASA · SST" icon={<ClipboardCheck className="w-4 h-4" />} href="/dashboard/environmental" />
      </div>
    </div>
  );
}

/* ── KPI Card Component ── */
function KpiCard({ icon, label, value, sub, color, href }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  href?: string;
}) {
  const card = (
    <div
      className="rounded-xl p-5 transition-all duration-200"
      style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)', boxShadow: 'var(--sai-shadow-sm)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}20, var(--sai-shadow-md)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--sai-border)';
        e.currentTarget.style.boxShadow = 'var(--sai-shadow-sm)';
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>{label}</span>
      </div>
      <p className="text-3xl font-black" style={{ color: 'var(--sai-text-primary)' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--sai-text-tertiary)' }}>{sub}</p>
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

/* ── Mini KPI ── */
function MiniKpi({ label, value, sub, icon, color, href }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; color?: string; href?: string;
}) {
  const c = color || 'var(--sai-accent)';
  const cardContent = (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)', boxShadow: 'var(--sai-shadow-sm)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--sai-text-secondary)' }}>{label}</span>
        <span style={{ color: c }}>{icon}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }}>{sub}</p>
    </div>
  );
  if (href) return <Link href={href}>{cardContent}</Link>;
  return cardContent;
}
