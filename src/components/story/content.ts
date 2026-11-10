// Every fact on the homepage comes from Omar_Al_Akara_CV_F.pdf. Do not add projects,
// clients, metrics, or skills that are not in the CV.

export const contact = {
  email: "omar.alakara3@gmail.com",
  linkedin: "https://www.linkedin.com/in/omar-alakara",
  github: "https://github.com/omaralakara",
  cv: "/Omar-Al-Akara-CV.pdf",
};

// Each group is one orbit around the satellite.
export const skillGroups = [
  { title: "Interactive websites", text: "Fast, animated sites with React and Next.js.", tools: ["React", "Next.js", "JavaScript", "GSAP", "HTML", "CSS", "Three.js (intro)"] },
  { title: "E-commerce & content", text: "Shopify storefronts and custom WordPress themes.", tools: ["Shopify", "Liquid", "WordPress", "WooCommerce", "PHP", "Elementor"] },
  { title: "Performance & discovery", text: "Sites that load fast and get found.", tools: ["Technical SEO", "Core Web Vitals", "Search Console", "GA4"] },
  { title: "Integrations & automation", text: "APIs and AI workflows that remove busywork.", tools: ["REST APIs", "AI integrations", "Automation", "Postman", "AWS", "Git"] },
] as const;

// TODO(Omar): before publishing, confirm the exact periods, the Search Console evidence,
// and your contribution. Keep the "contributed to" wording; do not imply sole causation.
export const metrics = [
  { value: 44, label: "more organic clicks" },
  { value: 63, label: "more impressions" },
] as const;

export const outcomes = [
  { area: "Commerce", text: "Storefront improvements supporting order growth at Laptops King." },
  { area: "Performance", text: "Faster client sites through Core Web Vitals work." },
  { area: "Automation", text: "AI-assisted workflows that cut repetitive maintenance." },
] as const;

export const experience = [
  { years: "2026 — now", company: "Synergi BPO", role: "Web Developer & SEO Specialist", where: "UAE · Remote", line: "Custom WordPress themes, interactive React sites, SEO and performance for client websites.", skills: ["WordPress", "React", "Next.js", "GSAP", "Technical SEO", "Core Web Vitals", "AI automation"] },
  { years: "2026 — now", company: "Laptops King", role: "Shopify Growth Specialist", where: "Lebanon · Remote", line: "Storefront features, product discovery, and search growth for a laptop retailer.", skills: ["Shopify", "Liquid", "Metafields", "Search & filters", "SEO", "Google Ads setup"] },
  { years: "2025 — 2026", company: "fazeZERO", role: "Software Developer", where: "Dubai · Remote", line: "React interfaces and integrations for blockchain-based fintech applications.", skills: ["React", "REST APIs", "Smart contracts", "AWS EC2 · S3 · Lambda"] },
  { years: "2025 — 2026", company: "CIS College", role: "Computer Instructor", where: "Lebanon", line: "Taught frontend, backend, databases, and digital circuits.", skills: ["Frontend", "Backend", "Oracle · MySQL", "Digital circuits"] },
  { years: "2024", company: "Sereni", role: "Shopify Developer", where: "London · Remote", line: "Theme customization and store tracking with design and marketing teams.", skills: ["Shopify", "Liquid", "Tracking"] },
  { years: "2022 — 2024", company: "Loyabi", role: "Shopify Developer", where: "Lebanon · Hybrid", line: "Ran a multi-vendor Shopify marketplace: sellers, approvals, and fulfillment.", skills: ["Shopify", "App integrations", "Google Analytics"] },
] as const;

export const education = "B.Sc. Computer Engineering · Lebanese International University · 2021–2024";
