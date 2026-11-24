# Project screenshots

Drop files into the matching folder. No code changes are needed. The site checks which files exist, and until a file is there it shows the stylised preview (3D browser windows) or a dashed placeholder (case studies), so nothing breaks or 404s.

After adding files, restart `npm run dev`, or rebuild for production (Vercel rebuilds on deploy).

## Format

| | Hero (`hero.*`) | Gallery images |
|---|---|---|
| Size | **1440 × 900** (16:10) | **1440 × 900** (16:10) |
| Format | PNG or WebP | PNG or WebP |
| Max file size | 500 KB (WebP), 1 MB (PNG) | 400 KB (WebP), 800 KB (PNG) |

- The paths below use `.png`. A **`.webp` or `.jpg` with the same name also works** (e.g. `hero.webp`). WebP is recommended because it's smaller.
- Keep the 16:10 ratio. Images are cropped to it (`object-fit: cover`).
- The **hero** of a website project is also the texture on its floating browser window in the 3D scene (chapters 02–03). Capture the top of the page, without browser chrome.
- Don't include personal data from the admin dashboards (blur names and emails).

## Files per project

| Folder | Expected files |
|---|---|
| `ovi-iot-solutions/` | `hero.png` (home page) · `solution.png` (a solution page) · `contact.png` (contact form) |
| `masstech-business-solutions/` | `hero.png` (home page) · `careers.png` (careers form) · `admin.png` (admin dashboard, personal data blurred) |
| `elitenex/` | `hero.png` (course listing) · `syllabus.png` (syllabus lead-capture form) |
| `localpilot/` | `hero.png` (dashboard) · `approval.png` (post approval) |
| `snowflake-data-platform/` | optional `hero.png`: NDA-safe cover only. The flow diagram is generated automatically |
| `staleness-agent/` | optional `hero.png`: NDA-safe cover only |
| `qagent/` | optional `hero.png`: NDA-safe cover only |
| `compliance-agent/` | optional `hero.png`: NDA-safe cover only |

Optional covers show nothing while missing (no placeholder), because these are internal tools under NDA.
