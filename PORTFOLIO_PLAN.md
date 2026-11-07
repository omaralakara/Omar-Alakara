# Omar Al Akara — Portfolio Plan

Last updated: November 3, 2026

## Purpose and current status

Build Omar's personal portfolio for both employers and freelance clients. The project is simply called **My Portfolio**; it has no live URL yet.

This document preserves the planning discussion. No website code has been written and no tools or services have been purchased for the build. The CV in this folder, `Omar_Al_Akara_CV_F.pdf`, is the initial content source. Improving the CV is a separate, later task.

Omar wants to understand the architecture before coding starts and receive clear guidance through each step. Explain dependencies, any useful skills/plugins, and costs before introducing them. Do not treat this plan as authorization to buy services or begin implementation automatically.

## Creative direction

- A cinematic, coherent scrolling experience that tells one story based on Omar's actual experience.
- Near-black background, readable white typography, luminous blue and violet particles with restrained gold highlights.
- Preserve the colours and atmosphere of the supplied image references.
- Recognizable particle objects are the main visual focus; avoid relying entirely on random abstract sculptures.
- Sparse floating particles remain in the background throughout the normal full-motion experience.
- A separate main particle sculpture morphs between sections, responds to the mouse, and sometimes disappears to give project images room.
- Abstract ribbons can connect recognizable shapes and accompany quieter content.
- Responsive layouts, accessibility, and performance are design requirements from the start.

The references establish appearance, not finished animation assets. Interactive shapes will need real 3D point positions and browser rendering; static images alone cannot produce the desired interactions.

## Story

Proposed narrative accepted as the working direction:

> From Lebanon, I build digital experiences that connect people, solve problems, and help businesses grow.

Use exploration and space as a consistent visual theme. Keep the writing grounded in web development, e-commerce, integrations, performance, and business outcomes. Avoid making the site read like a space-themed game.

## Homepage section order

| Section | Content | Main particle behaviour |
| --- | --- | --- |
| 1. Introduction | Omar's name; “Creative development. Real-world impact.”; concise positioning; Explore my work and Get in touch links | Recognizable Earth with continents, subtle Lebanon highlight, slow rotation, and gentle pointer response |
| 2. What I build / Skills | Interactive websites, e-commerce, integrations and automation; supporting technologies in readable text | Earth dissolves through a flowing transition into a satellite |
| 3. Selected work / Projects | Project screenshots, descriptions, personal contributions, technologies, and links | Satellite disperses; main sculpture fades away; faint background particles remain |
| 4. Results and improvement | Verified SEO, performance, commerce, and automation outcomes | Particles form a rocket and rise subtly with scrolling |
| 5. About and experience | Personal introduction, selected career milestones, teaching, CV and GitHub links | Rocket dissolves into a calmer flowing ribbon |
| 6. Contact | Email, LinkedIn, and clear invitation for employment or freelance enquiries | Ribbon gathers back into a smaller Earth, echoing the opening |

Working sequence:

**Earth → satellite → disperse for projects → rocket → ribbon → Earth**

Navigation: Work, Skills, About, Contact. Visitors must be able to jump directly to sections without watching every transition.

## Shape selection

Latest recommendation for version one:

- Keep Earth, satellite, rocket, and one flowing ribbon.
- Reuse Earth at the end rather than introducing another object.
- Prefer the broad flowing ribbon from the initial hero reference.
- Keep the tighter twisting loop as an alternative reference, not an additional required scene.
- Omit the robot initially; reconsider only if a substantive automation case study gives it a clear purpose.

Omar mentioned seven shapes. The discussion identifies six ideas: Earth, satellite, rocket, robot, ribbon, and loop. The seventh is not identified. Do not invent a missing reference. The reduced selection above is an assistant recommendation to review in the storyboard, not a claim that every shape detail has been approved.

## Project presentation

Omar wants projects to start tilted backwards, like screens lying down. As the visitor scrolls, cards rise and rotate into a readable, front-facing position. Each project has its own clickable destination.

- Use this effect inside the projects section, while the main particle object is absent.
- Keep cards readable and clickable once revealed.
- Preserve keyboard access and ordinary scrolling.
- On mobile, use a vertical stack with much gentler movement.
- Proposed hierarchy: three large featured showcases, followed by a compact gallery for the remaining projects. Omar wants all relevant projects included; the three-feature hierarchy is a recommendation, not a finalized limit.
- Decide later whether each card links to a local case study, live project, or both, based on available material.

No project inventory or public links have been supplied. “My Portfolio” refers to this build, not to an existing case study. Do not invent projects, screenshots, client permissions, or results.

## Skills and content from the CV

Group skills by what Omar delivers rather than treating every technology as equally important:

| Group | Supporting skills |
| --- | --- |
| Interactive websites | React, Next.js, JavaScript, GSAP, HTML, CSS |
| E-commerce and content | Shopify, Liquid, WordPress, WooCommerce |
| Performance and discovery | Technical SEO, Core Web Vitals, Search Console, GA4 |
| Integrations and automation | APIs, AI integrations, workflow automation |
| Supporting technical experience | Hosting, AWS exposure, SQL databases |

Teaching supports the personal story and ability to communicate technical ideas. Keep skill claims accurate: the CV describes Three.js as introductory and CI/CD as exposure.

Potential case-study sources include Laptops King, a shareable Synergi project, and shareable fazeZERO or independent work. These are candidates only.

The CV reports approximately 44% growth in organic clicks and 63% growth in impressions at Laptops King compared with the preceding three-month period. Before publishing, confirm the exact periods, supporting evidence, and Omar's contribution. Do not imply sole causation or apply those metrics to other projects.

## Proposed architecture — explain and confirm before coding

### Pages

- One storytelling homepage with the six sections above.
- Separate project detail pages where enough material is available.
- Downloadable CV.
- No database, CMS, account system, or AI API is currently required.

### Three coordinated parts

1. **Content layer:** normal HTML text, navigation, images, links, and buttons.
2. **Scroll controller:** translates section progress into animation progress, position, visibility, and shape transitions.
3. **One shared 3D canvas:** contains both a sparse background particle group and the transforming main sculpture.

Keep the content usable if 3D fails or is disabled. Particle shapes should not contain essential text or navigation.

### Proposed technology

| Technology | Purpose |
| --- | --- |
| Next.js and React | Pages, reusable sections, and project detail routes; mostly static content |
| TypeScript | Clear types and earlier error detection |
| CSS Modules | Layout, visual styling, and responsive rules |
| Three.js and React Three Fiber | Browser-rendered 3D scene integrated with React |
| Custom GPU shaders | Efficient particle motion, colour, morphing, and pointer influence |
| GSAP ScrollTrigger | Coordinate scrolling and visual transitions |
| Local content files | Store project descriptions, skills, and experience initially |

No packages have been installed. Exact versions, hosting, asset sources, and final file structure remain undecided.

### Shape assets

- Earth can use mathematical sphere positions and a continent mask.
- Satellite and rocket can use simple custom geometry or appropriately licensed models.
- Sample points across geometry to generate particle shapes.
- Plan consistent particle counts and point correspondence so morphs remain visually controlled.
- Use generated images for visual exploration, not as substitutes for interactive geometry.

## Interaction, responsiveness, and performance

- Scrolling forward and backward should smoothly form and reform objects.
- Pointer influence should be local and gentle; particles return so silhouettes remain recognizable.
- Keep normal page scrolling; avoid forcing visitors through long pinned sequences.
- Use one canvas and batched point rendering rather than individual objects per particle.
- Perform continuous particle calculations on the GPU; avoid per-particle React updates.
- Adapt particle count, resolution, and glow to device performance.
- Load readable content first, then enhance it with 3D.
- Reduce main-sculpture work when hidden; pause animation when the tab is hidden.
- Constant background motion still consumes resources. It must be sparse and allow reduced-motion/static alternatives.
- Compress project images and load nonessential images lazily.
- Recompose mobile layouts: artwork above or below text, fewer particles, shorter transitions, no hover dependency.
- Provide a static fallback for unsupported or struggling devices.
- Test real devices before promising frame rates. Define measurable targets during prototype planning.

## Tools, AI, and spending

- Omar wants to use Astra as an AI development assistant.
- ChatGPT image generation is optional for concepts and storyboard frames.
- Claude is optional; a second AI subscription is not a project requirement.
- Higgsfield is not required for the planned live browser particle system.
- Blender is optional if custom modelling or asset modification becomes necessary.
- No additional skill/plugin installation is needed merely to continue planning.
- No per-visitor AI API calls are needed for particle animation.
- Possible later expenses: domain, hosting depending on plan, and optional licensed assets.
- No purchase is currently recommended. Check actual requirements and current prices before proposing spending.

## Next session

Start by reading this document. Do not restart the concept discussion from scratch.

1. Turn the agreed sequence into a simple desktop/mobile storyboard, including where the main sculpture appears and disappears and how the project cards rise.
2. Explain the proposed component and file structure in plain language so Omar understands the architecture.
3. Gather available project content when needed. Missing content can be represented by explicitly labelled planning placeholders; it should not block explaining the architecture.
4. Review shape silhouettes and the reduced shape selection.
5. Once Omar agrees to implementation, build a small Earth → ribbon → satellite prototype with mouse interaction and mobile/performance checks.
6. Use the prototype findings to refine the full site before building every section.

Today's stopping point: planning saved; no website implementation started.

## Technical references consulted during planning

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Official Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra)
