'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/Badge';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentDeleteModal } from './DocumentDeleteModal';
import { t } from '@/i18n';

interface Doc {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt?: string;
  verifierNote?: string | null;
}

function docStatusLabel(status: Doc['status']) {
  if (status === 'VERIFIED') return t('brandAdmin.documents.statusVerified');
  if (status === 'REJECTED') return t('brandAdmin.documents.statusRejected');
  return t('brandAdmin.documents.statusPending');
}

export function DocumentsTab() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<Doc | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/brand/documents');
      if (!res.ok) throw new Error(t('brandAdmin.documents.fetchFailed'));
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('brandAdmin.documents.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUploaded = (doc: { id: string; name: string; type: string }) => {
    setDocs([{ ...doc, status: 'PENDING' }, ...docs]);
    setUploadOpen(false);
  };

  const handleDelete = (deletedId: string) => {
    setDocs(docs.filter((d) => d.id !== deletedId));
    setDeletingDoc(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('brandAdmin.documents.title')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
          {t('brandAdmin.documents.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{t('brandAdmin.documents.uploadedFiles')}</h3>
          <Button onClick={() => setUploadOpen(true)}>
            {t('brandAdmin.documents.uploadDocument')}
          </Button>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.documents.loading')}
          </div>
        )}
        {error && <div className="mb-4 text-sm text-[rgb(var(--tc-danger))]">{error}</div>}
        {!loading && !error && docs.length === 0 && (
          <div className="p-8 text-center text-sm text-[rgb(var(--tc-muted))]">
            {t('brandAdmin.documents.empty')}
          </div>
        )}

        {!loading && docs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--tc-border))]">
            <table className="w-full min-w-[640px] text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))]">
                  <th className="px-6 py-3 font-semibold">{t('common.name')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.type')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-6 py-3 font-semibold">{t('common.uploaded')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[rgb(var(--tc-border))] last:border-b-0"
                  >
                    <td className="px-6 py-4">{d.name}</td>
                    <td className="px-6 py-4">{d.type}</td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          d.status === 'VERIFIED'
                            ? 'bg-green-100 text-green-800'
                            : d.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {docStatusLabel(d.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[rgb(var(--tc-muted))]">
                      {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {d.fileUrl && (
                        <button
                          type="button"
                          className="text-blue-600 hover:underline text-sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/brand/documents/${d.id}/download`);
                              if (!res.ok)
                                throw new Error(t('brandAdmin.documents.downloadFailed'));
                              const { url } = await res.json();
                              window.open(url, '_blank');
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : t('brandAdmin.documents.downloadFailed'),
                              );
                            }
                          }}
                        >
                          {t('common.download')}
                        </button>
                      )}
                      <Button variant="ghost" onClick={() => setDeletingDoc(d)}>
                        {t('common.delete')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
      {deletingDoc && (
        <DocumentDeleteModal
          doc={deletingDoc}
          onClose={() => setDeletingDoc(null)}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
}
