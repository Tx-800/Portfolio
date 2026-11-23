/**
 * Single source of truth for all site copy. Edit text here; components only read it.
 *
 * Markers (rendered in mono with a dashed underline by <Txt> so they can't ship unnoticed):
 *   [placeholder: …]  information that is still missing
 *   [confirm: …]      needs the owner's confirmation
 *
 * Rules: never name the employer ("a large real estate firm"), no internal DB/schema/table
 * names, dates only where the owner gave them, no education section, times in IST.
 */

/* ------------------------------------------------------------------ types */

export type ChapterId =
  | "boot"
  | "spark"
  | "websites"
  | "cockpit"
  | "pipeline"
  | "watchtower"
  | "agents"
  | "impact"
  | "builder"
  | "contact";

export type ProjectStatus = "in-production" | "freelance-live" | "in-development" | "practice";
export type ProjectGroup = "agents" | "data" | "product" | "web";

export interface Chapter {
  id: ChapterId;
  number: string;
  name: string;
  heading: string;
  /** Words in the heading rendered with the signature gradient (must appear in `heading`). */
  accent?: string;
  intro: string;
  /** Boot is a loader overlay, so it is not shown on the progress rail. */
  inRail: boolean;
  /**
   * Mobile "pinned stage": 2–3 short lines that swap in the bottom card as scrolling scrubs the
   * station's animation. Keep them short and factual.
   */
  beats?: string[];
}

export interface FlowStep {
  title: string;
  detail: string;
}

export interface Outcome {
  label: string;
  before?: string;
  after: string;
  note?: string;
}

export interface Media {
  /** Internal firm tools use diagrams; client sites use screenshots. */
  kind: "screenshot" | "diagram";
  /**
   * Expected file under /public. The site checks it exists (same name as .png, .webp or .jpg
   * is accepted); until then a placeholder is shown, so nothing breaks or 404s.
   */
  src?: string;
  /** Optional images (e.g. covers for NDA projects) show nothing at all while missing. */
  optional?: boolean;
  alt: string;
  caption: string;
}

export interface CaseStudy {
  overview: string;
  problem: string[];
  built: string[];
  features: string[];
  flow: FlowStep[];
  role: string;
  results: Outcome[];
  /** Only for in-progress products: keeps "Built" and "In progress" clearly separate. */
  progress?: { built: string[]; inProgress: string[] };
  media: Media[];
}

export interface ProjectLinks {
  live?: string;
  repo?: string;
  /** Shows "Coming soon" instead of a live link. */
  comingSoon?: boolean;
}

export interface Project {
  slug: string;
  title: string;
  group: ProjectGroup;
  chapter: ChapterId;
  status: ProjectStatus;
  /** Only where the owner provided one, e.g. "Oct 2026". */
  date?: string;
  /** Short context line shown on cards, e.g. "Freelance client". */
  context: string;
  tagline: string;
  summary: string;
  tech: string[];
  links: ProjectLinks;
  caseStudy: CaseStudy;
}

export interface Metric {
  id: string;
  label: string;
  before?: string;
  after: string;
  note: string;
}

export interface SkillGroup {
  name: string;
  skills: { name: string; note?: string }[];
}

export interface ExperienceItem {
  /** Roles have a date range; projects never show dates. */
  period?: string;
  title: string;
  org: string;
  points: string[];
}

export interface Contact {
  email: string;
  /** null = not provided yet; rendered as a highlighted placeholder. */
  github: string | null;
  linkedin: string | null;
  /** Add the PDF at public/resume.pdf. The link 404s until the file exists. */
  resume: string;
}

/* ---------------------------------------------------------------- profile */

export const profile = {
  name: "Yogesh Gangarde",
  role: "Full-Stack Developer",
  focus: "Web apps, data pipelines and AI agents",
  headline: "I connect apps, data and AI agents.",
  headlineAccent: "AI agents.",
  intro: [
    "I build the whole path data travels — from the websites people use, through Snowflake pipelines, to the AI agents that act on it.",
    "Today I build AI agents, workflow automation and a Snowflake data platform at a large real estate firm.",
  ],
  /** Used for SEO descriptions and the Classic View summary. */
  summary:
    "Full-stack developer building web apps, data pipelines and AI agents — MERN, Next.js, .NET, Python, Snowflake and the OpenAI API.",
  currently: "Full-Stack Developer at a large real estate firm",
  stackHighlights: ["React / Next.js", "Node.js / Express", ".NET / C#", "Python", "Snowflake", "OpenAI API"],
} as const;

