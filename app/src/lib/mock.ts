import { createHash } from 'crypto';
import { PANEL } from './concerns';
import type {
  SkinAnalysisResult,
  SkinProvider,
  TryOnRequest,
  TryOnResult,
} from './types';

// Mock provider — the standing insurance policy (BUILD-CHECKLIST.md "Mock
// mode"). It implements the SAME SkinProvider interface as the real YouCam
// client, so the UI is identical either way.
//
// Scores are derived deterministically from a hash of the uploaded image:
// the same photo always returns the same analysis (comparable across demo
// takes), while different photos produce believably different dashboards —
// which also makes the recommendation engine visibly react per face.
// Once a real Playground capture exists (fixtures/sample-score-info.json),
// swap the generator below for that fixture; the interface stays the same.

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function seededScores(seed: string) {
  const hash = createHash('sha256').update(seed).digest();
  return PANEL.map((id, i) => {
    // Two bytes per concern → a score in a believable 38–93 band.
    const v = hash[i * 2] * 256 + hash[i * 2 + 1];
    const uiScore = 38 + Math.round((v / 65535) * 55);
    return { id, uiScore, rawScore: Math.min(100, uiScore + (hash[i] % 7) - 3) };
  });
}

export const mockProvider: SkinProvider = {
  async analyzeSkin(image: Buffer): Promise<SkinAnalysisResult> {
    await delay(1400); // let the processing state breathe, like a real poll cycle
    const concerns = seededScores(image.toString('base64').slice(0, 4096));
    const overall = Math.round(
      concerns.reduce((sum, c) => sum + c.uiScore, 0) / concerns.length,
    );
    // Skin age loosely tracks the wrinkle + firmness-adjacent scores.
    const wrinkle = concerns.find((c) => c.id === 'wrinkle')?.uiScore ?? 70;
    const skinAge = Math.max(21, Math.round(46 - wrinkle * 0.28));
    return { overall, skinAge, concerns, mode: 'mock' };
  },

  async tryOnMakeup(
    image: Buffer,
    contentType: string,
    _req: TryOnRequest,
  ): Promise<TryOnResult> {
    await delay(900);
    // Mock VTO cannot truly render makeup. We return the original photo and
    // let ShadePreview apply a clearly-labelled simulated tint, so the demo
    // never misrepresents what the live API does.
    return {
      resultImage: `data:${contentType};base64,${image.toString('base64')}`,
      mode: 'mock',
      simulated: true,
    };
  },
};
