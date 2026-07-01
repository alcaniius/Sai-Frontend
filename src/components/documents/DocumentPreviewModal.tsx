'use client';

import { useEffect, useState } from 'react';
import { X, Download, FileText, EyeOff } from 'lucide-react';
import { documentsService, Document } from '@/lib/services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export function DocumentPreviewModal({ isOpen, onClose, document: doc }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && doc) {
      setLoading(true);
      setError('');
      documentsService.getDownloadUrl(doc.id)
        .then((res: any) => setUrl(res.url))
        .catch(() => setError('No se pudo obtener la vista previa'))
        .finally(() => setLoading(false));
    } else {
      setUrl(null);
    }
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const isPdf = doc.fileFormat === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col" style={{ background: 'var(--sai-bg-card)', border: '1px solid var(--sai-border)', height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--sai-border-subtle)' }}>
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-lg font-bold truncate" style={{ color: 'var(--sai-text-primary)' }}>{doc.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--sai-text-tertiary)' }}>
              {doc.code && `${doc.code} · `}{doc.fileFormat?.toUpperCase()} · v{doc.version}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {url && (
              <a
                href={url}
                download={doc.title}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ background: 'var(--sai-accent)', color: '#fff' }}
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-sai-bg-tertiary transition-colors"
              style={{ color: 'var(--sai-text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-sai-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm" style={{ color: 'var(--sai-text-secondary)' }}>Cargando vista previa...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <EyeOff className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--sai-text-tertiary)' }} />
                <p className="font-medium" style={{ color: 'var(--sai-text-secondary)' }}>{error}</p>
              </div>
            </div>
          ) : url ? (
            isPdf ? (
              <iframe src={url} className="w-full h-full border-0" title={doc.title} />
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                  <p className="text-lg font-semibold mb-2" style={{ color: 'var(--sai-text-primary)' }}>
                    Documento {doc.fileFormat?.toUpperCase()}
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--sai-text-secondary)' }}>
                    Los archivos {doc.fileFormat?.toUpperCase()} no tienen vista previa en el navegador. Descargalo para verlo.
                  </p>
                  <a
                    href={url}
                    download={doc.title}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--sai-accent)' }}
                  >
                    <Download className="w-5 h-5" />
                    Descargar {doc.fileFormat?.toUpperCase()}
                  </a>
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--sai-text-tertiary)' }} />
                <p style={{ color: 'var(--sai-text-secondary)' }}>Este documento no tiene archivo adjunto</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