export const contact: Contact = {
  email: "yogeshgangarde12@gmail.com",
  github: null, // [placeholder: GitHub URL]
  linkedin: null, // [placeholder: LinkedIn URL]
  resume: "/resume.pdf",
};

/* --------------------------------------------------------------- chapters */

export const chapters: Chapter[] = [
  {
    id: "boot",
    number: "00",
    name: "Boot",
    heading: "Booting the pipeline",
    intro: "Loading the journey.",
    inRail: false,
  },
  {
    id: "spark",
    number: "01",
    name: "The Spark",
    heading: profile.headline,
    accent: profile.headlineAccent,
    intro: profile.intro[0],
    inRail: true,
    beats: ["Web apps, data pipelines and AI agents.","From websites, through Snowflake pipelines, to AI agents.","Scroll to follow the data."],
  },
  {
    id: "websites",
    number: "02",
    name: "Where Data Is Born",
    heading: "Where data is born",
    accent: "born",
    intro:
      "Every pipeline starts with a product people use. These are websites and web systems I designed and built for clients — plus one practice build.",
    inRail: true,
  },
  {
    id: "cockpit",
    number: "03",
    name: "The Cockpit",
    heading: "One cockpit, many businesses",
    accent: "many businesses",
    intro:
      "LocalPilot is my own product: one dashboard for managing many local businesses' Google Business Profiles, with AI features on the way.",
    inRail: true,
    beats: ["One dashboard for many Google Business Profiles.","Built: profile checks, updates and posts per business.","In progress: AI captions and images."],
  },
  {
    id: "pipeline",
    number: "04",
    name: "The Pipeline & Warehouse",
    heading: "From scattered sources to one source of truth",
    accent: "one source of truth",
    intro:
      "Operational databases, a MongoDB collection and ad-spend feeds flow into Snowflake, where dynamic tables keep curated data up to date automatically.",
    inRail: true,
    beats: ["MySQL, MongoDB and ad-spend feeds.","Python sync scripts load the raw layer.","Dynamic tables keep curated data fresh."],
  },
  {
    id: "watchtower",
    number: "05",
    name: "The Watchtower",
    heading: "A watchtower for stale data",
    accent: "stale data",
    intro:
      "An agent that checks every table's freshness, emails the team when data falls behind and points to the likely cause.",
    inRail: true,
    beats: ["Scans every table, every day.","Stale over 24h? Email sent.","Cause diagnosed with Snowflake Cortex."],
  },
  {
    id: "agents",
    number: "06",
    name: "The Agents",
    heading: "Agents that do the busywork",
    accent: "busywork",
    intro:
      "Two agents that automate employee onboarding and compliance updates — and keep the right people in the loop.",
    inRail: true,
    beats: ["Onboarding: ~2 days → 3–5 minutes.","Compliance fields, added by email.","Tap a cluster to focus it."],
  },
  {
    id: "impact",
    number: "07",
    name: "The Impact",
    heading: "What changed",
    accent: "changed",
    intro: "Before and after, in production.",
    inRail: true,
  },
  {
    id: "builder",
    number: "08",
    name: "The Builder",
    heading: "The toolkit behind the journey",
    accent: "toolkit",
    intro: "Skills across the stack, and where I've put them to work.",
    inRail: true,
    beats: ["Frontend: React, Next.js, Tailwind CSS.","Backend: Node.js, Express, .NET, Python.","Data & AI: Snowflake, SQL, OpenAI API, Zapier."],
  },
  {
    id: "contact",
    number: "09",
    name: "Your Turn",
    heading: "Your data could be next.",
    accent: "next.",
    intro: "Have an app to build, a pipeline to tame or a process to automate? Let's talk.",
    inRail: true,
    beats: ["An app to build?","A pipeline to tame?","A process to automate? Let's talk."],
  },
];

/** Chapters shown in navigation: Boot is a loader, so the rail starts at Chapter 1. */
export const railChapters = chapters.filter((chapter) => chapter.inRail);

/* ------------------------------------------------------------------- boot */

