# Omar Al Akara — introduction

The first section of the portfolio: responsive navigation, introduction, two CTAs, and a live particle Earth. The later sections are intentionally not built.

## Preview

```powershell
npm install
npm run dev
```

Open **http://localhost:3000**. Move the mouse gently around the Earth. The motion button pauses/resumes the entire canvas. On mobile, the globe sits below the copy and navigation opens through Menu.

The Work, Skills, and About navigation controls and Explore my work CTA open an accessible coming-soon dialog with the supplied CV. They do not point to missing anchors or invented projects. Get in touch and the navigation contact link open an email to the address in the supplied CV. Replace preview actions with section anchors when those sections are implemented.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Homepage entry; renders only the introduction |
| `src/components/hero/Hero.tsx` | Prerendered semantic content, navigation, preview dialog |
| `src/app/page.module.css` | Desktop/mobile composition |
| `src/components/particles/ParticleStage.tsx` | Lazy 3D loading, static fallback, motion preference, visibility, error boundary, pause control |
| `src/components/particles/SharedCanvas.tsx` | One R3F canvas, background points, Earth sculpture, Lebanon marker, resource lifecycle |
| `src/components/particles/shaders.ts` | GPU particle color, local pointer influence, target-buffer interpolation |
| `src/components/particles/scene-state.ts` | Small interface for a later scroll controller: morph, visibility, rotation speed |
| `scripts/generate-earth.mjs` | Deterministic land sampling and matching static SVG generation |
| `public/particles/` | Self-hosted binary Earth positions and static fallback |
| `public/Omar-Al-Akara-CV.pdf` | Unmodified supplied CV |

Earth has 24,854 points, including 19,445 land points, using Natural Earth coastlines. Each particle has a persistent position and land flag. The GPU interpolates `position` toward `aTarget` with `uMorph`; the initial target is Earth itself. Future shapes should supply equal-length target buffers with deliberate point correspondence. A later scroll controller can update `SceneState` without replacing the canvas or mixing animation logic with page content. GSAP and the other shapes are not needed or installed for this introduction.

The Earth rotates slowly around its geographic axis. Fine-pointer movement gently tilts the globe and affects nearby particles; touch scrolling is not intercepted. The gold marker is placed at 33.89° N, 35.50° E and rotates with Earth.

## Accessibility and performance

- Static HTML and a geographic SVG render before JavaScript. No essential content is inside WebGL.
- `prefers-reduced-motion: reduce` uses the static globe without loading the 3D chunk or creating a canvas. Changes to the preference are observed live.
- Explicit pause/resume; rendering stops while the tab or scene is hidden.
- Mobile uses about 14,166 points and pixel ratio 1; desktop caps pixel ratio at 1.5.
- Sustained slow frames lower resolution and particle count, then switch to the SVG if still slow.
- Failed assets, unavailable WebGL, render errors, and context loss leave the static globe and content usable.
- Keyboard focus styles, skip link, native dialog focus trapping/Escape handling, and accessible mobile menu state.
- No external runtime requests, paid services, analytics, or visitor AI calls.

## Verification

```powershell
npm run typecheck
npm run build
npm run check:hero
```

`build` generates the static site in `out/`. `check:hero` requires a running preview on port 3000 and local Chrome. It checks actual WebGL, changing frames, pause/resume, CTA/dialog focus behavior, CV delivery, mobile navigation, 390px/320px overflow, live reduced-motion changes, context-loss fallback, and the no-JavaScript page. Screenshots are written to ignored `artifacts/`.

For another browser executable or server:

```powershell
$env:CHROME_PATH = 'C:/path/to/chrome.exe'
$env:PREVIEW_URL = 'http://localhost:3001'
npm run check:hero
```

Browser viewport emulation is not a substitute for testing physical phones. No real-device frame-rate claim is made.

Regenerate geographic assets with `npm run generate:earth` (not required for normal builds).

## Sources and reference availability

The design follows `PORTFOLIO_PLAN.md`: cinematic near-black, blue/violet particles, restrained gold, real geographic forms. The original visual reference images were not present in the supplied workspace or current conversation and could not be inspected.

Geography: [Natural Earth public-domain land data](https://www.naturalearthdata.com/about/terms-of-use/), distributed by [world-atlas](https://github.com/topojson/world-atlas). Geographic processing is done offline during asset generation, not in the visitor's browser. Rendering follows [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
