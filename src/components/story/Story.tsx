"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StarCursor from "../effects/StarCursor";
import ParticleStage from "../particles/ParticleStage";
import { projects, type Project } from "../portfolio/projects";
import StaticArt from "./StaticArt";
import { contact, education, experience, metrics, outcomes, skillGroups } from "./content";
import { useStoryScroll } from "./useStoryScroll";
import styles from "./Story.module.css";

const sections = [
  { id: "top", name: "Introduction" },
  { id: "skills", name: "Skills" },
  { id: "results", name: "Results" },
  { id: "work", name: "Work" },
  { id: "about", name: "Experience" },
  { id: "contact", name: "Contact" },
] as const;
const navigation = sections.slice(1);

function Arrow({ diagonal = true }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d={diagonal ? "M6 18 18 6M8 6h10v10" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function Eyebrow({ index, label }: { index: string; label: string }) {
  return <p className={styles.eyebrow}><span>{index}</span><i /><span data-scramble>{label}</span></p>;
}

export default function Story() {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [started, setStarted] = useState(false);
  const [live, setLive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const onSection = useCallback((index: number) => setActive(index), []);
  const onSettled = useCallback(() => setStarted(true), []);
  const { motion, wave } = useStoryScroll(root, { animate: motionAllowed, started, onSection });

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [menuOpen]);
  useEffect(() => {
    if (!selected || !dialog.current) return;
    const previousOverflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);

  const openProject = (project: Project) => { lastFocused.current = document.activeElement as HTMLElement; setSelected(project); };
  const closeProject = () => dialog.current?.close();
  const onDialogClose = () => { setSelected(null); lastFocused.current?.focus({ preventScroll: true }); };
  const activeId = sections[active].id;

  return <div ref={root} className={`${styles.story} ${live ? styles.live : ""}`} data-active-section={activeId}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <ParticleStage motion={motion} onAnimated={setLive} onSettled={onSettled} />

    <header className={styles.header}>
      <a href="#top" className={styles.brand} aria-label="Omar Al Akara, back to top"><span className={styles.brandMark} aria-hidden="true">o<span>a</span></span><span>OMAR<br />AL AKARA</span></a>
      <button className={styles.menuButton} aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? "Close" : "Menu"}</button>
      <nav id="site-nav" className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Main navigation">
        {navigation.map(({ id, name }) => <a key={id} href={`#${id}`} aria-current={activeId === id ? "true" : undefined} onClick={() => setMenuOpen(false)}>{name}</a>)}
      </nav>
    </header>

    <p className={styles.progress} aria-hidden="true"><b>{String(active + 1).padStart(2, "0")}</b><i />{sections[active].name}</p>

    <main id="main">
      {/* Every section: text in the left column, its particle scene in the right column. */}
      <section id="top" data-story-section="intro" className={`${styles.section} ${styles.intro}`} aria-labelledby="intro-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow} data-intro-detail><span>Omar Al Akara</span><i />Software developer · Lebanon</p>
          <h1 id="intro-title" data-intro-title><span>Creative development.</span> <span className={styles.accent}>Real-world impact.</span></h1>
          <p className={styles.lead} data-intro-detail>From Lebanon, I build digital experiences that connect people, solve problems, and help businesses grow.</p>
          <div className={styles.actions} data-intro-detail>
            <a className={styles.primary} href="#work" data-magnetic>Explore my work <Arrow diagonal={false} /></a>
            <a className={styles.secondary} href="#contact">Get in touch <Arrow /></a>
          </div>
        </div>
        <div className={styles.slot} data-anchor><StaticArt kind="earth" /></div>
      </section>

      <section id="skills" data-story-section="skills" className={styles.pinSection} aria-labelledby="skills-title">
        <div className={`${styles.section} ${styles.skills}`} data-pin>
          <div className={styles.copy}>
            <Eyebrow index="01" label="Skills" />
            <h2 id="skills-title" data-heading>Built to <span className={styles.accent}>connect.</span></h2>
            <p className={styles.lead} data-lines>Four orbits of work around one goal: products that perform.</p>
            <ol className={styles.groups}>
              {skillGroups.map((group, index) => <li key={group.title} className={styles.group} data-group>
                <span className={styles.groupIndex}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{group.title}</h3>
                  <div className={styles.groupBody}><div>
                    <p>{group.text}</p>
                    <ul className={styles.tools} aria-label={`${group.title} tools`}>{group.tools.map(tool => <li key={tool}>{tool}</li>)}</ul>
                  </div></div>
                </div>
              </li>)}
            </ol>
          </div>
          <div className={styles.slot}><StaticArt kind="satellite" /></div>
          <div className={styles.orbits} aria-hidden="true">
            <svg className={styles.orbitLines} viewBox="-600 -400 1200 800">{skillGroups.map(group => <ellipse key={group.title} cx="0" cy="0" rx="100" ry="30" data-orbit-line />)}</svg>
            {skillGroups.map(group => <div key={group.title} className={styles.orbit} data-orbit>{group.tools.map(tool => <span key={tool} className={styles.chip} data-chip>{tool}</span>)}</div>)}
          </div>
        </div>
      </section>

      <section id="results" data-story-section="results" className={`${styles.section} ${styles.results}`} aria-labelledby="results-title">
        <div className={styles.copy}>
          <Eyebrow index="02" label="Results" />
          <h2 id="results-title" data-heading>Progress you can <span className={styles.accent}>measure.</span></h2>
          <div className={styles.metrics}>
            {metrics.map(metric => <p key={metric.label} data-reveal><b>+<span data-count>{metric.value}</span><small>%</small></b><span>{metric.label}</span></p>)}
          </div>
          <p className={styles.metricNote} data-reveal>Laptops King search growth, approximately, compared with the previous three months. A shared result: I contributed through storefront and SEO work.</p>
          <ul className={styles.outcomes}>
            {outcomes.map(outcome => <li key={outcome.area} data-reveal><i className={styles.rule} data-rule /><span>{outcome.area}</span>{outcome.text}</li>)}
          </ul>
        </div>
        <div className={styles.slot}><StaticArt kind="galaxy" /></div>
      </section>

      <section id="work" data-story-section="work" className={styles.pinSection} aria-labelledby="work-title">
        <div className={`${styles.section} ${styles.work}`} data-pin>
          <div className={styles.copy}>
            <Eyebrow index="03" label="Selected work" />
            <h2 id="work-title" data-heading>Work that <span className={styles.accent}>ships.</span></h2>
            <div className={styles.deckMeta} aria-hidden="true"><span><b data-project-index>01</b> / 0{projects.length}</span><i className={styles.deckBar}><i data-project-bar /></i><span>Scroll</span></div>
            <div className={styles.deck} data-deck>
              {projects.map(project => <article key={project.id} id={project.id} data-project-card className={styles.card} aria-labelledby={`${project.id}-title`}>
                <div className={styles.cardInner} data-tilt>
                  <div className={styles.cardTop}><span>{project.number} · {project.category}</span><span>{project.period}</span></div>
                  <p className={styles.client}>{project.name}<span>{project.role}</span></p>
                  <h3 id={`${project.id}-title`}>{project.headline.split("\n").map(line => <span key={line}>{line}</span>)}</h3>
                  <p className={styles.summary}>{project.summary}</p>
                  <div className={styles.cardFoot}>
                    <ul className={styles.tools} aria-label="Technologies">{project.tags.map(tag => <li key={tag} data-tag>{tag}</li>)}</ul>
                    <button className={styles.cardLink} onClick={() => openProject(project)} aria-label={`Explore my work at ${project.name}`} data-magnetic>Details <Arrow /></button>
                  </div>
                </div>
              </article>)}
            </div>
          </div>
          <div className={styles.slot}><StaticArt kind="rocket" /></div>
        </div>
      </section>

      <section id="about" data-story-section="about" className={styles.pinSection} aria-labelledby="about-title">
        <div className={`${styles.section} ${styles.about}`} data-pin>
          <div className={styles.copy}>
            <Eyebrow index="04" label="Experience" />
            <h2 id="about-title" data-heading>From Lebanon, <span className={styles.accent}>outward.</span></h2>
            <p className={styles.lead} data-lines>Six roles across web development, e-commerce, fintech, and teaching.</p>
            <ol className={styles.track} aria-hidden="true">
              <li className={styles.trackLine}><i data-track-fill /></li>
              {experience.map(role => <li key={role.company} className={styles.marker} data-marker><i /><span>{role.years.split(" — ")[0]}</span></li>)}
            </ol>
            <ol className={styles.roles} aria-label="Experience">
              {experience.map(role => <li key={role.company} className={styles.role} data-role>
                <p className={styles.roleMeta}><span>{role.years}</span><span>{role.where}</span></p>
                <h3>{role.company}</h3>
                <p className={styles.roleTitle}>{role.role}</p>
                <p className={styles.roleLine}>{role.line}</p>
                <ul className={styles.tools} aria-label={`Skills at ${role.company}`}>{role.skills.map(skill => <li key={skill} data-skill>{skill}</li>)}</ul>
              </li>)}
            </ol>
            <p className={styles.education}>{education}</p>
            <div className={styles.actions}>
              <a className={styles.primary} href={contact.cv} download data-magnetic>Download my CV <Arrow diagonal={false} /></a>
              {live && <button className={styles.waveButton} onClick={() => wave.current()} data-magnetic>Wave hello <span aria-hidden="true">👋</span></button>}
            </div>
          </div>
          <div className={styles.slot}><StaticArt kind="robot" /></div>
        </div>
      </section>

      <section id="contact" data-story-section="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
        <div className={styles.copy}>
          <Eyebrow index="05" label="Contact" />
          <h2 id="contact-title" data-heading>Let’s build <span className={styles.accent}>what’s next.</span></h2>
          <p className={styles.lead} data-lines>Open to full-time roles and freelance projects.</p>
          <a className={styles.email} href={`mailto:${contact.email}`} data-email><span data-email-text>{contact.email}</span><Arrow /></a>
          <div className={styles.contactLinks} data-reveal>
            <a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
            <a href={contact.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a>
            <a href={contact.cv} download>CV (PDF) <Arrow /></a>
          </div>
        </div>
        <div className={styles.slot}><StaticArt kind="earth" /></div>
      </section>
    </main>

    {live && <StarCursor />}

    <footer className={styles.footer}><span>© {new Date().getFullYear()} Omar Al Akara</span><span>Built with Next.js, Three.js &amp; GSAP</span><a href="#top">Back to top ↑</a></footer>

    <dialog ref={dialog} className={styles.dialog} onClose={onDialogClose} aria-labelledby="project-dialog-title"
      onClick={event => { if (event.target !== dialog.current) return; const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeProject(); }}>
      {selected && <>
        <div className={styles.dialogTop}><span>{selected.category}</span><button onClick={closeProject} aria-label="Close project details" autoFocus>Close <span aria-hidden="true">×</span></button></div>
        <p className={styles.eyebrow}><span>{selected.number}</span><i />Selected work</p>
        <h2 id="project-dialog-title">{selected.name}</h2>
        <p className={styles.dialogRole}><span>{selected.role}</span><span>{selected.period}</span></p>
        <p>{selected.context}</p>
        <h3>My contribution</h3>
        <ul>{selected.contributions.map(item => <li key={item}>{item}</li>)}</ul>
        <p className={styles.dialogNote}>{selected.note}</p>
        <a className={styles.primary} href={`mailto:${contact.email}`}>Talk about similar work <Arrow /></a>
      </>}
    </dialog>
  </div>;
}
