"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { StoryMotion } from "../story/useStoryScroll";
import styles from "./ParticleStage.module.css";

const SharedCanvas = dynamic(() => import("./SharedCanvas"), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

type Props = { motion: RefObject<StoryMotion>; onAnimated: (value: boolean) => void; onSettled: () => void };

/**
 * Fixed, full-viewport 3D layer behind the page. Loads only when motion is allowed;
 * otherwise the page shows each section's static artwork instead.
 */
export default function ParticleStage({ motion, onAnimated, onSettled }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const enabled = reduced === false && !failed;
  const onReady = useCallback(() => { setReady(true); setProgress(100); }, []);
  const onError = useCallback(() => { setFailed(true); setReady(false); setEntered(true); }, []);
  const onProgress = useCallback((amount: number) => setProgress(amount), []);

  useEffect(() => { onAnimated(enabled && ready); }, [enabled, ready, onAnimated]);
  useEffect(() => { if (!enabled) setReady(false); }, [enabled]);
  useEffect(() => { if (!ready) return; const fade = setTimeout(() => setEntered(true), 550); return () => clearTimeout(fade); }, [ready]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 900px)");
    const updateMotion = () => { setReduced(media.matches); if (media.matches) setEntered(true); };
    const updateSize = () => setCompact(mobile.matches);
    updateMotion(); updateSize();
    media.addEventListener("change", updateMotion);
    mobile.addEventListener("change", updateSize);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => { document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", updateMotion); mobile.removeEventListener("change", updateSize); };
  }, []);
  useEffect(() => {
    if (!enabled || ready) return;
    const timeout = setTimeout(onError, 10000);
    return () => clearTimeout(timeout);
  }, [enabled, ready, onError]);

  const loading = enabled && !entered;
  const settled = reduced !== null && !loading;
  useEffect(() => { if (settled) onSettled(); }, [settled, onSettled]);
  return <>
    <div ref={root} className={styles.stage} data-scene={enabled && ready ? "interactive" : "static"} aria-hidden="true">
      <div className={styles.haze} />
      {enabled && <SceneBoundary onError={onError}><div className={styles.canvas}><SharedCanvas compact={compact} active={visible} motion={motion} onReady={onReady} onError={onError} onProgress={onProgress} /></div></SceneBoundary>}
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
