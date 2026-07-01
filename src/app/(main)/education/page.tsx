'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Plus, Loader2, Check, X, Pencil, Trash2, GraduationCap, Calendar } from 'lucide-react';

// ── Schemas ─────────────────────────────────────────────
const trainingSchema = z.object({
  title: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
  methodology: z.string().optional(),
  duration: z.string().optional(),
  responsible: z.string().optional(),
  month: z.number().min(1).max(12),
  week: z.number().min(1).max(4).optional(),
  year: z.number(),
  observations: z.string().optional(),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

// ── Types ────────────────────────────────────────────────
interface Training {
  id: string;
  title: string;
  description?: string;
  methodology?: string;
  duration?: string;
  responsible?: string;
  month: number;
  week?: number;
  year: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  observations?: string;
  createdAt: string;
}

// ── Constants ────────────────────────────────────────────
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKS = [1, 2, 3, 4];

// ── Component ────────────────────────────────────────────
export default function EducationPage() {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated } = useAuthStore();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [deletingTraining, setDeletingTraining] = useState<Training | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: { year: currentYear },
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Auth guard
  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/login');
  }, [isInitialized, isAuthenticated, router]);

  // Load trainings
  const loadTrainings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/training', { params: { year } });
      setTrainings(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) loadTrainings();
  }, [isAuthenticated, year]);

  // ── CRUD ───────────────────────────────────────────────
  const onSubmit = async (data: TrainingFormData) => {
    setFormLoading(true);
    setMessage(null);
    try {
      if (editingTraining) {
        await api.patch(`/training/${editingTraining.id}`, data);
        setMessage({ type: 'success', text: 'Capacitación actualizada' });
      } else {
        await api.post('/training', data);
        setMessage({ type: 'success', text: 'Capacitación programada' });
      }
      setShowModal(false);
      setEditingTraining(null);
      reset({ year });
      loadTrainings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Error al guardar' });
    } finally {
      setFormLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deletingTraining) return;
    setFormLoading(true);
    try {
      await api.delete(`/training/${deletingTraining.id}`);
      setMessage({ type: 'success', text: 'Capacitación eliminada' });
      setDeletingTraining(null);
      loadTrainings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Error al eliminar' });
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (training: Training) => {
    setEditingTraining(training);
    setValue('title', training.title);
    setValue('description', training.description || '');
    setValue('methodology', training.methodology || '');
    setValue('duration', training.duration || '');
    setValue('responsible', training.responsible || '');
    setValue('month', training.month);
    setValue('week', training.week || 1);
    setValue('year', training.year);
    setValue('observations', training.observations || '');
    setShowModal(true);
  };

  const openCreateAt = (month: number, week: number) => {
    setEditingTraining(null);
    reset({ title: '', description: '', methodology: '', duration: '', responsible: '', month, week, year, observations: '' });
    setValue('month', month);
    setValue('week', week);
    setValue('year', year);
    setShowModal(true);
  };

  const markComplete = async (t: Training) => {
    try {
      await api.patch(`/training/${t.id}`, { status: 'COMPLETED' });
      loadTrainings();
    } catch { /* ignore */ }
  };

  // ── Helpers ─────────────────────────────────────────────
  const getTrainingForCell = (month: number, week: number): Training | undefined => {
    return trainings.find(t => t.month === month && t.week === week);
  };

  // ── Loading ─────────────────────────────────────────────
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
      </div>
    );
  }

  const cardStyle = { background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)' };
  const inputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--sai-bg-input)', border: '1px solid var(--sai-border)', color: 'var(--sai-text-primary)' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>Cronograma de Capacitación</h1>
          <p className="mt-1" style={{ color: 'var(--sai-text-secondary)' }}>Plan de capacitaciones programadas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm"
            style={inputStyle}
          >
            {[2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {canManage && (
            <button
              onClick={() => { setEditingTraining(null); reset({ title: '', description: '', methodology: '', duration: '', responsible: '', month: 1, week: 1, year, observations: '' }); setShowModal(true); }}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}
            >
              <Plus className="w-4 h-4" />
              Nueva Capacitación
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="p-4 rounded-lg flex items-center gap-2" style={{ background: message.type === 'success' ? 'var(--sai-success-bg)' : 'var(--sai-danger-bg)', color: message.type === 'success' ? 'var(--sai-success)' : 'var(--sai-danger)' }}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabla — 12 meses */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ ...cardStyle, boxShadow: 'var(--sai-shadow-md)' }}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="w-24 px-3 py-3 text-left text-xs font-medium uppercase" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-tertiary)', borderBottom: '1px solid var(--sai-border)' }}>Semana</th>
                {MONTHS.map((month, i) => (
                  <th
                    key={i}
                    colSpan={1}
                    className="px-3 py-3 text-center text-xs font-bold uppercase"
                    style={{ background: 'var(--sai-accent-light)', color: 'var(--sai-accent-text)', borderBottom: '1px solid var(--sai-border)', borderLeft: '1px solid var(--sai-border)' }}
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKS.map((week) => (
                <tr key={week}>
                  <td className="px-3 py-2 text-center text-sm font-bold" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)', borderBottom: '1px solid var(--sai-border)' }}>
                    Semana {week}
                  </td>
                  {MONTHS.map((_m, monthIdx) => {
                    const month = monthIdx + 1;
                    const training = getTrainingForCell(month, week);
                    return (
                      <td
                        key={`${month}-${week}`}
                        className="px-2 py-1 align-top cursor-pointer transition-colors relative group"
                        style={{
                          background: training ? (training.status === 'COMPLETED' ? 'var(--sai-success-bg)' : training.status === 'CANCELLED' ? 'var(--sai-bg-tertiary)' : 'var(--sai-bg-card)') : 'var(--sai-bg-card)',
                          borderBottom: '1px solid var(--sai-border)',
                          borderLeft: '1px solid var(--sai-border)',
                          height: '80px',
                          overflow: 'hidden',
                        }}
                        onClick={() => {
                          if (training) {
                            if (canManage) openEdit(training);
                          } else if (canManage) {
                            openCreateAt(month, week);
                          }
                        }}
                      >
                        {training ? (
                          <>
                            {/* Vista compacta — solo título + estado */}
                            <div className="flex items-center gap-1 h-full">
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  background: training.status === 'COMPLETED' ? 'var(--sai-success)' : training.status === 'CANCELLED' ? 'var(--sai-text-tertiary)' : 'var(--sai-accent)',
                                }}
                              />
                              <span className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--sai-text-primary)' }}>
                                {training.title}
                              </span>
                            </div>

                            {/* Hover popover — todos los detalles */}
                            <div
                              className="absolute z-20 hidden group-hover:block rounded-lg shadow-xl p-3 text-xs"
                              style={{
                                background: 'var(--sai-bg-card)',
                                border: '1px solid var(--sai-border)',
                                minWidth: '220px',
                                bottom: 'calc(100% + 4px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm" style={{ color: 'var(--sai-text-primary)' }}>{training.title}</span>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                                  style={{
                                    background: training.status === 'COMPLETED' ? 'var(--sai-success-bg)' : training.status === 'CANCELLED' ? 'var(--sai-bg-tertiary)' : 'var(--sai-accent-light)',
                                    color: training.status === 'COMPLETED' ? 'var(--sai-success)' : training.status === 'CANCELLED' ? 'var(--sai-text-tertiary)' : 'var(--sai-accent-text)',
                                  }}
                                >
                                  {training.status === 'COMPLETED' ? 'Completada' : training.status === 'CANCELLED' ? 'Cancelada' : 'Programada'}
                                </span>
                              </div>
                              {training.description && (
                                <p className="mb-1.5 leading-relaxed" style={{ color: 'var(--sai-text-secondary)' }}>{training.description}</p>
                              )}
                              <div className="space-y-1">
                                {training.methodology && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium" style={{ color: 'var(--sai-text-tertiary)' }}>Metodología:</span>
                                    <span style={{ color: 'var(--sai-text-primary)' }}>{training.methodology}</span>
                                  </div>
                                )}
                                {training.duration && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium" style={{ color: 'var(--sai-text-tertiary)' }}>Duración:</span>
                                    <span style={{ color: 'var(--sai-text-primary)' }}>{training.duration}</span>
                                  </div>
                                )}
                                {training.responsible && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium" style={{ color: 'var(--sai-text-tertiary)' }}>Responsable:</span>
                                    <span style={{ color: 'var(--sai-text-primary)' }}>{training.responsible}</span>
                                  </div>
                                )}
                                {training.observations && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium" style={{ color: 'var(--sai-text-tertiary)' }}>Obs.:</span>
                                    <span style={{ color: 'var(--sai-text-primary)' }}>{training.observations}</span>
                                  </div>
                                )}
                              </div>
                              {canManage && (
                                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--sai-border)' }}>
                                  {training.status === 'SCHEDULED' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); markComplete(training); }}
                                      className="text-xs px-2 py-1 rounded transition-colors"
                                      style={{ background: 'var(--sai-success-bg)', color: 'var(--sai-success)' }}
                                    >
                                      ✓ Completar
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeletingTraining(training); }}
                                    className="text-xs px-2 py-1 rounded transition-colors"
                                    style={{ background: 'var(--sai-danger-bg)', color: 'var(--sai-danger)' }}
                                  >
                                    ✕ Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        ) : canManage ? (
                          <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-5 h-5" style={{ color: 'var(--sai-text-tertiary)' }} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-xs" style={{ color: 'var(--sai-border-subtle)' }}>—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Trainings without specific week — show below grid */}
          {trainings.filter(t => !t.week).length > 0 && (
            <div className="p-4" style={{ borderTop: '1px solid var(--sai-border)' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--sai-text-secondary)' }}>Capacitaciones sin semana asignada</h3>
              <div className="space-y-2">
                {trainings.filter(t => !t.week).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                    <span className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{t.title} — {MONTHS[t.month - 1]}</span>
                    {canManage && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1 rounded" style={{ color: 'var(--sai-accent)' }}><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeletingTraining(t)} className="p-1 rounded" style={{ color: 'var(--sai-danger)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-xl w-full mx-4" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>
                <GraduationCap className="w-5 h-5 inline mr-2" />
                {editingTraining ? 'Editar Capacitación' : 'Nueva Capacitación'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingTraining(null); }} style={{ color: 'var(--sai-text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Mes y Semana — primero */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Mes</label>
                  <select {...register('month', { valueAsNumber: true })} className={inputClass} style={inputStyle}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  {errors.month && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{errors.month.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Semana</label>
                  <select {...register('week', { valueAsNumber: true })} className={inputClass} style={inputStyle}>
                    {WEEKS.map(w => <option key={w} value={w}>Semana {w}</option>)}
                  </select>
                </div>
              </div>
              <input type="hidden" {...register('year', { valueAsNumber: true })} />
              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Título</label>
                <input type="text" {...register('title')} className={inputClass} style={inputStyle} placeholder="Ej: Socialización del PGIRASA" />
                {errors.title && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{errors.title.message}</p>}
              </div>
              {/* Descripción debajo del título */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Descripción</label>
                <textarea {...register('description')} className={inputClass} style={inputStyle} rows={2} placeholder="Detalle de la capacitación" />
              </div>
              {/* Metodología y Duración — dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Metodología a utilizar</label>
                  <select {...register('methodology')} className={inputClass} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Taller">Taller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Duración</label>
                  <select {...register('duration')} className={inputClass} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    <option value="1 hr">1 hr</option>
                    <option value="2 hr">2 hr</option>
                    <option value="3 hr">3 hr</option>
                    <option value="4 hr">4 hr</option>
                    <option value="5 hr">5 hr</option>
                  </select>
                </div>
              </div>
              {/* Responsable */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Responsable</label>
                <input {...register('responsible')} className={inputClass} style={inputStyle} placeholder="Nombre de quien dicta" />
              </div>
              {/* Observaciones al final */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Observaciones</label>
                <textarea {...register('observations')} className={inputClass} style={inputStyle} rows={2} placeholder="Notas adicionales" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingTraining(null); }} className="px-4 py-2 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {formLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Confirmar Eliminación</h3>
            </div>
            <div className="p-6">
              <p style={{ color: 'var(--sai-text-primary)' }}>¿Eliminar <strong>{deletingTraining.title}</strong>?</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--sai-border)' }}>
              <button onClick={() => setDeletingTraining(null)} className="px-4 py-2 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
              <button onClick={onDelete} disabled={formLoading} className="px-4 py-2 rounded-lg disabled:opacity-50" style={{ background: 'var(--sai-danger)', color: 'var(--sai-text-inverse)' }}>
                {formLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
