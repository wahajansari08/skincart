'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  'Uploading your selfie securely',
  'YouCam Skin AI is reading your skin',
  'Scoring 7 skin concerns',
  'Matching products to your weakest scores',
];

export default function ProcessingState({ photoUrl }: { photoUrl: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fade-up mx-auto max-w-md text-center">
      <div className="pulse-ring relative mx-auto h-44 w-44 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="Your selfie being analyzed" className="h-full w-full object-cover" />
      </div>
      <h2 className="font-display mt-8 text-2xl text-[var(--color-plum)]">
        Analyzing your skin…
      </h2>
      <ul className="mx-auto mt-6 max-w-xs space-y-3 text-left">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-[var(--color-rosewood)] text-white'
                  : i === step
                    ? 'bg-[var(--color-blush)] text-[var(--color-rosewood)]'
                    : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={i <= step ? 'text-neutral-700' : 'text-neutral-400'}>
              {label}
              {i === step && <span className="animate-pulse"> …</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
