"use client";

import { useRef, useState } from "react";
import ParticleStage from "../particles/ParticleStage";
import { useIntroScroll } from "../motion/useIntroScroll";
import styles from "../../app/page.module.css";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState("Work");
  const [menuOpen, setMenuOpen] = useState(false);
  const [animated, setAnimated] = useState(false);
  const motion = useIntroScroll(root, animated);
  function openPreview(section: string) {
    setPreview(section);
    setMenuOpen(false);
    dialog.current?.showModal();
  }

  return (
    <div ref={root} className={`${styles.story} ${animated ? styles.animated : ""}`}>
      <div className={styles.viewport}>
        <a className={styles.skip} href="#intro">Skip to introduction</a>
        <ParticleStage motion={motion} onAnimated={setAnimated} />
        <header className={styles.header}>
          <a className={styles.brand} href="#intro">Omar Al Akara<span aria-hidden="true">.</span></a>
          <button className={styles.menuButton} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close −" : "Menu +"}</button>
          <nav id="main-nav" aria-label="Main navigation" className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
            {["Work", "Skills", "About"].map((section) => <button key={section} onClick={() => openPreview(section)}>{section}</button>)}
            <a href="mailto:omar.alakara3@gmail.com">Contact <span aria-hidden="true">↗</span></a>
          </nav>
        </header>
        <main id="intro" className={styles.hero}>
          <div className={styles.copy} data-chapter="opening">
            <h1><span className={styles.textLine}><span data-reveal-line>Creative development.</span></span><span className={`${styles.textLine} ${styles.headingAccent}`}><span data-reveal-line>Real-world impact.</span></span></h1>
            <p data-reveal-detail>I build interactive websites, e-commerce<br className={styles.desktopBreak} /> experiences, and useful automations.</p>
            <div className={styles.actions}>
              <button data-reveal-detail onClick={() => openPreview("Work")} className={styles.workLink}>Explore my work <span aria-hidden="true">↗</span></button>
              <a data-reveal-detail href="mailto:omar.alakara3@gmail.com">Get in touch <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <section className={styles.chapter} data-chapter="drift" aria-labelledby="drift-heading" inert>
            <span data-reveal-detail className={styles.eyebrow}>A world of possibilities</span>
            <h2 id="drift-heading"><span className={styles.textLine}><span data-reveal-line>Ideas in motion.</span></span><span className={`${styles.textLine} ${styles.headingAccent}`}><span data-reveal-line>Purpose in every detail.</span></span></h2>
            <p data-reveal-detail>From the first spark to the final interaction.<br className={styles.desktopBreak} /> Websites, commerce, and automation — built to work together.</p>
          </section>
          <section className={`${styles.chapter} ${styles.satelliteCopy}`} data-chapter="satellite" aria-labelledby="satellite-heading" inert>
            <span data-reveal-detail className={styles.eyebrow}>Built to connect</span>
            <h2 id="satellite-heading"><span className={styles.textLine}><span data-reveal-line>Your next idea.</span></span><span className={`${styles.textLine} ${styles.headingAccent}`}><span data-reveal-line>A little further.</span></span></h2>
            <p data-reveal-detail>Thoughtful design. Useful technology.<br />Let’s turn what you have in mind into something real.</p>
            <div className={styles.actions}>
              <button data-reveal-detail onClick={() => openPreview("Work")} className={styles.workLink}>Explore my work <span aria-hidden="true">↗</span></button>
              <a data-reveal-detail href="mailto:omar.alakara3@gmail.com">Let’s talk <span aria-hidden="true">↗</span></a>
            </div>
          </section>
        </main>
        <footer className={styles.footer}>
          <span className={styles.origin}><i /> From Lebanon, to everywhere.</span>
        </footer>
      </div>
      <dialog ref={dialog} className={styles.dialog} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <button className={styles.dialogClose} aria-label="Close preview" onClick={() => dialog.current?.close()}>×</button>
        <p className={styles.dialogLabel}>THE NEXT CHAPTER</p>
        <h2>{preview === "Work" ? "Selected work is on its way." : `${preview}, coming into focus.`}</h2>
        <p>For now, explore my experience in my CV — or get in touch to talk about your next project.</p>
        <a href="/Omar-Al-Akara-CV.pdf" target="_blank" rel="noopener noreferrer">View my CV ↗</a>
      </dialog>
    </div>
  );
}
