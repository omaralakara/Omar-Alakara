"use client";

import { useEffect, useRef, useState } from "react";
import RibbonScene from "./RibbonScene";
import type { RibbonMotion } from "./RibbonCanvas";
import { projects, type Project } from "./projects";
import { usePortfolioMotion } from "./usePortfolioMotion";
import styles from "./Portfolio.module.css";

function Arrow({ diagonal = true }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-7-7 7 7-7 7"} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function ProjectArt({ theme }: { theme: Project["theme"] }) {
  if (theme === "commerce") return <div className={styles.laptopArt} aria-hidden="true">
    <div className={styles.laptopShadow} />
    <div className={styles.laptop}>
      <div className={styles.laptopScreen}><div className={styles.screenOrb} /><span>Find your<br /><b>next.</b></span><small>LAPTOPS KING</small></div>
      <div className={styles.laptopBase}><i /></div>
    </div>
    <span className={styles.artWord}>NEXT.</span>
  </div>;
  if (theme === "web") return <div className={styles.webArt} aria-hidden="true">
    <div className={styles.webWindow}><div className={styles.windowBar}><span>● ● ●</span><span>made to feel different ↗</span></div><div className={styles.windowContent}><span>Ideas,<br /><em>in motion.</em></span><div className={styles.webFlower}>{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 18}deg)` }} />)}</div><small>DESIGN MEETS DEVELOPMENT</small></div></div>
    <div className={styles.cursorLabel}><svg viewBox="0 0 30 36"><path d="m2 2 23 19-12 1-6 10Z" fill="#1d251b" stroke="#e4f9ac" strokeWidth="2" /></svg><span>make it yours</span></div>
  </div>;
  return <div className={styles.fintechArt} aria-hidden="true"><div className={styles.fintechGrid} /><div className={styles.dataStack}>{[0, 1, 2, 3].map(i => <div key={i} className={styles.dataLayer}><i /><i /><i /><i /><span>{i === 3 ? "f Z" : ""}</span></div>)}</div><span className={styles.connectionLine} /><div className={styles.fintechCaption}><span>INTERFACE</span><i /><span>INTEGRATION</span><i /><span>INFRASTRUCTURE</span></div></div>;
}

const experience = [
  ["Synergi BPO", "Web Developer & SEO Specialist", "2026 — now"],
  ["Laptops King", "Shopify Growth Specialist", "2026 — now"],
  ["fazeZERO", "Software Developer", "2025 — 2026"],
  ["CIS College", "Computer Instructor", "2025 — 2026"],
  ["Sereni", "Shopify Developer", "2024"],
  ["Loyabi", "Shopify Developer", "2022 — 2024"],
];

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<RibbonMotion>({ scroll: 0, form: 0 });
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [form, setForm] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const animated = motionAllowed && !paused;
  usePortfolioMotion(root, motion, animated);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!selected || !dialog.current) return;
    const previousOverflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);
  const openProject = (project: Project) => {
    lastFocused.current = document.activeElement as HTMLElement;
    setSelected(project);
  };
  const closeProject = () => dialog.current?.close();
  const onClose = () => { setSelected(null); lastFocused.current?.focus({ preventScroll: true }); };

  return <div ref={root} className={styles.portfolio}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.header}>
      <a href="#top" className={styles.wordmark} aria-label="Omar Al Akara, home">omar<span>✳</span></a>
      <span className={styles.headerNote}>A developer’s mind.<br />A creative’s eye.</span>
      <nav aria-label="Main navigation"><a href="#work">Work <span>03</span></a><a href="#about">About</a><a href="#contact" className={styles.navContact}>Let’s talk <Arrow /></a></nav>
    </header>

    <main id="main">
      <section id="top" className={styles.hero} data-hero aria-labelledby="intro-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} data-intro-detail><i /> OMAR AL AKARA — WEB DEVELOPER</p>
          <h1 id="intro-title"><span className={styles.lineMask}><span data-intro-line>Good code.</span></span><span className={styles.lineMask}><span data-intro-line>Great <em>feeling.</em></span></span></h1>
          <div className={styles.heroDescription} data-intro-detail><span className={styles.littleStar} aria-hidden="true">✳</span><p>I build websites and digital experiences<br className={styles.desktopBreak} /> with purpose, personality, and a creative edge.</p></div>
          <a href="#work" className={styles.primaryLink} data-intro-detail><span>Explore my work</span><span className={styles.circleArrow}><Arrow diagonal={false} /></span></a>
        </div>
        <div className={styles.heroArtwork}><RibbonScene motion={motion} enabled={motionAllowed} paused={paused || !!selected} /></div>
        <div className={styles.heroBottom} data-intro-detail><span>BASED IN LEBANON<br /><b>Building for everywhere.</b></span><div className={styles.artControl}><span>AN EXPLORATION IN FORM</span><button disabled={!animated} aria-pressed={form} onClick={() => { motion.current.form = form ? 0 : 1; setForm(!form); }}>{form ? "Bring it back" : "Change the form"} <Arrow /></button></div><a href="#work" className={styles.scrollCue}>SCROLL TO EXPLORE <span>↓</span></a></div>
      </section>

      <section id="work" className={styles.work} aria-labelledby="work-title">
        <div className={styles.workHeading} data-reveal><p className={styles.eyebrow}>01 / SELECTED EXPERIENCE</p><div><h2 id="work-title">Made to <em>matter.</em></h2><p>A few places I’ve turned<br />ideas into working experiences.</p></div></div>
        <div className={styles.gallery} data-gallery>
          <div className={styles.galleryTop}><span>SELECTED WORK</span><span><b data-gallery-number>01</b><i />03</span><a href="#about">Skip to about <span>↘</span></a></div>
          <div className={styles.cards}>
            {projects.map(project => <article key={project.id} id={project.id} data-project-card className={`${styles.projectCard} ${styles[project.theme]}`} aria-labelledby={`${project.id}-title`}>
              <div className={styles.projectTop}><span>{project.category}</span><span>{project.number} / 03</span></div>
              <div className={styles.projectBody}><div className={styles.projectCopy}><p className={styles.projectClient}>{project.name}</p><h3 id={`${project.id}-title`}>{project.headline.split("\n").map(line => <span key={line}>{line}</span>)}</h3><p className={styles.projectSummary}>{project.summary}</p><button className={styles.projectLink} onClick={() => openProject(project)} aria-label={`Explore my work at ${project.name}`}>Explore my contribution <span><Arrow /></span></button></div><ProjectArt theme={project.theme} /></div>
              <div className={styles.projectBottom}><div>{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><span>ILLUSTRATIVE COVER</span></div>
            </article>)}
          </div>
          <div className={styles.galleryBottom}><div className={styles.projectTabs} aria-label="Choose a project">{projects.map((project, index) => <button key={project.id} data-project-jump={index} aria-pressed={index === 0} aria-label={`Show ${project.name}`}>{project.number}<span>{project.name}</span></button>)}</div><span className={styles.galleryHint}>KEEP SCROLLING <span>↓</span></span></div>
          <div className={styles.galleryTrack} aria-hidden="true"><span data-gallery-progress /></div>
        </div>
      </section>

      <section id="about" className={styles.about} aria-labelledby="about-title">
        <div className={styles.aboutTop} data-reveal><p className={styles.eyebrow}>02 / THE PERSON BEHIND THE PIXELS</p><h2 id="about-title">Curious by nature.<br />Developer by <em>practice.</em></h2></div>
        <div className={styles.aboutBody}><div className={styles.aboutIdentity} data-reveal><div className={styles.identityMark} aria-hidden="true">oa<span>✳</span></div><p>Omar Al Akara<span>Web developer · Lebanon</span></p><a href="/Omar-Al-Akara-CV.pdf" download className={styles.textLink}>Download my CV <Arrow /></a></div><div className={styles.aboutText} data-reveal><p>I care about how a website works.<br /><span>And how it makes people feel.</span></p><p>My work moves between interactive websites, Shopify storefronts, and custom WordPress builds. I connect the visual details with the practical ones: performance, discovery, integrations, and the workflows behind the scenes.</p><p>I’ve also worked on fintech applications and taught development and databases. Different settings, the same instinct: understand the problem, make something useful, keep improving it.</p><div className={styles.capabilities}><div><span>01</span><h3>Web experiences</h3><p>React · Next.js · GSAP · WordPress</p></div><div><span>02</span><h3>Commerce & discovery</h3><p>Shopify · Liquid · SEO · Performance</p></div><div><span>03</span><h3>Connected systems</h3><p>REST APIs · AI integrations · Automation</p></div></div></div></div>
        <div className={styles.experience}><div data-reveal><p className={styles.eyebrow}>ALONG THE WAY</p><p>Different teams.<br />A wider perspective.</p></div><div className={styles.experienceRows}>{experience.map(([company, role, date]) => <div className={styles.experienceRow} key={company} data-reveal><h3>{company}</h3><span>{role}</span><span>{date}</span></div>)}</div></div>
      </section>

      <section className={styles.playNote} aria-label="About this portfolio" data-reveal><span className={styles.playGlyph} aria-hidden="true">✳</span><p>This portfolio is a little experiment, too.<span>A custom 3D ribbon, a playful scroll, and a lot of attention to the details.</span></p><span className={styles.playTech}>THREE.JS / REACT THREE FIBER / GSAP</span></section>

      <section id="contact" className={styles.contact} aria-labelledby="contact-title"><div className={styles.contactTop} data-reveal><p className={styles.eyebrow}>03 / GOOD THINGS START WITH A CONVERSATION</p><p>Have a project in mind,<br />or a place on your team?</p></div><a className={styles.contactHeadline} href="mailto:omar.alakara3@gmail.com" data-reveal><h2 id="contact-title">Let’s make<br />something <em>great.</em></h2><span><Arrow /></span></a><div className={styles.contactBottom}><a href="mailto:omar.alakara3@gmail.com">omar.alakara3@gmail.com <Arrow /></a><a href="https://www.linkedin.com/in/omar-alakara" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href="https://github.com/omaralakara" target="_blank" rel="noreferrer">GitHub <Arrow /></a></div></section>
    </main>

    <footer className={styles.footer}><a href="#top">OMAR AL AKARA <span>© {new Date().getFullYear()}</span></a><button aria-pressed={!animated} onClick={() => setPaused(value => !value)} disabled={!motionAllowed}><i className={animated ? styles.motionDot : ""} />{!motionAllowed ? "Reduced motion" : animated ? "Motion on" : "Motion off"}</button><a href="#top">BACK TO TOP ↑</a></footer>

    <dialog ref={dialog} className={styles.projectDialog} onClose={onClose} onClick={event => { if (event.target === dialog.current) { const bounds = dialog.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeProject(); } }} aria-labelledby="project-dialog-title">
      {selected && <><div className={styles.dialogTop}><span>{selected.category}</span><button onClick={closeProject} aria-label="Close project details" autoFocus>Close <span>×</span></button></div><p className={styles.eyebrow}>SELECTED EXPERIENCE / {selected.number}</p><h2 id="project-dialog-title">{selected.name}</h2><div className={styles.dialogRole}><span>{selected.role}</span><span>{selected.period}</span></div><p className={styles.dialogContext}>{selected.context}</p><h3>My contribution</h3><ul>{selected.contributions.map(item => <li key={item}>{item}</li>)}</ul><p className={styles.dialogNote}>{selected.note}</p><a className={styles.textLink} href="mailto:omar.alakara3@gmail.com">Let’s talk about similar work <Arrow /></a></>}
    </dialog>
  </div>;
}
