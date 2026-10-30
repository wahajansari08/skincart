'use client';

import { CONCERNS } from '@/lib/concerns';
import type { ConcernScore } from '@/lib/types';

function barColor(score: number): string {
  if (score >= 75) return '#5b8c5a';
  if (score >= 55) return '#c99a3c';
  return '#b4475f';
}

export default function ScoreCard({
  score,
  weakest,
  delayMs = 0,
}: {
  score: ConcernScore;
  weakest?: boolean;
  delayMs?: number;
}) {
  const meta = CONCERNS[score.id];
  const band = meta.band(score.uiScore);
  return (
    <article
      className={`fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ${
        weakest ? 'ring-2 ring-[var(--color-rosewood)]' : 'ring-black/5'
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--color-ink)]">{meta.label}</h3>
          <p
            className={`mt-0.5 text-xs font-semibold uppercase tracking-wide ${
              band === 'Strong'
                ? 'text-[#5b8c5a]'
                : band === 'Fair'
                  ? 'text-[#a87b28]'
                  : 'text-[#b4475f]'
            }`}
          >
            {band}
            {weakest && ' · matched below'}
          </p>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl leading-none text-[var(--color-plum)]">
            {score.uiScore}
          </span>
          <span className="text-xs text-neutral-400"> /100</span>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="score-bar-fill h-full rounded-full"
          style={{
            width: `${score.uiScore}%`,
            background: barColor(score.uiScore),
            animationDelay: `${delayMs}ms`,
          }}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        {meta.explain(score.uiScore)}
      </p>
      {score.maskUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={score.maskUrl}
          alt={`${meta.label} detection mask`}
          className="mt-3 h-24 w-full rounded-xl object-cover"
        />
      )}
    </article>
  );
}
