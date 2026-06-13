'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { t } from '@/i18n';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (photoUrl: string) => void;
  taskTitle: string;
}

export function PhotoUploadModal({ isOpen, onClose, onUpload, taskTitle }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Generate unique file path for task photo
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name}`;
      const path = `tasks/${fileName}`;

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('path', path);

      // Upload to storage API (public bucket for task photos)
      const response = await fetch('/api/storage/upload/public', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('apiErrors.uploadPhoto'));
      }

      const data = await response.json();

      // Return the photo URL from the upload result
      const photoUrl = data.result?.url || data.url;
      if (!photoUrl) {
        throw new Error(t('apiErrors.uploadNoUrl'));
      }

      onUpload(photoUrl);
      handleClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('apiErrors.uploadPhoto'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Загрузить фото">
      <div className="space-y-4">
        {/* Task info */}
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Задача:</span> {taskTitle}
          </p>
          <p className="mt-1 text-xs text-blue-700">
            Для выполнения этой задачи требуется фотография
          </p>
        </div>

        {/* File input */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-[rgb(var(--tc-border))] p-8 text-center transition-colors hover:border-[rgb(var(--tc-accent))] hover:bg-[rgb(var(--tc-accent))]/5"
            >
              <div className="mb-2 text-4xl">📷</div>
              <p className="mb-1 font-medium">Выберите фото</p>
              <p className="text-sm text-[rgb(var(--tc-muted))]">Нажмите для выбора файла</p>
              <p className="mt-2 text-xs text-[rgb(var(--tc-muted))]">Максимальный размер: 5MB</p>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src={preview}
                  alt="Preview"
                  width={800}
                  height={256}
                  unoptimized
                  className="h-64 w-full object-cover"
                />
              </div>

              {/* File info */}
              <div className="flex items-center justify-between rounded-lg bg-[rgb(var(--tc-bg))] p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile?.name}</p>
                  <p className="text-xs text-[rgb(var(--tc-muted))]">
                    {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={uploading} className="flex-1">
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1"
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
