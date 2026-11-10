"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/**
 * Shared, mutable scene state. GSAP writes it; the canvas reads it every frame.
 * story:  0 Earth · 1 satellite · 2 galaxy · 3 rocket · 4 robot · 5 Earth
 * rise:   0–1 progress through the projects (the rocket climbs)
 * orbit:  0–1 progress through the skills (the satellite turns)
 * wave:   0–1 robot arm raise; the forearm swings while it is above 0
 * speed:  extra flight speed for the starfield, from scroll velocity
 * anchor: document Y of the intro artwork slot on single-column layouts, else -1
 */
export type StoryMotion = { story: number; rise: number; orbit: number; wave: number; speed: number; anchor: number };

type Options = { animate: boolean; started: boolean; onSection: (index: number) => void };

const random = gsap.utils.random;
/** Screens large enough for pinned, one-screen sections. Smaller screens use natural flow. */
export const STAGE = "(min-width: 1100px) and (min-height: 680px)";
const DESKTOP = "(min-width: 900px) and (min-height: 600px)";
// Skill orbits, sized relative to the 3D object radius R: radius x, flattening, tilt (deg), speed (rad/s).
const ORBITS = [{ r: .62, tilt: -14, speed: .26 }, { r: .82, tilt: 10, speed: -.2 }, { r: 1, tilt: -6, speed: .15 }, { r: 1.16, tilt: 15, speed: -.11 }];
const finePointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

