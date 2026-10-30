import type { ConcernId, TryOnEffectKind } from './types';

// Static curated catalog (BUILD-CHECKLIST.md §Recommendation mapping).
// All product names are generic on purpose — no real brand trademarks
// (the demo-video rules prohibit unlicensed third-party trademarks).

export interface Shade {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  kind: string;
  price: string;
  /** Accent color used by the product illustration. */
  tint: string;
  /** Which concern this product answers. */
  concern: ConcernId;
  blurb: string;
  /** Reason template — {score} is replaced with the shopper's ui_score. */
  reason: string;
  /** Present when this product can be previewed with Makeup VTO. */
  tryOn?: {
    kind: TryOnEffectKind;
    shades: Shade[];
  };
}

export const PRODUCTS: Product[] = [
  {
    id: 'bha-cleanser',
    name: 'Clarifying BHA Cleanser',
    kind: 'Gentle salicylic-acid cleanser',
    price: '$18',
    tint: '#7fb069',
    concern: 'acne',
    blurb: 'A low-pH gel cleanser with 2% salicylic acid that unclogs pores without the tight, stripped feeling.',
    reason:
      'Your blemish score is {score}/100 — a BHA cleanser targets clogged pores at the source, gently.',
  },
  {
    id: 'ha-serum',
    name: 'Hydra-Boost HA Serum',
    kind: 'Hyaluronic-acid hydrating serum',
    price: '$24',
    tint: '#5aa9e6',
    concern: 'moisture',
    blurb: 'Three weights of hyaluronic acid that pull water into the skin and hold it there all day.',
    reason:
      'Hydration scored {score}/100 — this serum layers water-binding humectants under your moisturizer.',
  },
  {
    id: 'retinol-cream',
    name: 'Renewal Retinol Night Cream',
    kind: 'Retinol night cream, 0.3%',
    price: '$32',
    tint: '#8e6cc8',
    concern: 'wrinkle',
    blurb: 'Encapsulated retinol in a cushiony night cream — the best-studied topical for softening fine lines.',
    reason:
      'Fine lines scored {score}/100 — retinol is the best-studied topical for exactly this concern.',
  },
  {
    id: 'vitc-serum',
    name: 'Bright-C Vitamin C Serum',
    kind: 'Vitamin C brightening serum',
    price: '$27',
    tint: '#f2a93b',
    concern: 'age_spot',
    blurb: 'A stabilized 12% vitamin C serum that fades the look of dark spots and restores glow.',
    reason:
      'Dark spots scored {score}/100 — vitamin C is the standard brightening step for pigmentation.',
  },
  {
    id: 'centella-cream',
    name: 'Calm Barrier Moisturizer',
    kind: 'Centella calming moisturizer',
    price: '$22',
    tint: '#e5989b',
    concern: 'redness',
    blurb: 'Centella and panthenol in a barrier-first cream that helps reactive, flushed skin settle down.',
    reason:
      'Redness scored {score}/100, mostly across the cheeks — a barrier-first calming cream reduces flare-ups.',
  },
  {
    id: 'caffeine-eye',
    name: 'Awake Caffeine Eye Cream',
    kind: 'Caffeine eye cream',
    price: '$19',
    tint: '#a26769',
    concern: 'dark_circle_v2',
    blurb: 'Caffeine plus light-reflecting minerals to de-puff and brighten the under-eye area.',
    reason:
      'Dark circles scored {score}/100 — caffeine eye creams target the tired look right where it shows.',
  },
  {
    id: 'niacinamide-toner',
    name: 'Refine Niacinamide Toner',
    kind: 'Niacinamide pore-refining toner',
    price: '$16',
    tint: '#6a994e',
    concern: 'pore',
    blurb: '10% niacinamide in a weightless toner that regulates oil and refines the look of pores.',
    reason:
      'Pores scored {score}/100, concentrated on the nose and cheeks — niacinamide regulates oil and refines their look.',
  },
  {
    id: 'skin-tint-foundation',
    name: 'Second-Skin Foundation',
    kind: 'Perfect-match foundation',
    price: '$29',
    tint: '#e8b48c',
    concern: 'redness',
    blurb: 'A breathable medium-coverage foundation matched to even out tone — preview your shade before you buy.',
    reason:
      'Evening out your tone is the fastest visible change — preview this shade on your own photo first.',
    tryOn: {
      kind: 'foundation',
      shades: [
        { name: 'Sand Glow', hex: '#e8b48c' },
        { name: 'Honey Veil', hex: '#d99e66' },
        { name: 'Warm Porcelain', hex: '#f0c9a2' },
      ],
    },
  },
  {
    id: 'velvet-lipstick',
    name: 'Velvet Matte Lipstick',
    kind: 'Matte lipstick',
    price: '$15',
    tint: '#c2255c',
    concern: 'moisture',
    blurb: 'A weightless matte lipstick that finishes the look your skin analysis started — try the shade on your photo.',
    reason:
      'Complete the routine with a shade picked for your skin tone — preview it on your own lips first.',
    tryOn: {
      kind: 'lip_color',
      shades: [
        { name: 'Rosewood Matte', hex: '#c2255c' },
        { name: 'Terracotta Satin', hex: '#b5542d' },
        { name: 'Berry Silk', hex: '#8e2a4e' },
      ],
    },
  },
  {
    id: 'daily-spf',
    name: 'Invisible Daily SPF 50',
    kind: 'Sunscreen, no white cast',
    price: '$17',
    tint: '#f4d35e',
    concern: 'age_spot',
    blurb: 'A truly invisible SPF 50 that protects the brightening work your serums are doing.',
    reason:
      'Every brightening routine needs daily SPF to hold its results — this one leaves no white cast.',
  },
];

export const productForConcern = (concern: ConcernId): Product | undefined =>
  PRODUCTS.find((p) => p.concern === concern && !p.tryOn) ??
  PRODUCTS.find((p) => p.concern === concern);

/** The two try-on cards always offered after the matched trio. */
export const TRY_ON_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.tryOn);