export const boot = {
  lines: ["> initializing pipeline…", "> loading projects… ok", "> connecting to Yogesh Gangarde… ok"],
  startLabel: "Start the journey",
  skipLabel: "Skip to résumé",
  commands: [
    { name: "help", description: "List available commands" },
    { name: "about", description: "Jump to The Spark" },
    { name: "projects", description: "Jump to the websites" },
    { name: "agents", description: "Jump to The Agents" },
    { name: "contact", description: "Jump to Your Turn" },
    { name: "classic", description: "Open the Classic View" },
  ],
  /** Terminal replies. `{cmd}` is replaced with what the visitor typed. */
  messages: {
    title: "Boot terminal",
    ready: "> ready. press enter or type `help`",
    inputLabel: "Terminal command",
    notFound: "command not found: {cmd}. type `help`",
    sudoHire: "[sudo] permission granted. routing you to contact…",
    navigating: "routing…",
  },
} as const;

/* ---------------------------------------------------------------- UI text */

/** Mobile flow prototype (/flow): toy hints and buttons. */
export const flowText = {
  prototypeNote: "Mobile prototype · Spark → Websites → Pipeline",
  sparkCaption: "Web apps, data pipelines and AI agents — built end to end.",
  sparkHint: "Drag the packet",
  websitesHint: "Swipe to switch sites",
  openCaseStudy: "Open case study",
  refresh: "Refresh the tables",
  refreshHint: "Sends new data through the pipeline",
} as const;

export const notFoundText = {
  label: "404 — signal lost",
  heading: "This packet got lost.",
  body: "It left the pipeline and never arrived. The page you're looking for doesn't exist or has moved.",
  home: "Reconnect to the journey",
  classic: "Classic view",
} as const;

export const uiText = {
  cursor: { open: "Open", drag: "Drag" },
  caseStudy: { close: "Close case study", swipeHint: "Swipe down to close", backToJourney: "Back to the journey" },
} as const;

/* ---------------------------------------------------------- 3D scene text */

/** Short decorative labels drawn inside the 3D scene (aria-hidden; the HTML says the same). */
export const sceneLabels = {
  stale: "stale > 24h",
  staleDiagnosis: "schema change detected",
  newField: "new field",
} as const;

/* --------------------------------------------------------------- statuses */

export const statusLabels: Record<ProjectStatus, string> = {
  "in-production": "In production",
  "freelance-live": "Freelance · Live",
  "in-development": "In development",
  practice: "Practice project",
};

const FIRM = "Built at a large real estate firm";
const FIRM_ROLE = "Designed and built as a Full-Stack Developer at a large real estate firm.";

/* --------------------------------------------------------------- projects */

