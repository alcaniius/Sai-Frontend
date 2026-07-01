'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Loader2, Check, X, User, Building2, MapPin, ShieldCheck, Mail, KeyRound, Save } from 'lucide-react';

// ── Zod schemas ──────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Types ────────────────────────────────────────────────
interface Organization {
  id: string;
  name: string;
  active: boolean;
}

interface Site {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  organizationId?: string;
  siteId?: string;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  site?: Site | null;
}

// ── Helpers ──────────────────────────────────────────────
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  USER: 'Usuario',
  AUDITOR: 'Auditor',
};

// ── Component ────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated, updateUser } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      setProfile(res.data);
      profileForm.setValue('firstName', res.data.firstName);
      profileForm.setValue('lastName', res.data.lastName);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateProfile = async (data: ProfileFormData) => {
    setMessage(null);
    try {
      const res = await api.patch('/users/me', data);
      setProfile(res.data);
      if (user) {
        updateUser({ ...user, firstName: res.data.firstName, lastName: res.data.lastName });
      }
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al actualizar perfil';
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al actualizar perfil' });
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    setMessage(null);
    try {
      await api.patch('/users/me', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Error al cambiar contraseña';
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : 'Error al cambiar contraseña' });
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--sai-accent)' }} />
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--sai-bg-input)', border: '1px solid var(--sai-border)', color: 'var(--sai-text-primary)' };
  const cardStyle = { background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)' };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--sai-text-primary)' }}>Mi Perfil</h1>
        <p className="mt-2" style={{ color: 'var(--sai-text-secondary)' }}>Gestiona tu información personal y seguridad</p>
      </div>

      {/* Message banner */}
      {message && (
        <div
          className="p-4 rounded-lg flex items-center gap-2"
          style={{
            background: message.type === 'success' ? 'var(--sai-success-bg)' : 'var(--sai-danger-bg)',
            color: message.type === 'success' ? 'var(--sai-success)' : 'var(--sai-danger)',
            border: `1px solid ${message.type === 'success' ? 'var(--sai-success-border)' : 'var(--sai-danger-border)'}`,
          }}
        >
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-lg shadow overflow-hidden" style={cardStyle}>
        <div className="px-6 py-8" style={{ background: 'var(--sai-accent-gradient)' }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--sai-text-inverse)' }}>
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div style={{ color: 'var(--sai-text-inverse)' }}>
              <h2 className="text-2xl font-bold">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p style={{ opacity: 0.8 }}>{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--sai-border)' }}>
          <nav className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === 'info' ? '2px solid var(--sai-accent)' : '2px solid transparent',
                color: activeTab === 'info' ? 'var(--sai-accent)' : 'var(--sai-text-secondary)',
              }}
            >
              Información
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === 'security' ? '2px solid var(--sai-accent)' : '2px solid transparent',
                color: activeTab === 'security' ? 'var(--sai-accent)' : 'var(--sai-text-secondary)',
              }}
            >
              Seguridad
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nombre</label>
                    <input type="text" {...profileForm.register('firstName')} className={inputClass} style={inputStyle} />
                    {profileForm.formState.errors.firstName && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{profileForm.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Apellido</label>
                    <input type="text" {...profileForm.register('lastName')} className={inputClass} style={inputStyle} />
                    {profileForm.formState.errors.lastName && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{profileForm.formState.errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                    style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}
                  >
                    {profileForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                </div>
              </form>

              {/* Account details */}
              <div className="pt-6" style={{ borderTop: '1px solid var(--sai-border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sai-text-primary)' }}>Detalles de la Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                    <Mail className="w-5 h-5 mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Correo electrónico</p>
                      <p className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                    <ShieldCheck className="w-5 h-5 mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Rol</p>
                      <p className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{roleLabel[profile?.role || 'USER']}</p>
                    </div>
                  </div>
                  {profile?.organization && (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                      <Building2 className="w-5 h-5 mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Organización</p>
                        <p className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{profile.organization.name}</p>
                      </div>
                    </div>
                  )}
                  {profile?.site && (
                    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                      <MapPin className="w-5 h-5 mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Sede</p>
                        <p className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{profile.site.name} ({profile.site.code})</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'var(--sai-bg-tertiary)' }}>
                    <User className="w-5 h-5 mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>Miembro desde</p>
                      <p className="text-sm" style={{ color: 'var(--sai-text-primary)' }}>{profile?.createdAt ? formatDate(profile.createdAt) : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--sai-text-primary)' }}>
                <KeyRound className="w-5 h-5" />
                Cambiar Contraseña
              </h3>
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Contraseña actual</label>
                  <input type="password" {...passwordForm.register('currentPassword')} className={inputClass} style={inputStyle} />
                  {passwordForm.formState.errors.currentPassword && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Nueva contraseña</label>
                  <input type="password" {...passwordForm.register('newPassword')} className={inputClass} style={inputStyle} />
                  {passwordForm.formState.errors.newPassword && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{passwordForm.formState.errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--sai-text-secondary)' }}>Confirmar nueva contraseña</label>
                  <input type="password" {...passwordForm.register('confirmPassword')} className={inputClass} style={inputStyle} />
                  {passwordForm.formState.errors.confirmPassword && <p className="text-sm mt-1" style={{ color: 'var(--sai-danger)' }}>{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                    style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}
                  >
                    {passwordForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}