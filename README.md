# Omar Al Akara — portfolio

A single scroll story built from `PORTFOLIO_PLAN.md` and the CV. One shared particle field flies through space behind six normal-flow sections, and every scene and transition between them is made of particles:

| Section | Particle scene (always right column, same size) | GSAP choreography |
| --- | --- | --- |
| Introduction | Earth, Lebanon glowing in gold | Headline letters fly in from deep space; they disperse into the stars as you leave the hero |
| Skills | Satellite, turning with the scroll | Pinned: the four skill groups orbit the satellite as rings of chips; each orbit takes its turn (hover pauses) |
| Results | Spiral galaxy (inner stars orbit faster) | Numbers count up to the CV values; rules draw across |
| Work | Particle rocket with exhaust, climbing as you scroll | Pinned: a one-screen stack; each project screen rises from lying back as the previous one flies past |
| Experience | Robot whose head follows the cursor | Pinned: a year track fills while each role swaps in with its skills; the robot waves on arrival and from “Wave hello” |
| Contact | Earth, the same size as the opening | Email letters ripple on hover |

Pinned, one-screen sections apply on screens of at least 1100×680; smaller screens use natural scrolling with lighter animation.

Across the page: eyebrow labels scramble in, lead text rises line by line, buttons are magnetic, and a soft star cursor (glow, lagging ring, stardust trail, click ripple) replaces the native cursor on mouse devices.

## Preview

```powershell
npm install
npm run dev
```

Open **http://localhost:3000**.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Renders the story |
| `src/components/story/Story.tsx` | All semantic content, navigation, project dialog |
| `src/components/story/content.ts` | CV-sourced copy (skills, metrics, milestones). Do not add facts that are not in the CV |
| `src/components/story/useStoryScroll.ts` | The single GSAP/ScrollTrigger controller: scene tracking plus all choreography, created in page order |
| `src/components/story/StaticArt.tsx` | Static line art used without JavaScript, with reduced motion, or without WebGL |
| `src/components/particles/ParticleStage.tsx` | Fixed full-viewport 3D layer, loader, fallbacks |
| `src/components/particles/SharedCanvas.tsx` | One R3F canvas: flying starfield, morphing sculpture, robot head tracking, bloom |
| `src/components/particles/shape-buffers.ts` | Equal-length particle targets with stable correspondence: Earth, satellite, galaxy, rocket, robot |
| `src/components/particles/shaders.ts` | GPU morphing, robot head and arm joints, rocket flame, starfield flight |
| `src/components/particles/RocketExhaust.tsx` | Particle exhaust plume for the rocket scene |
| `src/components/effects/StarCursor.tsx` | Soft custom cursor for fine pointers |

GSAP writes a small mutable `StoryMotion` object (`story` 0–5, `rise`, `orbit`, `wave`, `speed`, `anchor`); the canvas reads it every frame, so scrolling never triggers React re-renders. GSAP plugins used (bundled with `gsap` 3.15): ScrollTrigger, SplitText, ScrambleText.

## Accessibility and performance

- All text and links are real HTML; nothing essential is inside WebGL. Split headings keep their accessible names.
- `prefers-reduced-motion: reduce` skips WebGL and all choreography and shows static art; the custom cursor only runs with motion on fine pointers.
- Rendering pauses when the tab is hidden; slow devices drop particle count, then fall back to static art; context loss falls back too.
- The starfield and morphs run on the GPU; the cursor trail's render loop stops when idle.

## Verification

```powershell
npm run typecheck
npm run build
npm run check:portfolio   # needs `npm run dev` on port 3000 and local Chrome
```

`check:portfolio` is behavioural (no screenshots): it checks that every section fits one screen at 1440×1000 and 1280×720 with its scene in the right column, each scene's value per section, reversible morphs, the skill orbits, project stack and experience track, that content never disappears while on screen, metric values, the robot wave and head tracking, the project dialog and focus return, navigation, overflow at 390/320/844/1024 widths, reduced motion and no-JavaScript output. No real-device frame-rate claim is made.

## Sources

Geography: [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) via [world-atlas](https://github.com/topojson/world-atlas). All other shapes are generated procedurally.