export const projects: Project[] = [
  /* ---------------------------------------------- Chapter 2: websites */
  {
    slug: "ovi-iot-solutions",
    title: "OVI IoT Solutions",
    group: "web",
    chapter: "websites",
    status: "freelance-live",
    date: "Oct 2026",
    context: "Freelance client",
    tagline: "A business website for an end-to-end IoT solutions company.",
    summary:
      "A multi-page site presenting LoRaWAN and NB-IoT solutions for cities, utilities and industrial operators — 7 solution pages, 8 sector pages and dedicated service pages.",
    tech: ["HTML", "Custom CSS", "JavaScript"],
    links: { live: "https://ovi-iot-solutions.vercel.app/" },
    caseStudy: {
      overview:
        "OVI IoT Solutions provides end-to-end IoT solutions on LoRaWAN and NB-IoT connectivity for cities, utilities and industrial operators. I designed and built their business website as a freelance project.",
      problem: [
        "OVI covers a wide range of solutions, sectors and services. The website had to present all of it clearly, so every kind of visitor — a municipality, a utility, an industrial operator — can quickly find what is relevant to them.",
      ],
      built: [
        "A multi-page business website with a dedicated page for each of the 7 solutions, 8 sector pages and service pages.",
        "A “solution architecture” section that explains the 4-stage data flow: end devices → gateways → network server → applications.",
        "A contact form whose “area of interest” dropdown lists every solution and service.",
      ],
      features: [
        "7 solution pages: smart water metering, smart street lighting, water leak detection, water quality monitoring, water level monitoring, people & asset tracking, ATEX zone sensors",
        "8 sector pages: apartments, gated communities, commercial buildings, industries, municipalities, smart cities, utility companies, irrigation & agriculture",
        "Service pages: consultancy & tender preparation, RF planning & site survey",
        "Solution architecture section explaining the 4-stage data flow",
        "Contact form with an “area of interest” dropdown covering every solution and service",
        "Accessibility skip link, Open Graph / Twitter metadata, fully responsive layout",
      ],
      flow: [
        { title: "Land", detail: "Visitors arrive on a home page that introduces OVI's end-to-end IoT offering." },
        { title: "Find", detail: "They navigate by solution, by sector or by service to the page that fits them." },
        { title: "Understand", detail: "The solution architecture section shows how data moves from devices to applications." },
        { title: "Enquire", detail: "The contact form captures their area of interest along with the enquiry." },
      ],
      role: "Designed and built the full website as a freelance project.",
      results: [
        { label: "Solution pages", after: "7" },
        { label: "Sector pages", after: "8" },
        { label: "Status", after: "Live", note: "[placeholder: any client feedback or results]" },
      ],
      media: [
        { kind: "screenshot", src: "/images/projects/ovi-iot-solutions/hero.png", alt: "OVI IoT Solutions home page", caption: "Home page" },
        { kind: "screenshot", src: "/images/projects/ovi-iot-solutions/solution.png", alt: "An OVI solution page", caption: "Solution page" },
        { kind: "screenshot", src: "/images/projects/ovi-iot-solutions/contact.png", alt: "OVI contact form with area-of-interest dropdown", caption: "Contact form" },
      ],
    },
  },
  {
    slug: "masstech-business-solutions",
    title: "Masstech Business Solutions",
    group: "web",
    chapter: "websites",
    status: "freelance-live",
    date: "Apr 2026",
    context: "Freelance client",
    tagline: "A company website with a working careers system.",
    summary:
      "A company website for an IT solutions provider, plus a careers system that emails candidates and HR automatically and gives admins a filterable, exportable applicant dashboard.",
    tech: ["Custom CSS", "JavaScript", "PHP form handling", "SMTP email"],
    links: { live: "https://masstechbusiness.com/" },
    caseStudy: {
      overview:
        "Masstech Business Solutions is an IT solutions provider offering application development, database management, mobility, IT consulting & outsourcing, and Microsoft SharePoint & Dynamics services. I built their company website and a working careers system as a freelance project.",
      problem: [
        "Masstech needed a company website to present its services, and a careers system to collect applications and manage every applicant in one place.",
      ],
      built: [
        "A company website presenting Masstech's services, with a glassmorphism visual style.",
        "A careers system: candidates submit their profile and résumé; the system emails a confirmation to the candidate and emails HR with the résumé attached.",
        "A login-protected admin dashboard that lists every applicant with their details, with filters and export to Excel.",
      ],
      features: [
        "Application form: name, contact details, position, experience, notice period, current and expected CTC, résumé upload (PDF, DOC, DOCX up to 5 MB)",
        "Automatic confirmation email to the candidate",
        "Automatic email to HR with the résumé attached",
        "Admin dashboard behind a login",
        "Applicant list with filters",
        "Export to Excel",
      ],
      flow: [
        { title: "Apply", detail: "A candidate fills in their profile and uploads a résumé on the careers page." },
        { title: "Store", detail: "A PHP backend saves the application and résumé on the cPanel hosting." },
        { title: "Notify", detail: "PHP SMTP sends a confirmation to the candidate and an email to HR with the résumé attached." },
        { title: "Review", detail: "Admins log in to the dashboard, filter applicants and export the list to Excel." },
      ],
      role: "Built the website and the careers system as a freelance project.",
      results: [
        { label: "Applicants", after: "One dashboard", note: "With filters and Excel export" },
        { label: "Emails", after: "Automatic", note: "Candidate confirmation + HR copy with résumé" },
        { label: "Status", after: "Live", note: "[placeholder: any client feedback or results]" },
      ],
      media: [
        { kind: "screenshot", src: "/images/projects/masstech-business-solutions/hero.png", alt: "Masstech home page", caption: "Home page" },
        { kind: "screenshot", src: "/images/projects/masstech-business-solutions/careers.png", alt: "Masstech careers application form", caption: "Careers form" },
        { kind: "screenshot", src: "/images/projects/masstech-business-solutions/admin.png", alt: "Masstech admin applicant dashboard", caption: "Admin dashboard" },
      ],
    },
  },
  {
    slug: "elitenex",
    title: "Elitenex",
    group: "web",
    chapter: "websites",
    status: "practice",
    date: "Jan 2026",
    context: "Personal project",
    tagline: "An ed-tech website with lead capture and a student chatbot.",
    summary:
      "A course showcase where students download a syllabus after sharing their contact details, with a small chatbot that answers basic questions.",
    tech: ["HTML", "CSS", "JavaScript"],
    links: { comingSoon: true },
    caseStudy: {
      overview:
        "Elitenex is a practice project: an ed-tech website that showcases the available courses to students.",
      problem: [
        "A course website needs to turn interested students into leads, while answering the questions they ask most often.",
      ],
      built: [
        "A website showcasing the available courses.",
        "A “Download syllabus” flow: the student enters their contact details first, then receives the syllabus PDF.",
        "A small rule-based chatbot that answers basic student queries.",
        "A glassmorphism visual style with smooth-scrolling effects.",
      ],
      features: [
        "Course showcase",
        "Lead capture before every syllabus download",
        "Syllabus delivered as a PDF",
        "Rule-based chatbot for basic student queries",
        "Glassmorphism design with smooth scrolling",
      ],
      flow: [
        { title: "Browse", detail: "Students explore the available courses." },
        { title: "Request", detail: "They click “Download syllabus”." },
        { title: "Share details", detail: "They enter their contact details (lead capture)." },
        { title: "Receive", detail: "The syllabus PDF is delivered." },
      ],
      role: "Designed and built as a personal practice project.",
      results: [
        { label: "Lead capture", after: "Every download", note: "Contact details collected before the syllabus" },
        { label: "Status", after: "Not deployed yet" },
      ],
      media: [
        { kind: "screenshot", src: "/images/projects/elitenex/hero.png", alt: "Elitenex course listing", caption: "Courses" },
        { kind: "screenshot", src: "/images/projects/elitenex/syllabus.png", alt: "Elitenex syllabus download form", caption: "Syllabus lead capture" },
      ],
    },
  },

  /* ---------------------------------------------- Chapter 3: cockpit */
  {
    slug: "localpilot",
    title: "LocalPilot",
    group: "product",
    chapter: "cockpit",
    status: "in-development",
    context: "My product",
    tagline: "The AI marketing cockpit for local businesses.",
    summary:
      "One dashboard to manage many Google Business Profiles — check and update profiles and write posts that improve each business's visibility. The platform is built; AI features are in progress.",
    tech: ["Next.js", "Supabase", "Tailwind CSS", "OpenAI API (in progress)"],
    links: { live: "https://localpilot-rust.vercel.app/" },
    caseStudy: {
      overview:
        "LocalPilot is a full-stack platform for managing multiple Google Business Profiles in one place: check and update each profile and write posts that improve the business's online visibility. The platform is built; AI-generated content is in progress.",
      problem: [
        "Looking after many local businesses means jumping between separate Google Business Profiles to check details, make updates and keep posting — one business at a time.",
      ],
      built: [
        "A full-stack platform built with Next.js, Supabase and Tailwind CSS.",
        "One centralised dashboard for managing many businesses' Google Business Profiles.",
        "Profile checks and updates, and post writing for each business.",
      ],
      features: [
        "Multi-client: many local businesses managed from one dashboard",
        "Check and update Google Business Profiles",
        "Write posts that improve each business's online visibility",
        "Human approval: nothing goes live until the user clicks Approve",
        "AI-generated, on-brand captions and images per client (in progress)",
      ],
      flow: [
        { title: "Add businesses", detail: "Connect the local businesses you manage to one dashboard." },
        { title: "Check & update", detail: "Review each Google Business Profile and keep it up to date." },
        { title: "Draft posts", detail: "Write posts for each business — AI drafting is in progress." },
        { title: "Approve", detail: "Nothing goes live until you click Approve." },
      ],
      role: "Product idea, design and full-stack development.",
      results: [
        { label: "Platform", after: "Built", note: "Full stack live on Vercel" },
        { label: "AI features", after: "In progress", note: "OpenAI API for captions and images" },
        { label: "Publishing", after: "Approval-gated", note: "A human approves every post" },
      ],
      progress: {
        built: [
          "Full-stack platform (Next.js, Supabase, Tailwind CSS)",
          "Central dashboard for multiple Google Business Profiles",
          "Check and update profiles",
          "Write posts per business",
          "Human approval before anything goes live [confirm: built or in progress]",
        ],
        inProgress: [
          "OpenAI API integration to generate on-brand post captions and images per client",
          "Topics and styles that rotate automatically",
        ],
      },
      media: [
        { kind: "screenshot", src: "/images/projects/localpilot/hero.png", alt: "LocalPilot multi-client dashboard", caption: "Dashboard" },
        { kind: "screenshot", src: "/images/projects/localpilot/approval.png", alt: "LocalPilot post editor with approval", caption: "Post approval" },
      ],
    },
  },

  /* ---------------------------------------------- Chapter 4: pipeline */
  {
    slug: "snowflake-data-platform",
    title: "Snowflake Data Platform",
    group: "data",
    chapter: "pipeline",
    status: "in-production",
    context: FIRM,
    tagline: "From scattered sources to curated tables that stay up to date on their own.",
    summary:
      "Python sync scripts load operational data into Snowflake; dynamic tables filter and transform it into a curated layer that refreshes automatically.",
    tech: ["Snowflake", "Dynamic tables", "SQL", "Python", "pm2"],
    links: {},
    caseStudy: {
      overview:
        "A Snowflake data platform that brings data from operational MySQL databases, a MongoDB collection and marketing ad-spend feeds into one place, and keeps transformed data up to date automatically with dynamic tables.",
      problem: [
        "Business data lived in separate systems: operational MySQL databases, a MongoDB collection and marketing ad-spend feeds.",
        "[placeholder: what this made difficult before the platform — e.g. reporting, manual exports]",
      ],
      built: [
        "Python sync scripts, run on a schedule with pm2, that load source data into a raw layer in Snowflake.",
        "Snowflake dynamic tables that filter and transform the raw data into a curated layer, keeping it automatically up to date from the source data.",
        "A sync timestamp column on every table, so freshness can be checked across both layers.",
      ],
      features: [
        "Three kinds of source: operational MySQL databases, a MongoDB collection, marketing ad-spend feeds",
        "Scheduled Python sync scripts managed with pm2",
        "Layered architecture: raw → curated",
        "Dynamic tables keep curated data up to date automatically",
        "Sync timestamp on every table, used by the Staleness Agent",
      ],
      flow: [
        { title: "Sources", detail: "Operational MySQL databases, a MongoDB collection and ad-spend feeds." },
        { title: "Sync", detail: "Python scripts, scheduled with pm2, load the data into Snowflake." },
        { title: "Raw layer", detail: "Source data lands as-is, stamped with its sync time." },
        { title: "Curated layer", detail: "Dynamic tables filter and transform it, refreshing automatically." },
      ],
      role: FIRM_ROLE,
      results: [
        { label: "Curated data", after: "Always current", note: "Dynamic tables refresh automatically" },
        { label: "Sources", after: "One platform", note: "MySQL, MongoDB and ad-spend feeds together" },
      ],
      media: [
        { kind: "diagram", alt: "Sources to raw to curated data flow", caption: "Data flow (internal system — diagram only)" },
        { kind: "screenshot", src: "/images/projects/snowflake-data-platform/hero.png", alt: "Snowflake data platform cover image", caption: "Cover", optional: true },
      ],
    },
  },

  /* ---------------------------------------------- Chapter 5: watchtower */
  {
    slug: "staleness-agent",
    title: "Staleness Agent",
    group: "data",
    chapter: "watchtower",
    status: "in-production",
    context: FIRM,
    tagline: "Daily freshness checks, automatic alerts and an LLM-diagnosed likely cause.",
    summary:
      "A data-freshness monitor built entirely inside Snowflake. Every day it checks each table against a 24-hour rule, emails alerts and a daily report, and uses Snowflake Cortex to diagnose the likely cause.",
    tech: ["Snowflake", "Snowflake Cortex", "SQL"],
    links: {},
    caseStudy: {
      overview:
        "A data-freshness monitor built completely within Snowflake's native AI agent environment — no external tools. Every day it checks each table against a 24-hour rule, emails the team when data goes stale, sends an automatic daily report and uses an LLM on Snowflake Cortex to diagnose the likely cause.",
      problem: [
        "The data platform depends on every table staying fresh. When a table falls behind its source, the team needs to know quickly — and know where to start fixing.",
      ],
      built: [
        "An agent, built completely within Snowflake's native AI agent environment, that checks table freshness daily across both the raw and curated layers using the sync timestamp column present on every table.",
        "Any table whose latest sync is more than 24 hours old is flagged STALE, and an email alert goes to the team automatically.",
        "An LLM running on Snowflake Cortex diagnoses the likely cause — for example a schema-related issue versus another failure — to speed up the fix.",
        "A daily report is also sent automatically.",
      ],
      features: [
        "Built entirely inside Snowflake — no external tools",
        "Runs daily across both the raw and curated layers",
        "24-hour freshness rule based on each table's sync timestamp",
        "Automatic email alerts to the team",
        "LLM-based cause diagnosis with Snowflake Cortex, e.g. schema change vs. other failure",
        "Automatic daily report",
        "Times reported in IST",
      ],
      flow: [
        { title: "Check", detail: "Runs daily across raw and curated tables." },
        { title: "Compare", detail: "Reads each table's sync timestamp; older than 24 hours means STALE." },
        { title: "Alert", detail: "An email alert notifies the team automatically." },
        { title: "Diagnose", detail: "An LLM on Snowflake Cortex suggests the likely cause, such as “schema change detected”." },
        { title: "Report", detail: "A daily report is sent automatically." },
      ],
      role: FIRM_ROLE,
      results: [
        { label: "Freshness rule", after: "24 hours", note: "Every table, raw and curated, checked daily" },
        { label: "Alerts", after: "Automatic", note: "Email to the team, times in IST" },
        { label: "Triage", after: "LLM diagnosis", note: "Likely cause included with the alert" },
        { label: "Reporting", after: "Daily", note: "Automatic daily report" },
      ],
      media: [
        { kind: "diagram", alt: "Daily check, alert, diagnosis and report flow", caption: "Agent flow (internal system — diagram only)" },
        { kind: "screenshot", src: "/images/projects/staleness-agent/hero.png", alt: "Staleness Agent cover image", caption: "Cover", optional: true },
      ],
    },
  },

  /* ---------------------------------------------- Chapter 6: agents */
  {
    slug: "onboarding-agent",
    title: "Onboarding Agent",
    group: "agents",
    chapter: "agents",
    status: "in-production",
    context: FIRM,
    tagline: "Employee onboarding, from ~2 days to 3–5 minutes.",
    summary:
      "HR emails the new joiners' details; an LLM-powered agent collects the data, stores it in Snowflake, keeps the responsible people on track and reports back to HR when it's done.",
    tech: ["Snowflake", "Zapier", "LLM", "Email"],
    links: {},
    caseStudy: {
      overview:
        "The Onboarding Agent automates employee onboarding at a large real estate firm. HR sends the new joiners' details by email; the agent collects the data, stores it in Snowflake and replies to HR when the work is done. Onboarding that used to take around two days now completes in 3–5 minutes.",
      problem: [
        "Employee onboarding involved a series of tasks owned by different people, and took around two days to complete.",
        "Each step depends on the responsible person finishing their task on time.",
      ],
      built: [
        "An LLM-powered agent, built on Snowflake and Zapier, that picks up onboarding requests HR sends to a connected email inbox.",
        "It collects the new employees' data from the email and puts it into the Snowflake database.",
        "Automatic notifications and reminders to the people responsible for each step, so tasks are done on time.",
        "When the work is complete, the bot replies to HR with the number of people onboarded.",
      ],
      features: [
        "Starts from a simple email by HR",
        "Collects the new employees' data from the email",
        "Stores it in the Snowflake database automatically",
        "Notifications and reminders to each responsible person",
        "Completion reply to HR with the number of people onboarded",
      ],
      flow: [
        { title: "Email", detail: "HR emails the new joiners' details to a connected inbox." },
        { title: "Collect", detail: "The agent collects the employee data from the email." },
        { title: "Store", detail: "The data goes into the Snowflake database." },
        { title: "Notify", detail: "Each responsible person is notified and reminded of their task." },
        { title: "Report", detail: "The bot replies to HR with the number of people onboarded." },
      ],
      role: FIRM_ROLE,
      results: [
        { label: "Onboarding time", before: "~2 days", after: "3–5 min" },
        { label: "HR update", after: "Automatic", note: "Reply with the number of people onboarded" },
      ],
      media: [
        { kind: "diagram", alt: "HR email to agent to Snowflake to HR reply flow", caption: "Agent flow (internal tool — diagram only)" },
        { kind: "screenshot", src: "/images/projects/onboarding-agent/hero.png", alt: "Onboarding Agent cover image", caption: "Cover", optional: true },
      ],
    },
  },
  {
    slug: "compliance-agent",
    title: "Compliance Agent",
    group: "agents",
    chapter: "agents",
    status: "in-production",
    context: FIRM,
    tagline: "New compliance fields, added by email — no developer needed.",
    summary:
      "Responsible people email the fields they need; the agent adds them to the database automatically and replies once they're added.",
    tech: ["Snowflake", "Zapier", "Gmail"],
    links: {},
    caseStudy: {
      overview:
        "The Compliance Agent lets the people responsible for compliance add new database fields just by sending an email. The agent reads the request through Gmail, adds the fields automatically and replies once they're added, so a developer no longer has to be involved each time.",
      problem: [
        "Compliance requirements regularly introduce new fields that must be added to the database.",
        "Every time, the responsible person had to contact a developer to add them.",
      ],
      built: [
        "An agent that reads field requests sent by email through Gmail.",
        "It takes the field(s) that need to be added and adds them to the database automatically.",
        "It then replies to confirm the field(s) were added.",
      ],
      features: [
        "Requests by plain email — no tickets",
        "Reads incoming requests through Gmail",
        "Picks out the field(s) to add",
        "Adds the new field(s) to the database automatically",
        "Replies to confirm once the field(s) are added",
      ],
      flow: [
        { title: "Email", detail: "The responsible person describes the new field(s) in an email." },
        { title: "Read", detail: "The agent picks up the request through Gmail." },
        { title: "Extract", detail: "It takes the field(s) that need to be added." },
        { title: "Add", detail: "The new field(s) are added to the database." },
        { title: "Confirm", detail: "The agent replies that the field(s) were added." },
      ],
      role: FIRM_ROLE,
      results: [
        { label: "Developer involvement", before: "Every new field", after: "Not needed", note: "Fields are added by email" },
        { label: "Confirmation", after: "Automatic", note: "Reply once the fields are added" },
      ],
      media: [
        { kind: "diagram", alt: "Email to Gmail to agent to database flow", caption: "Agent flow (internal tool — diagram only)" },
        { kind: "screenshot", src: "/images/projects/compliance-agent/hero.png", alt: "Compliance Agent cover image", caption: "Cover", optional: true },
      ],
    },
  },
];