export function useStoryScroll(root: RefObject<HTMLElement | null>, { animate, started, onSection }: Options) {
  const motion = useRef<StoryMotion>({ story: 0, rise: 0, orbit: 0, wave: 0, speed: 0, anchor: -1 });
  const wave = useRef<() => void>(() => {});
  const notify = useRef(onSection);
  useEffect(() => { notify.current = onSection; }, [onSection]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
    const choreograph = animate && started;
    const sections = Array.from(el.querySelectorAll<HTMLElement>("[data-story-section]"));
    const segments = sections.map(() => 0);
    const publish = () => {
      motion.current.story = segments.reduce((sum, value) => sum + value, 0);
      el.dataset.story = motion.current.story.toFixed(2);
    };
    const measureAnchor = () => {
      const slot = el.querySelector<HTMLElement>("[data-anchor]");
      if (!slot || !matchMedia("(max-width: 899px)").matches) { motion.current.anchor = -1; return; }
      const box = slot.getBoundingClientRect();
      motion.current.anchor = box.top + scrollY + box.height / 2;
    };
    const cleanups: Array<() => void> = [];
    const listen = (target: EventTarget, type: string, handler: EventListener) => {
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    };
    const media = gsap.matchMedia();
    const all = (scope: Element, selector: string) => Array.from(scope.querySelectorAll<HTMLElement>(selector));
    const split = (target: HTMLElement) => SplitText.create(target, { type: "chars,words", wordsClass: "word", charsClass: "char" });

    // Characters fly in from deep space and assemble.
    const flyIn = (chars: Element[], trigger: Element | null, play?: gsap.core.Timeline) => {
      const vars: gsap.TweenVars = {
        z: () => random(-900, -300), x: () => random(-80, 80), y: () => random(-50, 50), rotationX: () => random(-90, 90), rotationY: () => random(-60, 60),
        opacity: 0, transformPerspective: 700, duration: 1.2, ease: "expo.out", stagger: { each: .018, from: "random" },
      };
      if (play) play.from(chars, vars, 0);
      else gsap.from(chars, { ...vars, scrollTrigger: { trigger, start: "top 86%", toggleActions: "play none none reverse" } });
    };
    // A one-screen pinned stage. Higher refreshPriority refreshes earlier pins first (page order).
    const pinned = (section: HTMLElement, length: () => number, priority: number, vars: ScrollTrigger.Vars = {}): ScrollTrigger.Vars => ({
      trigger: section, start: "top top", end: () => `+=${length()}`, pin: section.querySelector<HTMLElement>("[data-pin]")!,
      scrub: .8, refreshPriority: priority, invalidateOnRefresh: true, ...vars,
    });
    // Swap "items": only the visible one is reachable by keyboard and screen readers.
    const focusOnly = (items: HTMLElement[], index: number) => items.forEach((item, i) => { item.inert = i !== index; item.setAttribute("aria-hidden", String(i !== index)); });
    const release = (items: HTMLElement[]) => items.forEach(item => { item.inert = false; item.removeAttribute("aria-hidden"); });

    const context = gsap.context(() => {
      // Created synchronously, top to bottom, so pin spacing is always accounted for.
      sections.forEach((section, index) => {
        const name = section.dataset.storySection;
        if (choreograph && name === "skills") media.add(STAGE, () => skillOrbits(section));
        if (choreograph && name === "work") media.add(STAGE, () => projectStack(section));
        if (choreograph && name === "about") media.add(STAGE, () => experienceTrack(section));

        // Scene tracking (always on): active section, and the particle morph into this section's shape.
        ScrollTrigger.create({ trigger: section, start: "top 55%", end: "bottom 55%", onToggle: self => { if (self.isActive) notify.current(index); } });
        if (index > 0) {
          const track = (self: ScrollTrigger) => { segments[index] = self.progress; publish(); };
          ScrollTrigger.create({ trigger: section, start: "clamp(top 88%)", end: "clamp(top 30%)", onUpdate: track, onRefresh: track });
        }
        if (name === "work") {
          const lift = (self: ScrollTrigger) => { motion.current.rise = self.progress; };
          ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", onUpdate: lift, onRefresh: lift });
        }
        if (name === "skills") {
          const turn = (self: ScrollTrigger) => { motion.current.orbit = self.progress; };
          ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", onUpdate: turn, onRefresh: turn });
        }
        if (!choreograph) return;

        // ── Choreography shared by every section ──────────────────────────────────────
        if (name === "intro") {
          const title = section.querySelector<HTMLElement>("[data-intro-title]")!;
          const letters = split(title);
          // Leaving the hero, the headline disperses into the starfield; scrolling back reassembles it.
          const disperse = () => context.add(() => {
            const leave = { trigger: section, start: "top top", end: "bottom 35%", scrub: .7, invalidateOnRefresh: true };
            gsap.to(letters.chars, { x: () => random(-260, 260), y: () => random(-320, -60), z: () => random(-400, 300), rotation: () => random(-140, 140), ease: "power1.in", stagger: { each: .006, from: "random" }, scrollTrigger: leave });
            gsap.to(title, { opacity: 0, ease: "power2.in", scrollTrigger: leave });
          });
          const opening = gsap.timeline({ onComplete: disperse });
          flyIn(letters.chars, null, opening);
          opening.from(all(section, "[data-intro-detail]"), { y: 40, z: -200, opacity: 0, transformPerspective: 800, duration: 1, ease: "power3.out", stagger: .1 }, .55);
        }
        all(section, "[data-heading]").forEach(heading => flyIn(split(heading).chars, heading));
        all(section, "[data-scramble]").forEach(label => {
          gsap.to(label, { duration: 1.2, scrambleText: { text: label.textContent ?? "", chars: "01/_—<>", revealDelay: .25, speed: .5 }, scrollTrigger: { trigger: label, start: "top 90%" } });
        });
        all(section, "[data-lines]").forEach(paragraph => {
          SplitText.create(paragraph, {
            type: "lines", mask: "lines", autoSplit: true,
            onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: .9, ease: "power4.out", stagger: .09, scrollTrigger: { trigger: paragraph, start: "top 88%", toggleActions: "play none none reverse" } }),
          });
        });
        const reveals = all(section, "[data-reveal]");
        if (reveals.length) {
          gsap.set(reveals, { y: 40, z: -180, opacity: 0, transformPerspective: 900 });
          ScrollTrigger.batch(reveals, {
            start: "top 94%",
            onEnter: batch => gsap.to(batch, { y: 0, z: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: .07, overwrite: true }),
            onLeaveBack: batch => gsap.to(batch, { y: 40, z: -180, opacity: 0, duration: .45, ease: "power2.in", overwrite: true }),
          });
        }
        // Natural-flow screens: skill groups and roles rise in as they arrive.
        if (name === "skills" || name === "about") media.add(`not all and ${STAGE}`, () => {
          const items = all(section, name === "skills" ? "[data-group]" : "[data-role]");
          gsap.set(items, { y: 40, opacity: 0 });
          ScrollTrigger.batch(items, { start: "top 92%", onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: .8, ease: "power3.out", stagger: .08, overwrite: true }) });
        });
        all(section, "[data-count]").forEach(number => {
          gsap.from(number, { textContent: 0, snap: { textContent: 1 }, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: number, start: "top 90%", toggleActions: "play none none reverse" } });
        });
        all(section, "[data-rule]").forEach(rule => {
          gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: rule, start: "top 92%", toggleActions: "play none none reverse" } });
        });

        if (name === "work") media.add({ desktop: DESKTOP, compact: `not all and ${DESKTOP}`, stage: STAGE }, ctx => {
          const { desktop, stage } = ctx.conditions as Record<string, boolean>;
          if (stage) return;
          // Natural flow: each screen rises from lying back as it scrolls in.
          all(section, "[data-project-card]").forEach(card => gsap.fromTo(card,
            { rotationX: desktop ? 50 : 16, yPercent: desktop ? 14 : 6, z: -120, opacity: .25, transformPerspective: 1300, transformOrigin: "50% 100%" },
            { rotationX: 0, yPercent: 0, z: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: card, start: "top 100%", end: desktop ? "top 40%" : "top 62%", scrub: .7 } }));
        });

        if (name === "about") {
          // GSAP raises the robot's arm; the shader swings the forearm while it is up.
          let waving: gsap.core.Timeline | null = null;
          wave.current = () => {
            waving?.kill();
            section.dataset.waving = "true";
            waving = gsap.timeline({ onComplete: () => { delete section.dataset.waving; } })
              .to(motion.current, { wave: 1, duration: .7, ease: "back.out(1.7)" })
              .to(motion.current, { wave: 0, duration: .9, ease: "power2.inOut" }, "+=2.4");
          };
          ScrollTrigger.create({ trigger: section, start: "top 55%", end: "bottom 35%", onEnter: () => wave.current(), onEnterBack: () => wave.current() });
        }

        if (name === "contact") {
          const email = section.querySelector<HTMLElement>("[data-email]"), text = email?.querySelector<HTMLElement>("[data-email-text]");
          if (email && text) {
            const letters = SplitText.create(text, { type: "chars", charsClass: "char" });
            gsap.from(letters.chars, { yPercent: 100, opacity: 0, duration: .7, ease: "power3.out", stagger: { each: .02, from: "center" }, scrollTrigger: { trigger: email, start: "top 95%", toggleActions: "play none none reverse" } });
            listen(email, "mouseenter", () => gsap.to(letters.chars, { yPercent: -28, duration: .16, ease: "power2.out", stagger: { each: .018, yoyo: true, repeat: 1 }, overwrite: "auto" }));
          }
        }
      });

      if (!choreograph) return;
      // Scroll speed feeds the starfield: space rushes past while you travel and calms when you stop.
      ScrollTrigger.create({ start: 0, end: "max", onUpdate: self => { motion.current.speed = Math.min(6, Math.abs(self.getVelocity()) / 600); } });
      if (finePointer()) {
        all(el, "[data-magnetic]").forEach(button => {
          const x = gsap.quickTo(button, "x", { duration: .45, ease: "power3" }), y = gsap.quickTo(button, "y", { duration: .45, ease: "power3" });
          listen(button, "pointermove", event => { const e = event as PointerEvent, box = button.getBoundingClientRect(); x((e.clientX - box.left - box.width / 2) * .3); y((e.clientY - box.top - box.height / 2) * .3); });
          listen(button, "pointerleave", () => { x(0); y(0); });
        });
        all(el, "[data-tilt]").forEach(card => {
          const rx = gsap.quickTo(card, "rotationX", { duration: .6, ease: "power3" }), ry = gsap.quickTo(card, "rotationY", { duration: .6, ease: "power3" });
          gsap.set(card, { transformPerspective: 1200 });
          listen(card, "pointermove", event => { const e = event as PointerEvent, box = card.getBoundingClientRect(); rx(-((e.clientY - box.top) / box.height - .5) * 6); ry(((e.clientX - box.left) / box.width - .5) * 8); });
          listen(card, "pointerleave", () => { rx(0); ry(0); });
        });
      }
    }, el);

    // ── Skills: groups orbit the particle satellite as rings of chips ───────────────────
    function skillOrbits(section: HTMLElement) {
      section.dataset.enhanced = "true";
      const groups = all(section, "[data-group]"), ellipses = all(section, "[data-orbit-line]");
      const rings = all(section, "[data-orbit]").map((ring, r) => ({ ring, ...ORBITS[r], chips: all(ring, "[data-chip]").map((chip, i, list) => ({ chip, angle: i / list.length * Math.PI * 2 + r })) }));
      const state = { spread: 0, pace: 1, active: -1, radius: 0 };
      const measure = () => {
        state.radius = Math.min(innerWidth * .2, innerHeight * .3);
        rings.forEach((ring, r) => { ellipses[r].setAttribute("rx", String(ring.r * state.radius)); ellipses[r].setAttribute("ry", String(ring.r * state.radius * .3)); ellipses[r].setAttribute("transform", `rotate(${ring.tilt})`); });
      };
      const activate = (index: number) => {
        if (index === state.active) return;
        state.active = index;
        section.dataset.group = String(index);
        groups.forEach((group, i) => group.toggleAttribute("data-active", i === index));
        rings.forEach(({ ring }, i) => ring.toggleAttribute("data-active", i === index));
        ellipses.forEach((line, i) => line.toggleAttribute("data-active", i === index));
      };
      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(.05, deltaMs / 1000) * state.pace;
        for (const ring of rings) {
          const cos = Math.cos(ring.tilt * Math.PI / 180), sin = Math.sin(ring.tilt * Math.PI / 180), rx = ring.r * state.radius * state.spread, ry = rx * .3;
          const lit = ring.ring.hasAttribute("data-active");
          for (const item of ring.chips) {
            item.angle += ring.speed * dt;
            const x0 = Math.cos(item.angle) * rx, y0 = Math.sin(item.angle) * ry, depth = Math.sin(item.angle);
            const x = x0 * cos - y0 * sin, y = x0 * sin + y0 * cos, scale = (.78 + (depth + 1) * .14) * (lit ? 1.12 : 1);
            item.chip.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
            item.chip.style.opacity = String(state.spread * (lit ? .62 + (depth + 1) * .19 : .18 + (depth + 1) * .08));
            item.chip.style.zIndex = depth > 0 ? "2" : "1";
          }
        }
      };
      measure(); activate(0);
      gsap.ticker.add(tick);
      ScrollTrigger.addEventListener("refresh", measure);
      gsap.fromTo(state, { spread: 0 }, { spread: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: section, start: "top 70%", toggleActions: "play none none reverse" } });
      gsap.timeline({ scrollTrigger: pinned(section, () => innerHeight * 2.2, 3, {
        snap: { snapTo: 1 / 3, duration: { min: .25, max: .7 }, ease: "power2.inOut", delay: .1 },
        onUpdate: self => activate(Math.round(self.progress * 3)),
      }) }).to({}, { duration: 1 });
      const pause = () => gsap.to(state, { pace: .12, duration: .5 }), resume = () => gsap.to(state, { pace: 1, duration: .8 });
      all(section, "[data-chip]").forEach(chip => { chip.addEventListener("pointerenter", pause); chip.addEventListener("pointerleave", resume); });
      return () => {
        gsap.ticker.remove(tick);
        ScrollTrigger.removeEventListener("refresh", measure);
        all(section, "[data-chip]").forEach(chip => { chip.removeEventListener("pointerenter", pause); chip.removeEventListener("pointerleave", resume); chip.removeAttribute("style"); });
        groups.forEach(group => group.removeAttribute("data-active"));
        delete section.dataset.enhanced; delete section.dataset.group;
      };
    }

    // ── Projects: a one-screen stack; each screen rises as the previous one flies past ──
    function projectStack(section: HTMLElement) {
      section.dataset.enhanced = "true";
      const cards = all(section, "[data-project-card]"), counter = section.querySelector<HTMLElement>("[data-project-index]"), bar = section.querySelector("[data-project-bar]");
      const deck = section.querySelector("[data-deck]");
      let current = -1;
      const show = (index: number) => {
        if (index === current) return;
        current = index; focusOnly(cards, index); section.dataset.project = String(index);
        if (counter) counter.textContent = String(index + 1).padStart(2, "0");
      };
      show(0);
      gsap.set(cards, { transformPerspective: 1400, transformOrigin: "50% 100%" });
      gsap.set(cards.slice(1), { rotationX: 65, yPercent: 35, z: -260, opacity: 0 });
      gsap.from(deck, { rotationX: 55, yPercent: 20, opacity: 0, transformPerspective: 1400, transformOrigin: "50% 100%", ease: "power2.out", scrollTrigger: { trigger: section, start: "top 85%", end: "top 15%", scrub: .7 } });
      const steps = cards.length - 1;
      const stack = gsap.timeline({ scrollTrigger: pinned(section, () => innerHeight * steps * 1.05, 2, {
        snap: { snapTo: 1 / steps, duration: { min: .25, max: .7 }, ease: "power2.inOut", delay: .1 },
        onUpdate: self => show(Math.round(self.progress * steps)),
      }) });
      if (bar) stack.fromTo(bar, { scaleX: 1 / cards.length }, { scaleX: 1, ease: "none", duration: steps }, 0);
      for (let i = 1; i < cards.length; i++) {
        stack.to(cards[i - 1], { yPercent: -28, z: 260, rotationX: -16, opacity: 0, duration: .7, ease: "power2.in" }, i - 1)
          .to(cards[i], { rotationX: 0, yPercent: 0, z: 0, opacity: 1, duration: .75, ease: "power2.out" }, i - .85)
          .from(cards[i].querySelectorAll("[data-tag]"), { scale: 0, opacity: 0, duration: .25, stagger: .05, ease: "back.out(2.2)" }, i - .3);
      }
      return () => { release(cards); delete section.dataset.enhanced; delete section.dataset.project; };
    }

    // ── Experience: a year track fills while each role (with its skills) swaps in ───────
    function experienceTrack(section: HTMLElement) {
      section.dataset.enhanced = "true";
      const roles = all(section, "[data-role]"), markers = all(section, "[data-marker]"), fill = section.querySelector("[data-track-fill]");
      let current = -1;
      const show = (index: number) => {
        if (index === current) return;
        current = index; focusOnly(roles, index);
        markers.forEach((marker, i) => { marker.toggleAttribute("data-active", i === index); marker.toggleAttribute("data-past", i < index); });
      };
      show(0);
      gsap.set(roles, { transformPerspective: 1000, transformOrigin: "50% 0%" });
      gsap.set(roles.slice(1), { yPercent: 30, rotationX: -40, opacity: 0 });
      const steps = roles.length - 1;
      const track = gsap.timeline({ scrollTrigger: pinned(section, () => innerHeight * steps * .6, 1, {
        snap: { snapTo: 1 / steps, duration: { min: .2, max: .6 }, ease: "power2.inOut", delay: .1 },
        onUpdate: self => show(Math.round(self.progress * steps)),
      }) });
      if (fill) track.fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: steps }, 0);
      for (let i = 1; i < roles.length; i++) {
        track.to(roles[i - 1], { yPercent: -22, rotationX: 30, opacity: 0, duration: .6, ease: "power2.in" }, i - 1)
          .to(roles[i], { yPercent: 0, rotationX: 0, opacity: 1, duration: .65, ease: "power2.out" }, i - .8)
          .from(roles[i].querySelectorAll("[data-skill]"), { y: 18, scale: .5, opacity: 0, duration: .25, stagger: .04, ease: "back.out(2.2)" }, i - .35);
      }
      return () => { release(roles); markers.forEach(marker => { marker.removeAttribute("data-active"); marker.removeAttribute("data-past"); }); delete section.dataset.enhanced; };
    }

    ScrollTrigger.addEventListener("refresh", measureAnchor);
    measureAnchor();
    let disposed = false;
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

    return () => {
      disposed = true;
      wave.current = () => {};
      cleanups.forEach(remove => remove());
      ScrollTrigger.removeEventListener("refresh", measureAnchor);
      media.revert();
      context.revert();
      Object.assign(motion.current, { wave: 0, orbit: 0, speed: 0 });
    };
  }, [root, animate, started]);

  return { motion, wave };
}
