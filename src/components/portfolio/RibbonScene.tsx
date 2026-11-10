"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { RibbonMotion } from "./RibbonCanvas";
import styles from "./Portfolio.module.css";

const RibbonCanvas = dynamic(() => import("./RibbonCanvas"), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function RibbonScene({ motion, enabled, paused }: { motion: RefObject<RibbonMotion>; enabled: boolean; paused: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);
  useEffect(() => {
    const media = matchMedia("(max-width: 760px)");
    const update = () => setCompact(media.matches);
    update(); media.addEventListener("change", update);
    let intersecting = true;
    const visibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; visibility(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); media.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (!enabled || ready || failed) return;
    const timer = setTimeout(onError, 15000);
    return () => clearTimeout(timer);
  }, [enabled, ready, failed, onError]);
  const interactive = enabled && !failed;
  return <div className={styles.ribbonScene} ref={root} data-ribbon-scene={interactive && ready ? "interactive" : "static"} aria-hidden="true">
    <div className={styles.ribbonGlow} />
    <img className={`${styles.ribbonFallback} ${interactive && ready ? styles.fallbackHidden : ""}`} src="/ribbon.svg" width="700" height="700" alt="" />
    {interactive && <SceneBoundary onError={onError}><div className={styles.canvas}><RibbonCanvas compact={compact} active={visible && !paused} motion={motion} onReady={onReady} onError={onError} /></div></SceneBoundary>}
  </div>;
}