/* ---------------------------------------------------------------- metrics */

export const metrics: Metric[] = [
  {
    id: "onboarding",
    label: "Employee onboarding",
    before: "~2 days",
    after: "3–5 min",
    note: "Automated by the Onboarding Agent",
  },
  {
    id: "compliance",
    label: "Compliance fields",
    before: "Developer for every field",
    after: "Added by email",
    note: "No developer needed",
  },
  {
    id: "freshness",
    label: "Data freshness",
    after: "24-hour rule",
    note: "Every table checked daily, with email alerts and a daily report",
  },
];

/* ----------------------------------------------------------------- skills */

export const skillGroups: SkillGroup[] = [
  {
    name: "Frontend",
    skills: [{ name: "React" }, { name: "Next.js" }, { name: "Tailwind CSS" }, { name: "HTML & CSS" }, { name: "JavaScript" }],
  },
  {
    name: "Backend",
    skills: [
      { name: "Node.js" },
      { name: "Express" },
      { name: ".NET / C#" },
      { name: "Python" },
      { name: "Java", note: "some experience" },
    ],
  },
  {
    name: "Data",
    skills: [{ name: "Snowflake" }, { name: "Dynamic tables" }, { name: "SQL" }, { name: "MongoDB" }, { name: "Supabase" }],
  },
  {
    name: "AI & Automation",
    skills: [
      { name: "AI agents / LLM apps" },
      { name: "OpenAI API" },
      { name: "Snowflake Cortex" },
      { name: "Zapier" },
      { name: "Gmail integrations" },
    ],
  },
];

