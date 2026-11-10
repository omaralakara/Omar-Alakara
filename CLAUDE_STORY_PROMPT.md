# Prompt: build the scroll story (GSAP + Three.js)

Paste everything below the line into Claude Code, opened in `C:\Users\USER\Desktop\portfolio`.

---

You are continuing Omar Al Akara's portfolio. Build the full scroll-driven story homepage with GSAP ScrollTrigger and Three.js / React Three Fiber. Do not restart the concept or the codebase. Extend what exists.

## Read first, in this order

1. `PORTFOLIO_PLAN.md` is the agreed creative direction, story, section order, shape sequence, and constraints.
2. `Omar_Al_Akara_CV_F.pdf` is the **only** source of facts about Omar. Do not add employers, projects, metrics, clients, or skills that are not in it.
3. `AGENTS.md`. This Next.js version has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
4. `README.md`, then the existing code:
   - `src/components/particles/SharedCanvas.tsx`, `shaders.ts`, `shape-buffers.ts`, `ParticleStage.tsx`, `LaunchVehicle.tsx`, `EnergyCore.tsx` make up the single R3F canvas. It has the Earth point cloud (`public/particles/earth.bin`, Natural Earth land mask, Lebanon marker at 33.89° N, 35.50° E), the background stars, bloom, pointer influence, and GPU morph targets with stable point correspondence.
   - `src/components/motion/useIntroScroll.ts` is the GSAP timeline that drives `motion.progress` across chapters.
   - `src/components/portfolio/*` contains the projects data, the tilted project cards that rise on scroll, the ribbon canvas, and the about and contact sections.
5. The installed skills in `.claude/skills/`. Load each one before writing the code it covers, and follow it:
   - `gsap-core`: tweens, eases, and the basic API
   - `gsap-timeline`: sequencing the chapter transitions
   - `gsap-scrolltrigger`: scroll-linked scrubbing, the short desktop pin, and `matchMedia`
   - `gsap-react`: `useGSAP` / `gsap.context()` and cleanup in React components
   - `gsap-performance`: keeping scroll animation smooth
   - `react-three-fiber`: the shared `<Canvas>`, `useFrame`, and refs instead of React state
   - `three-best-practices`: buffer geometry, shaders, disposal, and GPU performance

   If a skill is missing, tell me and continue without it.

Before changing code, write me a short gap analysis that compares the current implementation with the plan's section table and shape sequence. Say what you will keep, change, or add. Then proceed.

## The story

> From Lebanon, I build digital experiences that connect people, solve problems, and help businesses grow.

Use space and exploration as the visual metaphor. Keep the copy grounded in web development, e-commerce, integrations, performance, and business outcomes. It must not read like a space game.

| # | Section | Content (from the CV) | Main particle sculpture |
|---|---------|-----------------------|-------------------------|
| 1 | Introduction | Name; "Creative development. Real-world impact."; Explore my work and Get in touch CTAs | Earth with continents, subtle Lebanon highlight, slow rotation, gentle pointer response |
| 2 | What I build | Interactive websites (React, Next.js, GSAP); E-commerce (Shopify, Liquid, WordPress, WooCommerce); Performance & discovery (Technical SEO, Core Web Vitals, Search Console, GA4); Integrations & automation (APIs, AI integrations, workflow automation) | Earth flows into a **satellite** |
| 3 | Selected work | Laptops King, Synergi BPO, fazeZERO (existing `projects.ts`); cards start tilted back like screens lying down and rise to front-facing as you scroll | Satellite disperses; the main sculpture fades out; sparse background particles remain |
| 4 | Results | Laptops King: about 44% more organic clicks and 63% more impressions vs. the preceding three months, worded as "contributed to", never sole credit | Particles form a **rocket** that rises slightly with scroll |
| 5 | About & experience | Lebanon; B.Sc. Computer Engineering, LIU (2021–2024); career milestones (Loyabi, Sereni, fazeZERO, CIS College instructor, Laptops King, Synergi); teaching; CV download; GitHub | Rocket dissolves into a calm, broad flowing **ribbon** |
| 6 | Contact | omar.alakara3@gmail.com, LinkedIn (linkedin.com/in/omar-alakara), invitation for employment or freelance work | Ribbon gathers back into a **smaller Earth**, echoing the opening |

Shape sequence: **Earth → satellite → disperse → rocket → ribbon → Earth.** The robot and twisting loop are out of scope.

Visual direction: near-black background, readable white type, luminous blue and violet particles, restrained gold highlights. Navigation is Work, Skills, About, Contact, and each item jumps directly to its section.

## Technical requirements

- **One shared canvas** containing a sparse background particle layer and one morphing main sculpture. Do not create per-section canvases or per-particle React state.
- **Morphing on the GPU.** Every shape is an equal-length target buffer in `shape-buffers.ts` with deliberate point correspondence, and the shader interpolates between targets. Generate the satellite, rocket, and ribbon procedurally or by sampling simple geometry. Use no unlicensed models.
- **A single scroll controller.** Use one GSAP ScrollTrigger timeline, or one per section feeding a shared `SceneState`, that writes progress, shape index, morph amount, visibility, and position into a ref read by `useFrame`. Use `gsap.context()` / `useGSAP` and `gsap.matchMedia()`, and clean up on unmount.
- **Normal scrolling** that works forwards and backwards. Avoid long forced pins. The project gallery may pin briefly on desktop only.
- **Content works without 3D.** All text and links are real HTML, never in WebGL. Keep the existing static Earth SVG fallback, `prefers-reduced-motion` behaviour, pause control, tab-hidden pausing, context-loss fallback, and adaptive downgrade.
- **Mobile.** Stack the artwork above or below the text, use fewer particles, shorter transitions, and gentle card motion, and never depend on hover. There must be no horizontal overflow at 320px.
- **Accessibility.** Keyboard access to cards and nav, visible focus, `inert`/`aria-hidden` only on content that is truly offscreen, and a skip link.
- **Accurate skills.** The CV lists Three.js as *introductory* and CI/CD as *exposure*. Do not overstate either.
- No new paid services, CMS, database, analytics, or AI API. Ask before adding any npm dependency and explain why it is needed.

## Process

1. Gap analysis (above), then a brief plan of the files you will touch.
2. Build in vertical slices. First get Earth → satellite → dispersed working end to end and verify it, then rocket, then ribbon, then the returning Earth.
3. After each slice run `npm run typecheck`, `npm run build`, and `npm run check:portfolio` (with `npm run dev` running on port 3000). Look at the screenshots in `artifacts/` at desktop and 390px width.
4. Update `README.md` (architecture table, verification steps) and `THIRD_PARTY_NOTICES.md` if any assets are added.
5. Report honestly: what works, what you verified and how, and what is still a placeholder. Make no frame-rate claims without real-device testing.

Do not commit or push unless I ask.
