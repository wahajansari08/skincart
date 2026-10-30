// Provider selection — server-side only (used by the /api routes).
//
// Live mode requires BOTH a key and mock mode not being forced:
//   YOUCAM_API_KEY set  +  SKINCART_MOCK unset/0   → real YouCam provider
//   anything else                                   → mock provider
// Callers also get `callWithFallback`, which serves mock data with a
// `fallback` flag if the live call fails — the demo never dead-ends
// (BUILD-CHECKLIST.md mock-mode policy), and the UI shows a Demo data badge.

import { mockProvider } from './mock';
import { youcamProvider } from './youcam';
import type { SkinProvider } from './types';

export function liveEnabled(): boolean {
  return Boolean(process.env.YOUCAM_API_KEY) && process.env.SKINCART_MOCK !== '1';
}

export function activeProvider(): SkinProvider {
  return liveEnabled() ? youcamProvider : mockProvider;
}
