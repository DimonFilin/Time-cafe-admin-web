'use client';

import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
import { useState } from 'react';

interface ShowKeyModalProps {
  open: boolean;
  keyName: string;
  prefix: string;
  plainKey: string;
  onClose: () => void;
}

export function ShowKeyModal({ open, keyName, prefix, plainKey, onClose }: ShowKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  return (
    <Modal open={open} title="API Key Created" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
          ⚠️ Save your API key now. You won&apos;t be able to see it again after closing this
          dialog.
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key Name</label>
          <input
            type="text"
            value={keyName}
            disabled
            className="w-full rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key Prefix</label>
          <input
            type="text"
            value={prefix}
            disabled
            className="w-full rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Full Key (Secret)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={plainKey}
              disabled
              className="flex-1 rounded-md border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-2))] px-3 py-2 text-sm font-mono disabled:opacity-60"
            />
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
