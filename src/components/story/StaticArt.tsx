// Lightweight stand-ins for each 3D scene, shown before JavaScript, with reduced motion,
// when motion is paused, or when WebGL is unavailable. Purely decorative.
export type ArtKind = "earth" | "satellite" | "rocket" | "galaxy" | "robot";

export default function StaticArt({ kind }: { kind: ArtKind }) {
  if (kind === "earth") return <img src="/particles/earth-fallback.svg" width="600" height="600" alt="" loading="lazy" decoding="async" />;
  return <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" focusable="false">
    {kind === "satellite" && <g transform="rotate(-25 200 200)">
      <rect x="174" y="166" width="52" height="68" />
      <path d="M174 180H45V230H174M226 180H355V230H226M80 180V230M112 180V230M144 180V230M256 180V230M288 180V230M320 180V230M200 166V132M170 112Q200 157 230 112" />
    </g>}
    {kind === "rocket" && <g transform="rotate(24 200 200)">
      <path d="M200 45Q226 70 225 115V245H175V115Q174 70 200 45ZM175 130H157V250H175M225 130H243V250H225M183 250L200 355L217 250M160 253L166 309L173 253M227 253L234 309L241 253M175 190H225M175 226H225" />
      <path d="M190 90H210M190 102H210" strokeWidth="4" />
    </g>}
    {kind === "robot" && <g>
      <rect x="138" y="70" width="124" height="100" rx="30" />
      <rect x="156" y="98" width="88" height="46" rx="14" />
      <circle cx="180" cy="121" r="8" fill="currentColor" /><circle cx="220" cy="121" r="8" fill="currentColor" />
      <path d="M200 70V42M192 36a8 8 0 1 0 16 0a8 8 0 1 0-16 0M190 170v14h20v-14" />
      <rect x="112" y="184" width="176" height="160" rx="38" />
      <circle cx="200" cy="240" r="18" />
      <path d="M112 212Q88 260 84 314M288 212Q330 170 330 112M318 96l12 16 14-12" />
      <ellipse cx="200" cy="370" rx="62" ry="10" opacity=".5" />
    </g>}
    {kind === "galaxy" && <g transform="translate(200 200) rotate(-18) scale(1 .72)">
      <circle r="26" fill="currentColor" opacity=".5" />
      {[0, 120, 240].map(turn => <path key={turn} transform={`rotate(${turn})`} d="M0 0C40 -10 90 10 110 60S80 170 -10 175" opacity=".7" />)}
      <circle r="168" strokeDasharray="2 10" opacity=".35" />
    </g>}
  </svg>;
}
