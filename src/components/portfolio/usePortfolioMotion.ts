"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RibbonMotion } from "./RibbonCanvas";

export function usePortfolioMotion(root: RefObject<HTMLDivElement | null>, motion: RefObject<RibbonMotion>, enabled: boolean) {
  useEffect(() => {
    const page = root.current;
    if (!page || !enabled) { motion.current.scroll = 0; return; }
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      gsap.from("[data-intro-line]", { yPercent: 110, rotate: 3, duration: 1.2, stagger: .12, ease: "power4.out", clearProps: "transform" });
      gsap.from("[data-intro-detail]", { y: 18, opacity: 0, duration: .8, stagger: .1, delay: .35, clearProps: "all" });
      gsap.to(motion.current, { scroll: 1, ease: "none", scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: .6 } });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(element => {
        gsap.from(element, { y: 45, opacity: 0, duration: .95, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 91%", once: true }, clearProps: "all" });
      });
      media.add("(min-width: 900px) and (min-height: 650px)", () => {
        const gallery = page.querySelector<HTMLElement>("[data-gallery]")!;
        const cards = Array.from(page.querySelectorAll<HTMLElement>("[data-project-card]"));
        const progress = page.querySelector<HTMLElement>("[data-gallery-progress]");
        const number = page.querySelector<HTMLElement>("[data-gallery-number]");
        const buttons = Array.from(page.querySelectorAll<HTMLButtonElement>("[data-project-jump]"));
        gallery.dataset.enhanced = "true";
        gsap.set(cards, { transformPerspective: 1600, transformOrigin: "50% 80%" });
        gsap.set(cards[0], { yPercent: 8, rotationX: 12, rotationZ: -3, scale: .93 });
        cards.slice(1).forEach((card, i) => gsap.set(card, { yPercent: 110 + i * 8, xPercent: 12, rotationX: 38, rotationZ: 10, scale: .9 }));
        const playhead = { value: 0 };
        let current = -1;
        const timeline = gsap.timeline({ scrollTrigger: {
          id: "selected-work", trigger: gallery, start: "top top", end: () => `+=${window.innerHeight * 2.8}`, pin: true, scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
        } });
        timeline.to(playhead, { value: 3, duration: 3, ease: "none", onUpdate: () => {
          const index = Math.min(2, Math.floor(playhead.value));
          if (progress) progress.style.transform = `scaleX(${Math.max(.04, playhead.value / 3)})`;
          if (index === current) return;
          current = index;
          gallery.dataset.currentProject = String(index);
          if (number) number.textContent = `0${index + 1}`;
          cards.forEach((card, i) => { card.inert = i !== index; card.setAttribute("aria-hidden", String(i !== index)); });
          buttons.forEach((button, i) => { button.setAttribute("aria-pressed", String(i === index)); });
        } }, 0);
        timeline.to(cards[0], { yPercent: 0, rotationX: 0, rotationZ: 0, scale: 1, duration: .35, ease: "power2.out" }, 0);
        cards.slice(1).forEach((card, i) => {
          const at = i + .65;
          timeline.to(cards[i], { yPercent: -8, xPercent: -5, rotationZ: -5, rotationX: 8, scale: .89, opacity: .35, duration: .65, ease: "power2.inOut" }, at);
          timeline.to(card, { yPercent: 0, xPercent: 0, rotationX: 0, rotationZ: 0, scale: 1, duration: .7, ease: "power3.inOut" }, at);
        });
        const handlers = buttons.map((button, index) => {
          const handler = () => {
            const trigger = timeline.scrollTrigger!;
            window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * ((index + .42) / 3), behavior: "smooth" });
          };
          button.addEventListener("click", handler);
          return { button, handler };
        });
        return () => {
          delete gallery.dataset.enhanced; delete gallery.dataset.currentProject;
          cards.forEach(card => { card.inert = false; card.removeAttribute("aria-hidden"); });
          handlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
          if (progress) progress.style.transform = "";
        };
      });
      media.add("(max-width: 899px), (max-height: 649px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-project-card]").forEach(card => {
          gsap.from(card, { y: 65, rotationX: 7, scale: .96, transformPerspective: 1400, ease: "none", scrollTrigger: { trigger: card, start: "top 98%", end: "top 55%", scrub: .5 }, clearProps: "transform" });
        });
      });
    }, page);
    let disposed = false;
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); context.revert(); motion.current.scroll = 0; };
  }, [root, motion, enabled]);
}
