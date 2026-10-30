import { NextRequest, NextResponse } from 'next/server';
import { mockProvider } from '@/lib/mock';
import { activeProvider, liveEnabled } from '@/lib/provider';
import type { SkinAnalysisResult } from '@/lib/types';

export const runtime = 'nodejs';
// Polling a live analysis can take 10–30s (API-RESEARCH.md §2).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No image received — please choose a selfie.' },
        { status: 400 },
      );
    }
    const image = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'image/jpeg';

    const provider = activeProvider();
    try {
      const result = await provider.analyzeSkin(image, contentType);
      return NextResponse.json(result satisfies SkinAnalysisResult);
    } catch (err) {
      if (!liveEnabled()) throw err;
      // Live failed → serve mock with a visible fallback flag, never a dead end.
      console.error('[skincart] live analyze failed, serving mock:', err);
      const mock = await mockProvider.analyzeSkin(image, contentType);
      return NextResponse.json({ ...mock, fallback: true });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Analysis failed — please try again.' },
      { status: 500 },
    );
  }
}
