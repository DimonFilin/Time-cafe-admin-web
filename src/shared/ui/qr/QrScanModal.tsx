'use client';

import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { parseAppointmentQr } from '@/shared/lib/appointment-qr';
import { Button } from '@/shared/ui/button/Button';
import { Modal } from '@/shared/ui/modal/Modal';

export function QrScanModal({
  open,
  title = 'Сканировать QR-код',
  description = 'Наведите камеру на QR-код бронирования.',
  errorText,
  contextCafeId,
  debugRaw,
  debugParsed,
  onClose,
  onDetected,
}: {
  open: boolean;
  title?: string;
  description?: string;
  errorText?: string | null;
  contextCafeId?: string | null;
  debugRaw?: string | null;
  debugParsed?: string | null;
  onClose: () => void;
  onDetected: (text: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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
    stopCamera();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setIsScanning(false);
      stopCamera();
      return;
    }

    setCameraError(null);
    setLastDetected(null);

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
              setLastDetected(text);
              setManualValue(text);
              setIsScanning(false);
              stopCamera();
              return;
            }

            if (!error) return;
            const name = (error as { name?: string } | null)?.name;
            // NotFoundException is expected when no code is in frame.
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
  }, [open, isScanning]);

  const debugInfo = useMemo(() => {
    const raw = (debugRaw ?? lastDetected ?? '').trim();
    if (!raw) return null;
    const parsed = parseAppointmentQr(raw);
    const cafeMatch =
      parsed.ok && parsed.cafeId && contextCafeId
        ? String(parsed.cafeId) === String(contextCafeId)
        : null;
    return { raw, parsed, cafeMatch };
  }, [contextCafeId, debugRaw, lastDetected]);

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

      {debugInfo ? (
        <details className="rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-3">
          <summary className="cursor-pointer select-none text-sm font-medium">
            Debug: данные из QR
          </summary>
          <div className="mt-3 space-y-3">
            {contextCafeId ? (
              <div className="text-xs text-[rgb(var(--tc-muted))]">
                Текущее кафе: <span className="font-mono">{contextCafeId}</span>
              </div>
            ) : null}

            <div>
              <div className="text-xs text-[rgb(var(--tc-muted))]">RAW</div>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-3 font-mono text-xs">
                {debugInfo.raw}
              </pre>
            </div>

            <div>
              <div className="text-xs text-[rgb(var(--tc-muted))]">PARSED</div>
              <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface))] p-3 font-mono text-xs">
                {debugParsed ?? JSON.stringify(debugInfo.parsed, null, 2)}
              </pre>
            </div>

            {debugInfo.cafeMatch === true ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                QR относится к текущему кафе
              </div>
            ) : debugInfo.cafeMatch === false ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                QR относится к другому кафе
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {isScanning ? (
        <div className="rounded-2xl border border-[rgb(var(--tc-border))] bg-black/5 p-2">
          <video
            ref={videoRef}
            className={cn('aspect-video w-full rounded-xl bg-black')}
            muted
            playsInline
          />
          <div className="mt-2 text-xs text-[rgb(var(--tc-muted))]">
            Наведите камеру на QR-код. После распознавания код подставится в поле ниже.
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="text-sm font-medium">Код (вставьте вручную или отсканируйте)</div>
        <textarea
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder='Например: {"v":1,"t":"a","a":"123","u":null,"c":"1","n":"Cafe"}'
          className={cn(
            'min-h-[140px] w-full resize-y rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] p-3 text-sm',
            'text-[rgb(var(--tc-fg))] placeholder:text-[rgb(var(--tc-muted))]',
            'transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tc-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--tc-bg))]',
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setCameraError(null);
              setIsScanning(true);
            }}
          >
            Сканировать
          </Button>

          <div className="flex-1" />

          <Button
            onClick={() => onDetected(manualValue)}
            disabled={!manualValue.trim()}
            title={manualValue.trim() ? undefined : 'Введите значение'}
          >
            Открыть бронь
          </Button>

          <Button variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
