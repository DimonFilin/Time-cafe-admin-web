'use client';

import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

export type QrScanModalMode = 'appointment' | 'reception';

function canUseCamera(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

export function QrScanModal({
  open,
  title = 'Сканировать QR-код',
  description = 'Наведите камеру на QR-код.',
  errorText,
  mode = 'appointment',
  onClose,
  onDetected,
  onPhoneSubmit,
}: {
  open: boolean;
  title?: string;
  description?: string;
  errorText?: string | null;
  mode?: QrScanModalMode;
  onClose: () => void;
  onDetected: (text: string) => void;
  /** Reception only: lookup guest by phone when camera is unavailable */
  onPhoneSubmit?: (phone: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [cardValue, setCardValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const isAppointment = mode === 'appointment';
  const phoneFallback = mode === 'reception';
  const cameraAvailable = useMemo(() => canUseCamera(), [open]);

  const combinedError = useMemo(() => errorText ?? cameraError, [cameraError, errorText]);

  const stopCamera = () => {
    try {
      controlsRef.current?.stop();
    } finally {
      controlsRef.current = null;
      readerRef.current = null;
    }

    const el = videoRef.current;
    const stream = el?.srcObject;
    if (stream && typeof (stream as MediaStream).getTracks === 'function') {
      for (const t of (stream as MediaStream).getTracks()) {
        try {
          t.stop();
        } catch {
          // ignore
        }
      }
    }
    if (el) el.srcObject = null;
  };

  const handleClose = () => {
    setIsScanning(false);
    setPhoneValue('');
    setCardValue('');
    stopCamera();
    onClose();
  };

  const submitManualCard = () => {
    const trimmed = cardValue.trim();
    if (!trimmed) return;
    onDetected(trimmed);
  };

  useEffect(() => {
    if (!open) {
      setIsScanning(false);
      stopCamera();
      return;
    }

    setCameraError(null);
    setPhoneValue('');
    setCardValue('');

    if (!cameraAvailable) {
      if (isAppointment) {
        setIsScanning(false);
      } else {
        setCameraError(
          'Камера недоступна (нужен HTTPS). Сканирование брони с этой страницы невозможно.',
        );
      }
      return;
    }

    if (!isScanning) {
      stopCamera();
      return;
    }

    const start = async () => {
      if (!videoRef.current) {
        setCameraError('Не удалось инициализировать предпросмотр камеры');
        setIsScanning(false);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Браузер не поддерживает доступ к камере на этом адресе');
        setIsScanning(false);
        return;
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, error) => {
            if (result) {
              const text = result.getText();
              setIsScanning(false);
              stopCamera();
              onDetected(text);
              return;
            }

            if (!error) return;
            const name = (error as { name?: string } | null)?.name;
            if (name === 'NotFoundException') return;
            setCameraError('Ошибка сканирования. Проверьте доступ к камере и попробуйте снова.');
          },
        );

        controlsRef.current = controls;
      } catch (e) {
        console.error('[QrScanModal] camera start failed:', e);
        setCameraError('Не удалось получить доступ к камере. Проверьте права браузера.');
        setIsScanning(false);
        stopCamera();
      }
    };

    void start();

    return () => {
      stopCamera();
    };
  }, [cameraAvailable, isAppointment, isScanning, onDetected, open]);

  useEffect(() => {
    if (open && cameraAvailable && isAppointment) {
      setIsScanning(true);
    }
  }, [cameraAvailable, isAppointment, open]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="lg"
      contentClassName="max-h-[calc(100vh-2rem)]"
      bodyClassName="space-y-4"
    >
      <div className="text-sm text-[rgb(var(--tc-muted))]">{description}</div>

      {combinedError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {combinedError}
        </div>
      ) : null}

      {phoneFallback || isAppointment ? (
        <div className="space-y-3 rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
          <div className="text-sm font-medium">
            {isAppointment ? 'Сканер или ручной ввод' : 'Сканирование карты СКУД'}
          </div>

          {cameraAvailable && isScanning ? (
            <div className="rounded-2xl border border-[rgb(var(--tc-border))] bg-black/5 p-2">
              <video
                ref={videoRef}
                className={cn('aspect-video w-full rounded-xl bg-black')}
                muted
                playsInline
              />
              <div className="mt-2 text-xs text-[rgb(var(--tc-muted))]">
                Наведите камеру на QR-код. После распознавания данные отправятся автоматически.
              </div>
            </div>
          ) : null}

          {cameraAvailable && !isScanning ? (
            <Button
              variant="secondary"
              onClick={() => {
                setCameraError(null);
                setIsScanning(true);
              }}
            >
              Сканировать QR
            </Button>
          ) : null}

          {!cameraAvailable ? (
            <p className="text-xs text-[rgb(var(--tc-muted))]">
              {isAppointment
                ? 'Камера на HTTP недоступна — отсканируйте USB-сканером в поле ниже или введите данные вручную.'
                : 'Камера на HTTP недоступна — введите номер карты СКУД или данные из QR вручную.'}
            </p>
          ) : (
            <p className="text-xs text-[rgb(var(--tc-muted))]">
              {isAppointment
                ? 'Или отсканируйте USB-сканером в поле ниже (Enter) / введите JSON из QR или ID брони.'
                : 'Или введите номер карты / JSON из QR вручную.'}
            </p>
          )}

          <input
            type="text"
            autoComplete="off"
            autoFocus={isAppointment}
            value={cardValue}
            onChange={(e) => setCardValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cardValue.trim()) submitManualCard();
            }}
            placeholder={
              isAppointment ? 'JSON из QR брони или ID брони' : 'Номер карты или JSON из QR'
            }
            className={cn(
              'w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm',
              'text-[rgb(var(--tc-fg))] placeholder:text-[rgb(var(--tc-muted))]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))]',
            )}
          />
          <div className="flex justify-end">
            <Button onClick={submitManualCard} disabled={!cardValue.trim()}>
              Применить
            </Button>
          </div>
        </div>
      ) : null}

      {phoneFallback ? (
        <div className="space-y-3 rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-4">
          <div className="text-sm font-medium">Или найти по телефону</div>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && phoneValue.trim()) onPhoneSubmit?.(phoneValue.trim());
            }}
            placeholder="291234567, 80291234567, +375-29-123-45-67"
            className={cn(
              'w-full rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] px-3 py-2 text-sm',
              'text-[rgb(var(--tc-fg))] placeholder:text-[rgb(var(--tc-muted))]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))]',
            )}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => onPhoneSubmit?.(phoneValue.trim())}
              disabled={!phoneValue.trim() || !onPhoneSubmit}
            >
              Найти
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleClose}>
          Отмена
        </Button>
      </div>
    </Modal>
  );
}
