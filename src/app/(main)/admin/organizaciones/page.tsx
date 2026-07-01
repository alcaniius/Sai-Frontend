'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import {
  Plus, Loader2, Check, X, Pencil, Trash2, ChevronDown, ChevronRight,
  Building2, MapPin,
} from 'lucide-react';

// ── Zod schemas ──────────────────────────────────────────
const organizationSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  subdomain: z.string().min(1, 'Requerido'),
});

const editOrganizationSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  active: z.boolean(),
});

const siteSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  code: z.string().min(1, 'Requerido'),
  address: z.string().min(1, 'Requerido'),
  municipality: z.string().min(1, 'Requerido'),
});

type OrgFormData = z.infer<typeof organizationSchema>;
type EditOrgFormData = z.infer<typeof editOrganizationSchema>;
type SiteFormData = z.infer<typeof siteSchema>;

// ── Types ────────────────────────────────────────────────
interface Organization {
  id: string;
  name: string;
  subdomain: string;
  active: boolean;
}

interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  municipality: string;
  active: boolean;
  organizationId: string;
}

// ── Component ────────────────────────────────────────────
export default function AdminOrganizacionesPage() {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated } = useAuthStore();

  // Role guard
  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  // ── Org state ──────────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgMessage, setOrgMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [deleteOrgLoading, setDeleteOrgLoading] = useState(false);

  // ── Site state ─────────────────────────────────────────
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [sitesMap, setSitesMap] = useState<Record<string, Site[]>>({});
  const [sitesLoading, setSitesLoading] = useState<Record<string, boolean>>({});
  const [siteMessage, setSiteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateSiteModal, setShowCreateSiteModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [deleteSiteLoading, setDeleteSiteLoading] = useState(false);
  const [siteFormLoading, setSiteFormLoading] = useState(false);

  // ── Org form ───────────────────────────────────────────
  const orgCreateForm = useForm<OrgFormData>({ resolver: zodResolver(organizationSchema) });
  const orgEditForm = useForm<EditOrgFormData>({ resolver: zodResolver(editOrganizationSchema) });

  // ── Site form ──────────────────────────────────────────
  const siteForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema) });

  // ── Load orgs ──────────────────────────────────────────
  const loadOrganizations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const res = await api.get('/users/organizations');
      setOrganizations(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadOrganizations();
    }
  }, [user, loadOrganizations]);

  // ── Load sites for a specific org ──────────────────────
  const loadSites = useCallback(async (orgId: string) => {
    setSitesLoading((prev) => ({ ...prev, [orgId]: true }));
    try {
      const res = await api.get('/sites', {
        params: { organizationId: orgId },
        headers: { 'X-Tenant-ID': orgId },
      });
      setSitesMap((prev) => ({ ...prev, [orgId]: res.data }));
    } catch {
      setSitesMap((prev) => ({ ...prev, [orgId]: [] }));
    } finally {
      setSitesLoading((prev) => ({ ...prev, [orgId]: false }));
    }
  }, []);

  // ── Toggle expand ──────────────────────────────────────
  const toggleExpand = (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
    } else {
      setExpandedOrgId(orgId);
      if (!sitesMap[orgId]) {
        loadSites(orgId);
      }
    }
  };

  // ════════════════════════════════════════════════════════
  //  ORG CRUD
  // ════════════════════════════════════════════════════════

  const onCreateOrg = async (data: OrgFormData) => {
    setLoadingOrgs(true);
    setOrgMessage(null);
    try {
      await api.post('/users/organizations', data);
      setOrgMessage({ type: 'success', text: 'Organización creada exitosamente' });
      setShowCreateOrgModal(false);
      orgCreateForm.reset();
      await loadOrganizations();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al crear organización';
      setOrgMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al crear organización' });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    orgEditForm.setValue('name', org.name);
    orgEditForm.setValue('active', org.active);
  };

  const onEditOrg = async (data: EditOrgFormData) => {
    if (!editingOrg) return;
    setLoadingOrgs(true);
    setOrgMessage(null);
    try {
      await api.put(`/users/organizations/${editingOrg.id}`, data);
      setOrgMessage({ type: 'success', text: 'Organización actualizada exitosamente' });
      setEditingOrg(null);
      await loadOrganizations();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al actualizar organización';
      setOrgMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al actualizar organización' });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const onDeleteOrg = async () => {
    if (!deletingOrg) return;
    setDeleteOrgLoading(true);
    setOrgMessage(null);
    try {
      await api.delete(`/users/organizations/${deletingOrg.id}`);
      setOrgMessage({ type: 'success', text: 'Organización eliminada exitosamente' });
      // Clean up cached sites
      const newSitesMap = { ...sitesMap };
      delete newSitesMap[deletingOrg.id];
      setSitesMap(newSitesMap);
      if (expandedOrgId === deletingOrg.id) setExpandedOrgId(null);
      setDeletingOrg(null);
      await loadOrganizations();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al eliminar organización';
      setOrgMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al eliminar organización' });
    } finally {
      setDeleteOrgLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════
  //  SITE CRUD
  // ════════════════════════════════════════════════════════

  const onCreateSite = async (data: SiteFormData) => {
    if (!expandedOrgId) return;
    setSiteFormLoading(true);
    setSiteMessage(null);
    try {
      await api.post('/sites', data, {
        headers: { 'X-Tenant-ID': expandedOrgId },
      });
      setSiteMessage({ type: 'success', text: 'Sede creada exitosamente' });
      setShowCreateSiteModal(false);
      siteForm.reset();
      await loadSites(expandedOrgId);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al crear sede';
      setSiteMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al crear sede' });
    } finally {
      setSiteFormLoading(false);
    }
  };

  const openEditSite = (site: Site) => {
    setEditingSite(site);
    siteForm.setValue('name', site.name);
    siteForm.setValue('code', site.code);
    siteForm.setValue('address', site.address);
    siteForm.setValue('municipality', site.municipality);
  };

  const onEditSite = async (data: SiteFormData) => {
    if (!editingSite || !expandedOrgId) return;
    setSiteFormLoading(true);
    setSiteMessage(null);
    try {
      await api.put(`/sites/${editingSite.id}`, data, {
        headers: { 'X-Tenant-ID': expandedOrgId },
      });
      setSiteMessage({ type: 'success', text: 'Sede actualizada exitosamente' });
      setEditingSite(null);
      await loadSites(expandedOrgId);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al actualizar sede';
      setSiteMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al actualizar sede' });
    } finally {
      setSiteFormLoading(false);
    }
  };

  const onDeleteSite = async () => {
    if (!deletingSite || !expandedOrgId) return;
    setDeleteSiteLoading(true);
    setSiteMessage(null);
    try {
      await api.delete(`/sites/${deletingSite.id}`, {
        headers: { 'X-Tenant-ID': expandedOrgId },
      });
      setSiteMessage({ type: 'success', text: 'Sede eliminada exitosamente' });
      setDeletingSite(null);
      await loadSites(expandedOrgId);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al eliminar sede';
      setSiteMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al eliminar sede' });
    } finally {
      setDeleteSiteLoading(false);
    }
  };

  // ── Loading / Auth guards ──────────────────────────────
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return null;
  }

  // ── Render helpers ─────────────────────────────────────
  const messageBanner = (
    msg: { type: 'success' | 'error'; text: string } | null,
    onClose?: () => void,
  ) => {
    if (!msg) return null;
    return (
      <div
        className="p-4 rounded-lg flex items-center gap-2"
        style={{
          background: msg.type === 'success' ? 'var(--sai-success-bg)' : 'var(--sai-danger-bg)',
          color: msg.type === 'success' ? 'var(--sai-success)' : 'var(--sai-danger)',
          border: `1px solid ${msg.type === 'success' ? 'var(--sai-success-border)' : 'var(--sai-danger-border)'}`,
        }}
      >
        {msg.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1">{msg.text}</span>
        {onClose && (
          <button onClick={onClose} className="text-current opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const inputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--sai-bg-input)', border: '1px solid var(--sai-border)', color: 'var(--sai-text-primary)' };
  const cardStyle = { background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)' };

  // ── Main render ────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>Organizaciones y Sedes</h1>
          <p className="mt-2" style={{ color: 'var(--sai-text-secondary)' }}>
            Gestionar organizaciones y sus sedes
          </p>
        </div>
        <button
          onClick={() => setShowCreateOrgModal(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}
        >
          <Plus className="w-4 h-4" />
          Nueva Organización
        </button>
      </div>

      {/* Org messages */}
      {messageBanner(orgMessage, () => setOrgMessage(null))}

      {/* Orgs list */}
      {loadingOrgs && organizations.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((org) => {
            const isExpanded = expandedOrgId === org.id;
            const sites = sitesMap[org.id];
            const isLoadingSites = sitesLoading[org.id];

            return (
              <div key={org.id} className="rounded-lg shadow overflow-hidden" style={cardStyle}>
                {/* Org header row */}
                <div
                  className="flex items-center px-6 py-4 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(org.id)}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'var(--sai-bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                >
                  <button className="mr-3" style={{ color: 'var(--sai-text-tertiary)' }}>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <Building2 className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: 'var(--sai-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--sai-text-primary)' }}>{org.name}</span>
                    <span className="ml-3 text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>{org.subdomain}</span>
                    {org.active ? (
                      <span className="ml-3 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--sai-success)' }}>
                        <Check className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="ml-3 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--sai-danger)' }}>
                        <X className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                    {sites && (
                      <span className="ml-3 text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>
                        {sites.length} sede{sites.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditOrg(org)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--sai-accent)' }}
                      title="Editar organización"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingOrg(org)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--sai-danger)' }}
                      title="Eliminar organización"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded sites section */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--sai-border)' }}>
                    <div className="px-6 py-4">
                      {/* Site messages */}
                      {siteMessage && (
                        <div className="mb-4">
                          {messageBanner(siteMessage, () => setSiteMessage(null))}
                        </div>
                      )}

                      {/* Sites table */}
                      {isLoadingSites ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--sai-accent)' }} />
                        </div>
                      ) : sites && sites.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--sai-border)' }}>
                          <table className="w-full">
                            <thead>
                              <tr style={{ background: 'var(--sai-bg-tertiary)' }}>
                                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Nombre</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Código</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Dirección</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Municipio</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sites.map((site) => (
                                <tr key={site.id} style={{ borderTop: '1px solid var(--sai-border)' }}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-primary)' }}>{site.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-secondary)' }}>{site.code}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-secondary)' }}>{site.address}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--sai-text-secondary)' }}>{site.municipality}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openEditSite(site)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--sai-accent)' }}
                                        title="Editar sede"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setDeletingSite(site)}
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--sai-danger)' }}
                                        title="Eliminar sede"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8" style={{ color: 'var(--sai-text-tertiary)' }}>
                          <MapPin className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                          <p className="text-sm">No hay sedes para esta organización</p>
                        </div>
                      )}

                      {/* Add site button */}
                      <button
                        onClick={() => {
                          siteForm.reset();
                          setShowCreateSiteModal(true);
                        }}
                        className="mt-4 px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
                        style={{ border: '1px dashed var(--sai-border)', color: 'var(--sai-text-tertiary)' }}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Sede
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {organizations.length === 0 && !loadingOrgs && (
            <div className="rounded-lg shadow p-12 text-center" style={cardStyle}>
              <Building2 className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
              <p style={{ color: 'var(--sai-text-tertiary)' }}>No hay organizaciones para mostrar</p>
              <button
                onClick={() => setShowCreateOrgModal(true)}
                className="mt-4 px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}
              >
                Crear primera organización
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATE ORG MODAL ═══ */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Nueva Organización</h3>
              <button onClick={() => { setShowCreateOrgModal(false); orgCreateForm.reset(); }} style={{ color: 'var(--sai-text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={orgCreateForm.handleSubmit(onCreateOrg)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nombre</label>
                <input type="text" {...orgCreateForm.register('name')} className={inputClass} style={inputStyle} placeholder="Nombre de la organización" />
                {orgCreateForm.formState.errors.name && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{orgCreateForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Subdominio</label>
                <input type="text" {...orgCreateForm.register('subdomain')} className={inputClass} style={inputStyle} placeholder="subdominio" />
                {orgCreateForm.formState.errors.subdomain && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{orgCreateForm.formState.errors.subdomain.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateOrgModal(false); orgCreateForm.reset(); }} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={loadingOrgs} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                  {loadingOrgs && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingOrgs ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT ORG MODAL ═══ */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Editar Organización</h3>
              <button onClick={() => setEditingOrg(null)} style={{ color: 'var(--sai-text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={orgEditForm.handleSubmit(onEditOrg)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nombre</label>
                <input type="text" {...orgEditForm.register('name')} className={inputClass} style={inputStyle} />
                {orgEditForm.formState.errors.name && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{orgEditForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...orgEditForm.register('active')} className="rounded" style={{ accentColor: 'var(--sai-accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Activo</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingOrg(null)} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={loadingOrgs} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                  {loadingOrgs && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingOrgs ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DELETE ORG MODAL ═══ */}
      {deletingOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Confirmar Eliminación</h3>
            </div>
            <div className="p-6">
              <p style={{ color: 'var(--sai-text-primary)' }}>¿Está seguro de eliminar la organización <strong>{deletingOrg.name}</strong>?</p>
              <p className="text-sm mt-2" style={{ color: 'var(--sai-text-tertiary)' }}>Esta acción no se puede deshacer. Si la organización tiene dependencias, no podrá ser eliminada.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--sai-border)' }}>
              <button onClick={() => setDeletingOrg(null)} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
              <button onClick={onDeleteOrg} disabled={deleteOrgLoading} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-danger)', color: 'var(--sai-text-inverse)' }}>
                {deleteOrgLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteOrgLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE SITE MODAL ═══ */}
      {showCreateSiteModal && expandedOrgId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Nueva Sede</h3>
              <button onClick={() => { setShowCreateSiteModal(false); siteForm.reset(); }} style={{ color: 'var(--sai-text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={siteForm.handleSubmit(onCreateSite)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nombre</label>
                <input type="text" {...siteForm.register('name')} className={inputClass} style={inputStyle} placeholder="Nombre de la sede" />
                {siteForm.formState.errors.name && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Código</label>
                <input type="text" {...siteForm.register('code')} className={inputClass} style={inputStyle} placeholder="Código de la sede" />
                {siteForm.formState.errors.code && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Dirección</label>
                <input type="text" {...siteForm.register('address')} className={inputClass} style={inputStyle} placeholder="Dirección" />
                {siteForm.formState.errors.address && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Municipio</label>
                <input type="text" {...siteForm.register('municipality')} className={inputClass} style={inputStyle} placeholder="Municipio" />
                {siteForm.formState.errors.municipality && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.municipality.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreateSiteModal(false); siteForm.reset(); }} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={siteFormLoading} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                  {siteFormLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {siteFormLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT SITE MODAL ═══ */}
      {editingSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Editar Sede</h3>
              <button onClick={() => { setEditingSite(null); siteForm.reset(); }} style={{ color: 'var(--sai-text-tertiary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={siteForm.handleSubmit(onEditSite)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nombre</label>
                <input type="text" {...siteForm.register('name')} className={inputClass} style={inputStyle} />
                {siteForm.formState.errors.name && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Código</label>
                <input type="text" {...siteForm.register('code')} className={inputClass} style={inputStyle} />
                {siteForm.formState.errors.code && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Dirección</label>
                <input type="text" {...siteForm.register('address')} className={inputClass} style={inputStyle} />
                {siteForm.formState.errors.address && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Municipio</label>
                <input type="text" {...siteForm.register('municipality')} className={inputClass} style={inputStyle} />
                {siteForm.formState.errors.municipality && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{siteForm.formState.errors.municipality.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditingSite(null); siteForm.reset(); }} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
                <button type="submit" disabled={siteFormLoading} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                  {siteFormLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {siteFormLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DELETE SITE MODAL ═══ */}
      {deletingSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={cardStyle}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Confirmar Eliminación</h3>
            </div>
            <div className="p-6">
              <p style={{ color: 'var(--sai-text-primary)' }}>¿Está seguro de eliminar la sede <strong>{deletingSite.name}</strong>?</p>
              <p className="text-sm mt-2" style={{ color: 'var(--sai-text-tertiary)' }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--sai-border)' }}>
              <button onClick={() => setDeletingSite(null)} className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--sai-bg-tertiary)', color: 'var(--sai-text-secondary)' }}>Cancelar</button>
              <button onClick={onDeleteSite} disabled={deleteSiteLoading} className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors" style={{ background: 'var(--sai-danger)', color: 'var(--sai-text-inverse)' }}>
                {deleteSiteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteSiteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}