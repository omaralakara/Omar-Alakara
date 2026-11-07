"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type IntroMotion = { progress: number };

// One reversible timeline keeps typography and WebGL on the same scroll clock.
// Native scrolling and the CSS sticky viewport still provide the scroll runway.
export function useIntroScroll(root: RefObject<HTMLElement | null>, enabled: boolean) {
  const motion = useRef<IntroMotion>({ progress: 0 });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    motion.current.progress = 0;
    el.dataset.progress = "0.000";
    const chapters = Array.from(el.querySelectorAll<HTMLElement>("[data-chapter]"));
    chapters.forEach(chapter => { chapter.inert = chapter.dataset.chapter !== "opening"; });
    if (!enabled) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let refreshFrame = 0;
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const [opening, drift, satellite] = chapters;
      const lines = (chapter: HTMLElement) => chapter.querySelectorAll("[data-reveal-line]");
      const details = (chapter: HTMLElement) => chapter.querySelectorAll("[data-reveal-detail]");
      const playhead = { progress: 0 };
      gsap.set([drift, satellite], { autoAlpha: 0 });
      gsap.set([...lines(drift), ...lines(satellite)], { yPercent: 112, rotate: 2, autoAlpha: 0 });
      gsap.set([...details(drift), ...details(satellite)], { y: 22, autoAlpha: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${Math.max(1, el.offsetHeight - window.innerHeight)}`,
          scrub: .65,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const p = playhead.progress;
          motion.current.progress = p;
          el.dataset.progress = p.toFixed(3);
          opening.inert = p > .18;
          drift.inert = p < .29 || p > .59;
          satellite.inert = p < .85;
        },
      });

      timeline
        .to(playhead, { progress: 1, duration: 1, ease: "none" }, 0)
        .to(lines(opening), { yPercent: -112, rotate: -2, autoAlpha: 0, duration: .14, stagger: .025 }, .065)
        .to(details(opening), { y: -24, autoAlpha: 0, duration: .1, stagger: .018 }, .09)
        .to(opening, { autoAlpha: 0, duration: .025 }, .235)
        .to(drift, { autoAlpha: 1, duration: .025 }, .195)
        .to(lines(drift), { yPercent: 0, rotate: 0, autoAlpha: 1, duration: .12, stagger: .025, ease: "power3.out" }, .215)
        .to(details(drift), { y: 0, autoAlpha: 1, duration: .09, stagger: .045, ease: "power2.out" }, .225)
        .to(lines(drift), { yPercent: -112, rotate: -2, autoAlpha: 0, duration: .105, stagger: .02 }, .535)
        .to(details(drift), { y: -22, autoAlpha: 0, duration: .09, stagger: .02 }, .545)
        .to(drift, { autoAlpha: 0, duration: .025 }, .66)
        .to(satellite, { autoAlpha: 1, duration: .025 }, .725)
        .to(lines(satellite), { yPercent: 0, rotate: 0, autoAlpha: 1, duration: .135, stagger: .025, ease: "power3.out" }, .745)
        .to(details(satellite), { y: 0, autoAlpha: 1, duration: .095, stagger: .045, ease: "power2.out" }, .765);

      const scheduleRefresh = () => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => timeline.scrollTrigger?.refresh());
      };
      const observer = new ResizeObserver(scheduleRefresh);
      observer.observe(el);
      window.addEventListener("resize", scheduleRefresh);
      timeline.scrollTrigger?.refresh();
      return () => {
        cancelAnimationFrame(refreshFrame);
        observer.disconnect();
        window.removeEventListener("resize", scheduleRefresh);
      };
    }, el);
    return () => media.revert();
  }, [root, enabled]);
  return motion;
}
