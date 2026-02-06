'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card/Card';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/Badge';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentDeleteModal } from './DocumentDeleteModal';

interface Doc {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt?: string;
  verifierNote?: string | null;
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
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      // Backend returns either array [] or object { items: [...] }
      setDocs(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button onClick={() => setUploadOpen(true)}>Upload Document</Button>
      </div>

      {loading && <div>Loading documents...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && docs.length === 0 && <div>No documents uploaded yet.</div>}

      {!loading && docs.length > 0 && (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Uploaded</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.type}</td>
                <td className="px-4 py-2">
                  <Badge
                    className={
                      d.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : d.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {d.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  {d.fileUrl && (
                    <>
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/brand/documents/${d.id}/download`);
                            if (!res.ok) throw new Error('Failed to get download URL');
                            const { url } = await res.json();
                            window.open(url, '_blank');
                          } catch (err) {
                            alert(
                              `Failed to download: ${err instanceof Error ? err.message : 'Unknown error'}`,
                            );
                          }
                        }}
                      >
                        Download
                      </button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => setDeletingDoc(d)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
    </Card>
  );
}