/* ------------------------------------------------------------- experience */

export const experience: ExperienceItem[] = [
  {
    period: "Sep 2026 – Present",
    title: "Full-Stack Developer",
    org: "A large real estate firm",
    points: [
      "Build AI agents that automate employee onboarding and compliance updates",
      "Automate workflows with Zapier and Gmail integrations",
      "Build the Snowflake data platform with dynamic tables, plus a Staleness Agent that monitors data freshness",
    ],
  },
  {
    period: "Jan 2026 – Present",
    title: "Freelance Web Developer",
    org: "Independent",
    points: [
      "Oct 2026 — OVI IoT Solutions: IoT business website",
      "Apr 2026 — Masstech Business Solutions: company website and careers system",
    ],
  },
  {
    period: "Jan 2026",
    title: "Elitenex",
    org: "Personal project",
    points: ["Ed-tech website with course showcase, syllabus lead capture and a student chatbot"],
  },
];

/* ----------------------------------------------------------------- footer */

export const footer = {
  note: "Designed and built by Yogesh Gangarde.",
} as const;

/* ---------------------------------------------------------------- helpers */

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getChapter(id: ChapterId): Chapter {
  const chapter = chapters.find((c) => c.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}

export function projectsInChapter(id: ChapterId): Project[] {
  return projects.filter((project) => project.chapter === id);
}

export function projectsInGroups(groups: ProjectGroup[]): Project[] {
  return projects.filter((project) => groups.includes(project.group));
}
