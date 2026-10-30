'use client';

import { useState } from 'react';

/**
 * Before/after comparison slider. `simulated` is true in mock mode: the live
 * YouCam VTO returns a truly re-rendered photo, while the mock adapter returns
 * the original with a warm tint so the demo stays honest (labelled on screen).
 */
export default function ShadePreview({
  beforeUrl,
  result,
}: {
  beforeUrl: string;
  result: { image: string; simulated: boolean; shadeName: string; productName: string };
}) {
  const [pos, setPos] = useState(50);
  return (
    <div className="fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <div>
          <h3 className="font-display text-xl text-[var(--color-plum)]">
            {result.productName}
          </h3>
          <p className="text-sm text-neutral-500">
            Shade: <strong>{result.shadeName}</strong> — drag to compare
          </p>
        </div>
        {result.simulated ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Simulated preview · connect a YouCam API key for true try-on
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Rendered by YouCam Makeup VTO
          </span>
        )}
      </div>
      <div className="relative mx-auto aspect-[4/5] w-full max-w-md select-none overflow-hidden">
        {/* AFTER (full, underneath) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.image}
          alt="With the shade applied"
          className="absolute inset-0 h-full w-full object-cover"
          style={
            result.simulated
              ? { filter: 'saturate(1.25) sepia(0.18) brightness(1.04)' }
              : undefined
          }
          draggable={false}
        />
        {/* BEFORE (clip-path keeps it registered with the AFTER image) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Original photo"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
          Before
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
          After
        </span>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${pos}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Reveal the try-on result"
          className="ba-range absolute inset-x-4 bottom-4 w-[calc(100%-2rem)]"
        />
      </div>
      <p className="p-5 pt-3 text-center text-xs text-neutral-400">
        Preview generated from your own photo — nothing was uploaded anywhere else or stored.
      </p>
    </div>
  );
}
