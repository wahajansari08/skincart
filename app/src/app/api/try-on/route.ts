import { NextRequest, NextResponse } from 'next/server';
import { mockProvider } from '@/lib/mock';
import { activeProvider, liveEnabled } from '@/lib/provider';
import type { TryOnRequest, TryOnResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('image');
    const specRaw = form.get('spec');
    if (!(file instanceof Blob) || typeof specRaw !== 'string') {
      return NextResponse.json(
        { error: 'Missing photo or shade selection.' },
        { status: 400 },
      );
    }
    const spec = JSON.parse(specRaw) as TryOnRequest;
    if (spec.kind !== 'foundation' && spec.kind !== 'lip_color') {
      return NextResponse.json({ error: 'Unknown try-on effect.' }, { status: 400 });
    }
    const image = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'image/jpeg';

    const provider = activeProvider();
    try {
      const result = await provider.tryOnMakeup(image, contentType, spec);
      return NextResponse.json(result satisfies TryOnResult);
    } catch (err) {
      if (!liveEnabled()) throw err;
      console.error('[skincart] live try-on failed, serving mock:', err);
      const mock = await mockProvider.tryOnMakeup(image, contentType, spec);
      return NextResponse.json({ ...mock, simulated: true });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Try-on failed — please try again.' },
      { status: 500 },
    );
  }
}
