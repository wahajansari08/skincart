'use client';

import type { Product } from '@/lib/products';
import { CONCERNS } from '@/lib/concerns';
import ProductArt from './ProductArt';

export default function RecommendationCard({
  product,
  score,
  onTryShade,
  trying,
}: {
  product: Product;
  /** The shopper's ui_score for the matched concern (trio cards). */
  score?: number;
  onTryShade?: (product: Product) => void;
  trying?: boolean;
}) {
  const reason =
    score !== undefined
      ? product.reason.replace('{score}', String(score))
      : product.reason;
  return (
    <article className="fade-up flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative h-36">
        <ProductArt tint={product.tint} kind={product.kind} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-plum)]">
          For: {CONCERNS[product.concern].short}
        </span>
        <span className="font-display absolute bottom-3 right-3 rounded-full bg-[var(--color-plum)] px-3 py-1 text-sm text-white">
          {product.price}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {product.kind}
        </p>
        <h3 className="mt-1 font-semibold text-[var(--color-ink)]">{product.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{product.blurb}</p>
        <p className="mt-3 rounded-2xl bg-[var(--color-cream)] p-3 text-sm italic leading-relaxed text-[var(--color-plum)]">
          “{reason}”
        </p>
        {product.tryOn && onTryShade && (
          <button
            onClick={() => onTryShade(product)}
            disabled={trying}
            className="mt-4 w-full rounded-full bg-[var(--color-rosewood)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-rosewood-dark)] disabled:opacity-60"
          >
            {trying ? 'Rendering your shade…' : '✨ Try this shade on your photo'}
          </button>
        )}
      </div>
    </article>
  );
}
