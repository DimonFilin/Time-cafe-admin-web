'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';

import { proxiedMediaUrl } from '@/shared/lib/proxied-media-url';

type Variant = 'avatarXs' | 'avatarSm' | 'avatarMd' | 'tileMd' | 'attachment' | 'preview';

const variantClass: Record<Variant, string> = {
  avatarXs: 'h-7 w-7 rounded-full object-cover ring-1 ring-[rgb(var(--tc-border))]',
  avatarSm: 'h-8 w-8 rounded-full object-cover ring-1 ring-[rgb(var(--tc-border))]',
  avatarMd: 'h-12 w-12 rounded-full object-cover ring-1 ring-[rgb(var(--tc-border))]',
  tileMd: 'h-16 w-16 rounded-lg object-cover ring-1 ring-[rgb(var(--tc-border))]',
  attachment:
    'h-40 w-full max-h-80 rounded-lg object-cover ring-1 ring-[rgb(var(--tc-border))] sm:h-80',
  preview: 'max-h-[80vh] w-full rounded-2xl bg-black object-contain',
};

/** Intrinsic size hints for next/image; layout size comes from Tailwind classes. */
const variantImageSize: Record<Variant, { width: number; height: number }> = {
  avatarXs: { width: 28, height: 28 },
  avatarSm: { width: 32, height: 32 },
  avatarMd: { width: 48, height: 48 },
  tileMd: { width: 64, height: 64 },
  attachment: { width: 800, height: 400 },
  preview: { width: 1600, height: 1200 },
};

type Props = {
  src: string | null | undefined;
  alt: string;
  variant: Variant;
  className?: string;
};

export function MediaImage({ src, alt, variant, className }: Props) {
  const [broken, setBroken] = useState(false);
  const resolved = proxiedMediaUrl(src || undefined);
  const base = variantClass[variant];
  const combined = className ? `${base} ${className}` : base;
  const { width, height } = variantImageSize[variant];

  const onError = useCallback(() => {
    setBroken(true);
  }, []);

  if (!resolved || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-[rgb(var(--tc-bg-soft))] text-[rgb(var(--tc-muted))] ${base} ${className ?? ''}`}
        aria-hidden
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={combined}
      unoptimized
      onError={onError}
    />
  );
}
