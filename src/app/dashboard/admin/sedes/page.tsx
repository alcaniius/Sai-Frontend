'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminSedesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/admin/organizaciones');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--sai-accent)' }} />
        <p className="mt-4" style={{ color: 'var(--sai-text-tertiary)' }}>Redirigiendo a Organizaciones...</p>
      </div>
    </div>
  );
}