"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { IntroMotion } from "../motion/useIntroScroll";
import styles from "./ParticleStage.module.css";

const SharedCanvas = dynamic(() => import("./SharedCanvas"), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function ParticleStage({ motion, onAnimated }: { motion: RefObject<IntroMotion>; onAnimated: (value: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const onReady = useCallback(() => { setReady(true); setProgress(100); }, []);
  const onError = useCallback(() => { setFailed(true); setReady(false); setEntered(true); }, []);
  const onProgress = useCallback((amount: number) => setProgress(amount), []);

  useEffect(() => { onAnimated(ready && !reduced && !failed); }, [ready, reduced, failed, onAnimated]);
  useEffect(() => { if (!ready) return; const fade = setTimeout(() => setEntered(true), 550); return () => clearTimeout(fade); }, [ready]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 900px)");
    const updateMotion = () => { setReduced(media.matches); setEnabled(!media.matches); setReady(false); if (media.matches) setEntered(true); };
    const updateSize = () => setCompact(mobile.matches);
    updateMotion(); updateSize();
    media.addEventListener("change", updateMotion);
    mobile.addEventListener("change", updateSize);
    let inView = true;
    const visibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; visibility(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", updateMotion); mobile.removeEventListener("change", updateSize); };
  }, []);
  useEffect(() => {
    if (!enabled || ready || failed) return;
    const timeout = setTimeout(onError, 10000);
    return () => clearTimeout(timeout);
  }, [enabled, ready, failed, onError]);

  const loading = enabled && !entered && !failed && !reduced;
  return <>
    <div ref={root} className={styles.stage} data-scene={ready ? "interactive" : "static"}>
      <div className={styles.haze} />
      <img className={`${styles.fallback} ${ready ? styles.fallbackHidden : ""}`} src="/particles/earth-fallback.svg" width="600" height="600" alt="A floating blue and violet particle Earth with Lebanon highlighted in gold." />
      {enabled && !failed && <SceneBoundary onError={onError}><div className={styles.canvas} aria-hidden="true"><SharedCanvas compact={compact} active={visible} motion={motion} onReady={onReady} onError={onError} onProgress={onProgress} /></div></SceneBoundary>}
      <div className={styles.readability} />
    </div>
    {loading && <div className={`${styles.loader} ${ready ? styles.loaderDone : ""}`} role="status" aria-live="polite">
      <div className={styles.loaderOrbit} aria-hidden="true"><i /><i /><i /></div>
      <p>Omar Al Akara<span>.</span></p>
      <span className={styles.loaderCaption}>A world taking shape</span>
      <div className={styles.track} aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(.02, progress / 100)})` }} /></div>
      <button onClick={onError}>Enter without animation ↗</button>
    </div>}
  </>;
}
