'use client';

import { useEffect, useState } from 'react';

import type { StorageFile, StorageBucket } from '@/entities/storage/types/storage';
import { getBuckets, listFiles, getFileDownloadUrl, deleteFile, uploadFile } from '../api/storage';
import { Card } from '@/shared/ui/card/Card';
import { DataTable } from '@/shared/ui/data-table/DataTable';
import { ConfirmModal } from '@/shared/ui/modal/ConfirmModal';
import { Modal } from '@/shared/ui/modal/Modal';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getBucketLabel(bucket: string): string {
  const labels: Record<string, string> = {
    brands: 'Бренды',
    cafes: 'Кафе',
    users: 'Пользователи',
    public: 'Публичные',
  };
  return labels[bucket] || bucket;
}

export function StorageAdmin() {
  const [buckets, setBuckets] = useState<StorageBucket | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    file: StorageFile | null;
  }>({ open: false, file: null });
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadPath, setUploadPath] = useState('');
  const [uploadFileInput, setUploadFileInput] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadBuckets = async () => {
    try {
      const data = await getBuckets();
      setBuckets(data.buckets);
      if (!selectedBucket && Object.keys(data.buckets).length > 0) {
        setSelectedBucket(Object.keys(data.buckets)[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const loadFiles = async () => {
    if (!selectedBucket) return;

    setLoading(true);
    setError(null);
    try {
      const data = await listFiles(selectedBucket, prefix || undefined);
      setFiles(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBucket, prefix]);

  const handleDownload = async (file: StorageFile) => {
    try {
      const url = await getFileDownloadUrl(file.bucket, file.path);
      window.open(url, '_blank');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.file) return;

    setDeleting(true);
    try {
      await deleteFile(deleteModal.file.bucket, deleteModal.file.path);
      setDeleteModal({ open: false, file: null });
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedBucket || !uploadPath || !uploadFileInput) return;

    setUploading(true);
    setUploadError(null);
    try {
      // Remove bucket prefix if user included it
      let cleanPath = uploadPath.trim();
      if (cleanPath.startsWith(`${selectedBucket}/`)) {
        cleanPath = cleanPath.substring(selectedBucket.length + 1);
      }

      console.log('[StorageAdmin] Uploading file:', {
        bucket: selectedBucket,
        originalPath: uploadPath,
        cleanPath,
        fileName: uploadFileInput.name,
      });

      await uploadFile(selectedBucket, cleanPath, uploadFileInput);
      setUploadModal(false);
      setUploadPath('');
      setUploadFileInput(null);
      await loadFiles();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: 'path',
      header: 'Путь',
      render: (file: StorageFile) => (
        <div className="max-w-md truncate font-mono text-xs" title={file.path}>
          {file.path}
        </div>
      ),
    },
    {
      key: 'relationship',
      header: 'Связь',
      render: (file: StorageFile) => (
        <div className="text-sm">
          {file.relationship ? (
            <span className="text-[rgb(var(--tc-fg))]">{file.relationship}</span>
          ) : (
            <span className="text-[rgb(var(--tc-muted))]">Нет связи</span>
          )}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Размер',
      render: (file: StorageFile) => (
        <span className="text-sm text-[rgb(var(--tc-muted))]">{formatBytes(file.size)}</span>
      ),
    },
    {
      key: 'mimeType',
      header: 'Тип',
      render: (file: StorageFile) => (
        <span className="text-xs text-[rgb(var(--tc-muted))]">{file.mimeType}</span>
      ),
    },
    {
      key: 'lastModified',
      header: 'Изменён',
      render: (file: StorageFile) => (
        <span className="text-xs text-[rgb(var(--tc-muted))]">
          {new Date(file.lastModified).toLocaleString('ru-RU')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (file: StorageFile) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(file)}
            className="rounded-lg bg-[rgb(var(--tc-accent))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--tc-accent-contrast))] hover:opacity-90"
          >
            Скачать
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, file })}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
          >
            Удалить
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--tc-fg))]">Управление файлами</h1>
        <p className="mt-1 text-sm text-[rgb(var(--tc-muted))]">
          Просмотр и управление загруженными файлами
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      <Card className="bg-[rgb(var(--tc-surface))]">
        <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
          <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">Фильтры</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[rgb(var(--tc-fg))]">
                Bucket
              </label>
              <select
                value={selectedBucket}
                onChange={(e) => {
                  setSelectedBucket(e.target.value);
                  setPrefix('');
                }}
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm text-[rgb(var(--tc-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              >
                <option value="">Выберите bucket</option>
                {buckets &&
                  Object.entries(buckets).map(([key, value]) => (
                    <option key={key} value={value}>
                      {getBucketLabel(value)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[rgb(var(--tc-fg))]">
                Префикс (фильтр по пути)
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="brands/brand-id/"
                className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm text-[rgb(var(--tc-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedBucket && (
        <Card className="bg-[rgb(var(--tc-surface))]">
          <div className="border-b border-[rgb(var(--tc-border))] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--tc-fg))]">
                Файлы: {getBucketLabel(selectedBucket)}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUploadModal(true)}
                  className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-4 py-2 text-sm font-medium text-[rgb(var(--tc-fg))] hover:opacity-90"
                >
                  Загрузить файл
                </button>
                <button
                  onClick={loadFiles}
                  disabled={loading}
                  className="rounded-lg bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-medium text-[rgb(var(--tc-accent-contrast))] hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Загрузка...' : 'Обновить'}
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            {loading && files.length === 0 ? (
              <div className="py-12 text-center text-sm text-[rgb(var(--tc-muted))]">
                Загрузка файлов...
              </div>
            ) : files.length === 0 ? (
              <div className="py-12 text-center text-sm text-[rgb(var(--tc-muted))]">
                Файлы не найдены
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={files}
                getRowId={(file) => `${file.bucket}/${file.path}`}
                isLoading={false}
                error={null}
                page={page}
                pageSize={pageSize}
                total={files.length}
                onPageChange={(p) => setPage(Math.max(1, p))}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            )}
          </div>
        </Card>
      )}

      <ConfirmModal
        open={deleteModal.open}
        title="Удалить файл?"
        message={
          deleteModal.file
            ? `Вы уверены, что хотите удалить файл "${deleteModal.file.path}"? Это действие нельзя отменить.`
            : ''
        }
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, file: null })}
        isDanger
        loading={deleting}
      />

      <Modal
        open={uploadModal}
        onClose={() => {
          setUploadModal(false);
          setUploadPath('');
          setUploadFileInput(null);
          setUploadError(null);
        }}
        title="Загрузить файл"
        size="md"
      >
        <div className="grid gap-4">
          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200">
              {uploadError}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-[rgb(var(--tc-fg))]">
              Путь в bucket
            </label>
            <input
              type="text"
              value={uploadPath}
              onChange={(e) => setUploadPath(e.target.value)}
              placeholder="test/file.pdf"
              className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm text-[rgb(var(--tc-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
            <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
              Пример: brand-id/documents/file.pdf (без bucket в начале)
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[rgb(var(--tc-fg))]">Файл</label>
            <input
              type="file"
              onChange={(e) => setUploadFileInput(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm text-[rgb(var(--tc-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--tc-accent))]"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setUploadModal(false);
                setUploadPath('');
                setUploadFileInput(null);
                setUploadError(null);
              }}
              className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-4 py-2 text-sm font-medium text-[rgb(var(--tc-fg))] hover:opacity-90"
            >
              Отмена
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadPath || !uploadFileInput || uploading}
              className="rounded-lg bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-medium text-[rgb(var(--tc-accent-contrast))] hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
