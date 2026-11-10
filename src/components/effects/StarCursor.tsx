"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type Dust = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string };
const colors = ["#9fb8ff", "#b9a3ff", "#7ea4ff", "#f0c79a"];
const interactive = "a, button, [role='button'], summary";

/**
 * Soft, space-themed cursor for fine pointers: a glowing core, a ring that lags and blooms over
 * anything clickable, and a short stardust trail drawn on one small canvas. The render loop only
 * runs while dust is visible.
 */
export default function StarCursor() {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null), ripple = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const context = canvas.current!.getContext("2d")!;
    const dust: Dust[] = [];
    let frame = 0, last = { x: -100, y: -100 }, visible = false;
    document.documentElement.classList.add("has-star-cursor");
    const ringX = gsap.quickTo(ring.current, "x", { duration: .38, ease: "power3" }), ringY = gsap.quickTo(ring.current, "y", { duration: .38, ease: "power3" });
    gsap.set([dot.current, ring.current, ripple.current], { xPercent: -50, yPercent: -50, opacity: 0 });

    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 2);
      canvas.current!.width = innerWidth * ratio; canvas.current!.height = innerHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const emit = (x: number, y: number, count: number, spread: number) => {
      for (let i = 0; i < count && dust.length < 180; i++) {
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * spread;
        dust.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 8, life: 0, max: .7 + Math.random() * .6, size: .8 + Math.random() * 1.8, color: colors[(Math.random() * colors.length) | 0] });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };
    let previous = performance.now();
    function draw(now: number) {
      const dt = Math.min(.05, (now - previous) / 1000); previous = now;
      context.clearRect(0, 0, innerWidth, innerHeight);
      context.globalCompositeOperation = "lighter";
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96;
        if (p.life >= p.max) { dust.splice(i, 1); continue; }
        const fade = 1 - p.life / p.max;
        const glow = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.2);
        glow.addColorStop(0, p.color); glow.addColorStop(1, "transparent");
        context.globalAlpha = fade * .85; context.fillStyle = glow;
        context.beginPath(); context.arc(p.x, p.y, p.size * 3.2 * (.6 + fade * .4), 0, Math.PI * 2); context.fill();
      }
      frame = dust.length ? requestAnimationFrame(draw) : 0;
      if (!frame) context.clearRect(0, 0, innerWidth, innerHeight);
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!visible) { visible = true; gsap.to([dot.current, ring.current], { opacity: 1, duration: .3 }); gsap.set(ring.current, { x: event.clientX, y: event.clientY }); }
      gsap.set(dot.current, { x: event.clientX, y: event.clientY });
      ringX(event.clientX); ringY(event.clientY);
      const distance = Math.hypot(event.clientX - last.x, event.clientY - last.y);
      if (distance > 7) { emit(event.clientX, event.clientY, distance > 40 ? 2 : 1, 14); last = { x: event.clientX, y: event.clientY }; }
    };
    const over = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest(interactive) : null;
      root.current!.dataset.hover = target ? "true" : "false";
      gsap.to(ring.current, { scale: target ? 1.9 : 1, backgroundColor: target ? "rgba(126,164,255,.12)" : "rgba(126,164,255,0)", borderColor: target ? "rgba(240,189,132,.7)" : "rgba(185,200,255,.45)", duration: .35, ease: "power3.out" });
      gsap.to(dot.current, { scale: target ? .4 : 1, duration: .3 });
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      gsap.fromTo(ripple.current, { x: event.clientX, y: event.clientY, scale: .4, opacity: .7 }, { scale: 3.2, opacity: 0, duration: .9, ease: "power2.out" });
      gsap.fromTo(ring.current, { scale: .8 }, { scale: root.current!.dataset.hover === "true" ? 1.9 : 1, duration: .5, ease: "elastic.out(1, .5)" });
      emit(event.clientX, event.clientY, 14, 70);
      if (!(event.target instanceof Element && event.target.closest(interactive))) window.dispatchEvent(new CustomEvent("portfolio:burst", { detail: { x: event.clientX, y: event.clientY } }));
    };
    const leave = () => { visible = false; gsap.to([dot.current, ring.current], { opacity: 0, duration: .3 }); };

    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerover", over, { passive: true });
    addEventListener("pointerdown", down, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-star-cursor");
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
      removeEventListener("pointerover", over);
      removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave);
      removeEventListener("blur", leave);
      gsap.killTweensOf([dot.current, ring.current, ripple.current]);
    };
  }, []);

  return <div ref={root} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none" }}>
    <canvas ref={canvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    <div ref={ripple} style={{ position: "absolute", left: 0, top: 0, width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(185,200,255,.6)" }} />
    <div ref={ring} style={{ position: "absolute", left: 0, top: 0, width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(185,200,255,.45)" }} />
    <div ref={dot} style={{ position: "absolute", left: 0, top: 0, width: 6, height: 6, borderRadius: "50%", background: "#eef1ff", boxShadow: "0 0 12px 3px rgba(126,164,255,.75)" }} />
  </div>;
}
