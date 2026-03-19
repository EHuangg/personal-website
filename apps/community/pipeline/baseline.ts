import { siteConfig } from "@personal-website/shared"

// Generates a clean HTML baseline from siteConfig
// This is passed to the LLM as the "current site" when no snapshot exists
export function getBaselineHTML(): string {
  const experience = siteConfig.experience.map((job) => `
    <div class="job">
      <div class="job-header">
        <div>
          <span class="job-company">${job.company}</span>
          <span class="job-role">${job.role}</span>
        </div>
        <span class="job-period">${job.period}</span>
      </div>
      <ul class="job-points">
        ${job.points.map((p) => `<li>${p}</li>`).join("\n")}
      </ul>
      <div class="job-tags">
        ${job.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")}
      </div>
    </div>
  `).join("\n")

  const projects = siteConfig.projects.map((p) => `
    <div class="project">
      <a href="${p.url}" target="_blank" class="project-name">${p.name} ↗</a>
      <p class="project-desc">${p.description}</p>
      <div class="project-tags">
        ${p.tags.map((t) => `<span class="tag">${t}</span>`).join(" ")}
      </div>
    </div>
  `).join("\n")

  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
  :root {
    --bg: #f5f0e8;
    --ink: #2a2318;
    --ink-light: #6a5a42;
    --ink-muted: #9a8a72;
    --ink-faint: #c8b89a;
    --font: 'IBM Plex Mono', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--ink); font-family: var(--font); }
  .page { max-width: 580px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  h1 { font-size: 2.2rem; font-weight: 600; margin-bottom: 1rem; }
  .contact-row { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .contact-row a { font-size: 0.8rem; color: var(--ink-light); text-decoration: none; }
  .contact-row a:hover { color: var(--ink); }
  hr { border: none; border-top: 1px solid var(--ink-faint); margin: 1.8rem 0; }
  .label { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 0.9rem; }
  .bio { font-size: 0.9rem; line-height: 1.9; color: var(--ink-light); }
  .job { border-left: 1px solid var(--ink-faint); padding-left: 1rem; margin-bottom: 1.6rem; }
  .job-header { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
  .job-company { font-weight: 600; font-size: 0.92rem; display: block; }
  .job-role { font-size: 0.78rem; color: var(--ink-muted); display: block; }
  .job-period { font-size: 0.72rem; color: var(--ink-muted); }
  .job-points { list-style: none; margin-bottom: 0.6rem; }
  .job-points li { font-size: 0.82rem; color: var(--ink-light); line-height: 1.65; padding-left: 0.75rem; border-left: 1px solid var(--ink-faint); margin-bottom: 0.3rem; }
  .project { margin-bottom: 1.2rem; }
  .project-name { font-size: 0.9rem; font-weight: 600; color: var(--ink); text-decoration: none; }
  .project-desc { font-size: 0.82rem; color: var(--ink-light); line-height: 1.7; margin-top: 0.2rem; }
  .tag { font-size: 0.65rem; border: 1px solid var(--ink-faint); padding: 0.1rem 0.4rem; color: var(--ink-muted); margin-right: 0.3rem; }
  .job-tags, .project-tags { margin-top: 0.5rem; }
</style>

<div class="page">
  <h1>${siteConfig.name}</h1>
  <div class="contact-row">
    <a href="${siteConfig.links.github}">github</a>
    <a href="mailto:${siteConfig.links.email}">email</a>
    <a href="${siteConfig.links.linkedin}">linkedin</a>
    <a href="${siteConfig.links.resume}" download>resume.pdf ↓</a>
  </div>

  <hr>
  <p class="label">about</p>
  <p class="bio">${siteConfig.bio}</p>

  <hr>
  <p class="label">experience</p>
  ${experience}

  <hr>
  <p class="label">projects</p>
  ${projects}
</div>`
}