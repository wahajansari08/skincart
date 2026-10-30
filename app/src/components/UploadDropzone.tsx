'use client';

import { useRef, useState } from 'react';

/**
 * Downscale the selfie for both APIs in one step (API-RESEARCH.md §4.5):
 * long side ≤1600px satisfies the VTO <1920px cap; typical phone selfies keep
 * the short side ≥480px needed by Skin Analysis SD.
 */
export async function resizeImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.9),
  );
}

const PHOTO_RULES = [
  'Face fills 60–80% of the frame',
  'Bright, even light — face a window',
  'Forehead visible, hair off the face',
  'Glasses off, mouth closed, eyes open',
];

export default function UploadDropzone({
  onPhoto,
  busy,
}: {
  onPhoto: (blob: Blob, previewUrl: string) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);

  async function handleFile(file: File | Blob) {
    setPreparing(true);
    try {
      const resized = await resizeImage(file);
      onPhoto(resized, URL.createObjectURL(resized));
    } finally {
      setPreparing(false);
    }
  }

  async function useSample() {
    setPreparing(true);
    try {
      const res = await fetch('/sample-face.svg');
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      // Rasterize so the exact bytes sent to the API match what is previewed.
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#f7e8dd';
      ctx.fillRect(0, 0, 600, 750);
      ctx.drawImage(img, 0, 0, 600, 750);
      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (png) onPhoto(png, URL.createObjectURL(png));
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a selfie"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`cursor-pointer rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? 'border-[var(--color-rosewood)] bg-[var(--color-blush)]'
            : 'border-[#d8c3ae] bg-white hover:border-[var(--color-rosewood)]'
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-blush)] text-3xl">
          📸
        </div>
        <p className="font-display text-xl text-[var(--color-plum)]">
          {preparing ? 'Preparing your photo…' : 'Drop your selfie here'}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          or click to browse — JPG or PNG, under 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
        {PHOTO_RULES.map((rule) => (
          <div key={rule} className="flex items-start gap-2 text-sm text-neutral-600">
            <span className="mt-0.5 text-[var(--color-rosewood)]">✓</span>
            <span>{rule}</span>
          </div>
        ))}
      </div>

      <button
        onClick={useSample}
        disabled={busy || preparing}
        className="mt-6 w-full rounded-full border border-[var(--color-rosewood)] px-5 py-3 text-sm font-semibold text-[var(--color-rosewood)] transition hover:bg-[var(--color-rosewood)] hover:text-white disabled:opacity-50"
      >
        No photo handy? Try with a sample portrait →
      </button>
      <p className="mt-3 text-center text-xs text-neutral-400">
        Your photo is processed for analysis and never stored. No account, no sign-up.
      </p>
    </div>
  );
}
