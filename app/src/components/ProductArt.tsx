/** Original flat illustration of a cosmetic bottle, tinted per product.
 *  Demo assets carry no brand trademarks (hackathon video/asset rules). */
export default function ProductArt({ tint, kind }: { tint: string; kind: string }) {
  const isSerum = /serum/i.test(kind);
  const isCleanser = /cleanser|toner/i.test(kind);
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect width="120" height="120" fill="#f7ece1" />
      <ellipse cx="60" cy="102" rx="30" ry="5" fill="#000" opacity="0.08" />
      {isSerum ? (
        <g>
          <rect x="54" y="14" width="12" height="16" rx="2" fill="#3a3238" />
          <path d="M57 30 h6 v10 h-6 z" fill="#8a7f86" />
          <rect x="42" y="40" width="36" height="58" rx="9" fill={tint} />
          <rect x="48" y="52" width="24" height="26" rx="3" fill="#fff" opacity="0.85" />
        </g>
      ) : isCleanser ? (
        <g>
          <rect x="46" y="16" width="28" height="12" rx="3" fill="#3a3238" />
          <rect x="38" y="28" width="44" height="70" rx="10" fill={tint} />
          <rect x="45" y="42" width="30" height="30" rx="3" fill="#fff" opacity="0.85" />
        </g>
      ) : (
        <g>
          <rect x="38" y="30" width="44" height="12" rx="4" fill="#3a3238" />
          <rect x="34" y="42" width="52" height="56" rx="12" fill={tint} />
          <rect x="42" y="56" width="36" height="26" rx="3" fill="#fff" opacity="0.85" />
        </g>
      )}
      <circle cx="88" cy="30" r="9" fill={tint} opacity="0.35" />
      <circle cx="28" cy="52" r="6" fill={tint} opacity="0.25" />
    </svg>
  );
}
