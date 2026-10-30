'use client';

import { useMemo, useRef, useState } from 'react';
import UploadDropzone from '@/components/UploadDropzone';
import ProcessingState from '@/components/ProcessingState';
import ScoreCard from '@/components/ScoreCard';
import RecommendationCard from '@/components/RecommendationCard';
import ShadePreview from '@/components/ShadePreview';
import {
  PRODUCTS,
  TRY_ON_PRODUCTS,
  productForConcern,
  type Product,
} from '@/lib/products';
import type { SkinAnalysisResult, TryOnResult } from '@/lib/types';

type Step = 'upload' | 'processing' | 'results';

interface TryOnState {
  product: Product;
  shadeName: string;
  image: string;
  simulated: boolean;
}

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const [tryingId, setTryingId] = useState<string | null>(null);
  const [shadePick, setShadePick] = useState<Product | null>(null);
  const [tryOn, setTryOn] = useState<TryOnState | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const photoBlobRef = useRef<Blob | null>(null);

  async function handlePhoto(blob: Blob, previewUrl: string) {
    photoBlobRef.current = blob;
    setPhotoUrl(previewUrl);
    setError(null);
    setTryOn(null);
    setShadePick(null);
    setStep('processing');
    try {
      const form = new FormData();
      form.append('image', blob, 'selfie.jpg');
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Analysis failed.');
      setResult(json as SkinAnalysisResult);
      setStep('results');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong — please try again.');
      setStep('upload');
    }
  }

  const weakest = useMemo(() => {
    if (!result) return [];
    return [...result.concerns].sort((a, b) => a.uiScore - b.uiScore).slice(0, 3);
  }, [result]);

  const trio = useMemo(() => {
    return weakest
      .map((w) => {
        const product = productForConcern(w.id);
        return product ? { product, score: w.uiScore, concern: w.id } : null;
      })
      .filter(Boolean) as { product: Product; score: number; concern: string }[];
  }, [weakest]);

  async function runTryOn(product: Product, shadeHex: string, shadeName: string) {
    const blob = photoBlobRef.current;
    if (!blob || !product.tryOn) return;
    setTryingId(product.id);
    setTryOnError(null);
    try {
      const form = new FormData();
      form.append('image', blob, 'selfie.jpg');
      form.append(
        'spec',
        JSON.stringify({
          kind: product.tryOn.kind,
          color: shadeHex,
          colorIntensity: product.tryOn.kind === 'foundation' ? 50 : 80,
          texture: 'matte',
          glowIntensity: 30,
          coverageIntensity: 60,
        }),
      );
      const res = await fetch('/api/try-on', { method: 'POST', body: form });
      const json = (await res.json()) as TryOnResult & { error?: string };
      if (!res.ok) throw new Error(json?.error ?? 'Try-on failed.');
      setTryOn({
        product,
        shadeName,
        image: json.resultImage,
        simulated: json.simulated,
      });
      setShadePick(null);
    } catch (e: any) {
      setTryOnError(e?.message ?? 'Try-on failed — please try again.');
    } finally {
      setTryingId(null);
    }
  }

  function restart() {
    setStep('upload');
    setResult(null);
    setTryOn(null);
    setShadePick(null);
    setError(null);
    photoBlobRef.current = null;
  }

  const demoBadge = result && (result.mode === 'mock' || result.fallback);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-rosewood)] text-lg text-white">
            ✦
          </span>
          <span className="font-display text-2xl text-[var(--color-plum)]">SkinCart</span>
        </div>
        <p className="hidden text-sm text-neutral-500 sm:block">
          Powered by <strong>YouCam Skin Analysis</strong> + <strong>Makeup Virtual Try-On</strong>
        </p>
      </header>

      {/* Hero / upload */}
      {step !== 'results' && (
        <section className="grid items-center gap-10 pt-4 lg:grid-cols-2">
          <div className="fade-up">
            <h1 className="font-display text-4xl leading-tight text-[var(--color-plum)] sm:text-5xl">
              One selfie.
              <br />
              Zero guessing.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
              Online beauty shoppers guess — wrong product, wrong shade, and it gets
              returned. SkinCart reads your skin with AI, matches products to{' '}
              <em>your</em> scores, and lets you preview the shade on your own photo
              before you buy.
            </p>
            <ol className="mt-7 space-y-3 text-neutral-700">
              {[
                ['1', 'Upload a selfie — YouCam Skin AI scores 7 concerns'],
                ['2', 'Get your dashboard in plain English, not jargon'],
                ['3', 'See 3 products matched to your weakest scores'],
                ['4', 'Preview foundation & lipstick shades on your face'],
              ].map(([n, text]) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blush)] text-sm font-bold text-[var(--color-rosewood)]">
                    {n}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="fade-up rounded-[2rem] bg-white/60 p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
            {step === 'processing' ? (
              <ProcessingState photoUrl={photoUrl} />
            ) : (
              <>
                {error && (
                  <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                    {error}
                  </div>
                )}
                <UploadDropzone onPhoto={handlePhoto} busy={false} />
              </>
            )}
          </div>
        </section>
      )}

      {/* Results */}
      {step === 'results' && result && (
        <section className="fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl text-[var(--color-plum)] sm:text-4xl">
              Your skin report
            </h2>
            <div className="flex items-center gap-2">
              {demoBadge && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Demo data — add a YouCam API key for live analysis
                </span>
              )}
              <button
                onClick={restart}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-[var(--color-rosewood)] hover:text-[var(--color-rosewood)]"
              >
                ↺ Start over
              </button>
            </div>
          </div>

          {/* Summary header */}
          <div className="mt-6 grid gap-5 md:grid-cols-[280px_1fr]">
            <div className="relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showOverlay && result.overlayUrl ? result.overlayUrl : photoUrl}
                alt="Your selfie"
                className="h-full w-full object-cover"
              />
              {result.overlayUrl && (
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur"
                >
                  {showOverlay ? 'Hide detection overlay' : 'Show detection overlay'}
                </button>
              )}
            </div>
            <div className="flex flex-col justify-center rounded-3xl bg-[var(--color-plum)] p-7 text-white">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Overall skin score
                  </p>
                  <p className="font-display mt-1 text-6xl leading-none">
                    {result.overall}
                    <span className="text-2xl text-white/60"> /100</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Estimated skin age
                  </p>
                  <p className="font-display mt-1 text-6xl leading-none">
                    {result.skinAge}
                    <span className="text-2xl text-white/60"> yrs</span>
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-xl leading-relaxed text-white/85">
                {result.overall >= 75
                  ? 'Your skin is in strong shape overall. '
                  : result.overall >= 55
                    ? 'A solid base — with a few high-impact fixes available. '
                    : 'Plenty of room for visible wins, starting below. '}
                Your three biggest opportunities are{' '}
                <strong>
                  {weakest.map((w) => w.id.replace('_v2', '').replace('_', ' ')).join(', ')}
                </strong>{' '}
                — so that is exactly where your matched products focus.
              </p>
            </div>
          </div>

          {/* Score grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...result.concerns]
              .sort((a, b) => a.uiScore - b.uiScore)
              .map((c, i) => (
                <ScoreCard
                  key={c.id}
                  score={c}
                  weakest={weakest.some((w) => w.id === c.id)}
                  delayMs={i * 90}
                />
              ))}
            <article className="fade-up flex flex-col justify-center rounded-3xl bg-[var(--color-blush)] p-5">
              <h3 className="font-display text-xl text-[var(--color-plum)]">
                How to read this
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Scores run 0–100 and higher is healthier. They come from the YouCam
                Skin Analysis AI reading your photo — the same technology beauty
                retailers use in-store, now in your browser.
              </p>
            </article>
          </div>

          {/* Recommendations */}
          <h2 className="font-display mt-14 text-3xl text-[var(--color-plum)]">
            Matched to your skin
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Your three weakest scores became three product picks — each with the
            reason it was chosen for <em>this</em> face, not a generic bestseller list.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trio.map(({ product, score }) => (
              <RecommendationCard key={product.id} product={product} score={score} />
            ))}
          </div>

          {/* Try-on */}
          <h2 className="font-display mt-14 text-3xl text-[var(--color-plum)]">
            Now preview the shade — on your face
          </h2>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Analysis tells you <em>what</em> to buy. YouCam Makeup Virtual Try-On
            shows you <em>how it looks</em> — before it ships.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {TRY_ON_PRODUCTS.map((product) => (
              <div key={product.id}>
                <RecommendationCard
                  product={product}
                  onTryShade={(p) => {
                    setTryOnError(null);
                    setShadePick(shadePick?.id === p.id ? null : p);
                  }}
                  trying={tryingId === product.id}
                />
                {shadePick?.id === product.id && product.tryOn && (
                  <div className="fade-up mt-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-[var(--color-plum)]">
                      Pick a shade:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.tryOn.shades.map((shade) => (
                        <button
                          key={shade.hex}
                          onClick={() => runTryOn(product, shade.hex, shade.name)}
                          disabled={tryingId !== null}
                          className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-sm transition hover:border-[var(--color-rosewood)] disabled:opacity-50"
                        >
                          <span
                            className="h-5 w-5 rounded-full ring-1 ring-black/10"
                            style={{ background: shade.hex }}
                          />
                          {shade.name}
                        </button>
                      ))}
                    </div>
                    {tryingId === product.id && (
                      <p className="mt-3 animate-pulse text-sm text-neutral-500">
                        YouCam VTO is rendering the shade on your photo…
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {tryOnError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {tryOnError}
            </div>
          )}
          {tryOn && (
            <div className="mt-6">
              <ShadePreview
                beforeUrl={photoUrl}
                result={{
                  image: tryOn.image,
                  simulated: tryOn.simulated,
                  shadeName: tryOn.shadeName,
                  productName: tryOn.product.name,
                }}
              />
            </div>
          )}

          {/* Also in the catalog */}
          <h3 className="font-display mt-14 text-2xl text-[var(--color-plum)]">
            Complete the routine
          </h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.filter(
              (p) => !p.tryOn && !trio.some((t) => t.product.id === p.id),
            )
              .slice(0, 4)
              .map((product) => (
                <RecommendationCard key={product.id} product={product} />
              ))}
          </div>
        </section>
      )}

      <footer className="mt-20 border-t border-[#e7d9c8] pt-6 text-center text-sm text-neutral-500">
        <p>
          <strong className="text-[var(--color-plum)]">Two YouCam APIs. One selfie. Zero guessing.</strong>
        </p>
        <p className="mt-2">
          SkinCart uses the YouCam Skin Analysis API to diagnose and the YouCam
          Makeup Virtual Try-On API to preview. Your photo is processed for
          analysis and never stored.
        </p>
      </footer>
    </main>
  );
}
