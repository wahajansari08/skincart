// Shared types for SkinCart. Both the mock provider and the real YouCam
// provider implement `SkinProvider` (see provider.ts) and return these shapes,
// so the UI never cares which one served the result.

export type ConcernId =
  | 'wrinkle'
  | 'pore'
  | 'acne'
  | 'moisture'
  | 'redness'
  | 'age_spot'
  | 'dark_circle_v2';

export interface ConcernScore {
  id: ConcernId;
  /** Float 1–100, higher = healthier. Internal sorting (find weakest). */
  rawScore: number;
  /** Integer 1–100, calibrated for display (Perfect Corp guidance: show this). */
  uiScore: number;
  /** Optional per-concern mask image (data URL or proxied URL) from the live API. */
  maskUrl?: string;
}

export interface SkinAnalysisResult {
  overall: number; // "all" score in the YouCam response
  skinAge: number;
  concerns: ConcernScore[];
  mode: 'live' | 'mock';
  /** True when live mode was attempted but failed and mock data was served. */
  fallback?: boolean;
  /** Blended mask overlay image, when the live API returned one. */
  overlayUrl?: string;
}

export type TryOnEffectKind = 'foundation' | 'lip_color';

export interface TryOnRequest {
  kind: TryOnEffectKind;
  /** Shade hex, e.g. "#e8b48c" for foundation, "#c2255c" for lipstick. */
  color: string;
  /** 0–100 color intensity. */
  colorIntensity: number;
  texture?: 'matte' | 'satin'; // lip_color only — matte/satin need no extra fields
  glowIntensity?: number; // foundation only
  coverageIntensity?: number; // foundation only
}

export interface TryOnResult {
  /** Result image as a data URL (safe to render immediately; never an expiring raw URL). */
  resultImage: string;
  mode: 'live' | 'mock';
  /** True when the "after" image is a simulated preview rather than a true VTO render. */
  simulated: boolean;
}

export interface SkinProvider {
  analyzeSkin(image: Buffer, contentType: string): Promise<SkinAnalysisResult>;
  tryOnMakeup(
    image: Buffer,
    contentType: string,
    req: TryOnRequest,
  ): Promise<TryOnResult>;
}
