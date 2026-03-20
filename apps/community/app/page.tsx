"use client"

import { useState, useEffect } from "react"
import { siteConfig } from "@personal-website/shared"

type QueueEntry = {
  id: string
  prompt: string
  displayName: string | null
  estimatedLiveDate: string
}

type Snapshot = {
  id: string
  htmlContent: string
  authorDisplayName: string | null
  isDefault: boolean
  createdAt: string
}

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; liveDate: string; position: number }
  | { status: "error"; message: string }

function ProtectedBar() {
  const [prompt, setPrompt] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" })
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [queueOpen, setQueueOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((data) => setQueue(data.queue ?? []))
      .catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!prompt.trim()) return
    setSubmitState({ status: "loading" })
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, displayName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitState({ status: "error", message: data.error ?? "Something went wrong." })
        return
      }
      setSubmitState({
        status: "success",
        liveDate: new Date(data.estimatedLiveDate).toLocaleDateString("en-CA", {
          year: "numeric", month: "long", day: "numeric",
        }),
        position: data.queuePosition,
      })
      setPrompt("")
      setDisplayName("")
      setFormOpen(false)
      fetch("/api/queue").then((r) => r.json()).then((d) => setQueue(d.queue ?? [])).catch(() => {})
    } catch {
      setSubmitState({ status: "error", message: "Network error. Please try again." })
    }
  }

  return (
    <div className="protected-bar">
      <div className="protected-bar-inner">

        {/* Left: personal site link */}
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="bar-personal-link"
        >
          evan huang ↗
        </a>

        {/* Center: queue indicator */}
        <div className="bar-queue-wrap">
          <button className="bar-queue-btn" onClick={() => setQueueOpen((o) => !o)}>
            {queue.length === 0
              ? "no changes queued"
              : `${queue.length} queued`}
            <span className={`bar-chevron ${queueOpen ? "bar-chevron--open" : ""}`}>▾</span>
          </button>
          {queueOpen && queue.length > 0 && (
            <div className="bar-queue-dropdown">
              {queue.map((entry, i) => (
                <div key={entry.id} className="bar-queue-entry">
                  <span className="bar-queue-pos">#{i + 1}</span>
                  <span className="bar-queue-prompt">{entry.prompt}</span>
                  <span className="bar-queue-date">
                    {new Date(entry.estimatedLiveDate).toLocaleDateString("en-CA", {
                      month: "short", day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: rewrite button */}
        <button
          className="bar-rewrite-btn"
          onClick={() => { setFormOpen((o) => !o); setSubmitState({ status: "idle" }) }}
        >
          {formOpen ? "close" : "Find this website boring? rewrite it ->"}
        </button>
      </div>

      {/* Expandable form */}
      {formOpen && (
        <div className="bar-form-wrap">
          {submitState.status === "success" ? (
            <div className="bar-success">
              <span>queued at #{submitState.position} — live {submitState.liveDate}</span>
              <button className="bar-success-again" onClick={() => { setSubmitState({ status: "idle" }); setFormOpen(true) }}>
                submit another
              </button>
            </div>
          ) : (
            <div className="bar-form">
              <textarea
                className="bar-textarea"
                placeholder="make it dark mode / add a giant elephant / redesign as a retro terminal..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                rows={2}
              />
              <div className="bar-form-row">
                <input
                  className="bar-name-input"
                  placeholder="your name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                />
                <button
                  className="bar-submit-btn"
                  onClick={handleSubmit}
                  disabled={submitState.status === "loading" || !prompt.trim()}
                >
                  {submitState.status === "loading" ? "sending..." : "submit →"}
                </button>
              </div>
              {submitState.status === "error" && (
                <p className="bar-error">{submitState.message}</p>
              )}
              <p className="bar-hint">once per day · 3 per week · no accounts needed</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/snapshot")
      .then((r) => r.json())
      .then((data) => {
        setSnapshot(data.snapshot)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Show default only when there is genuinely no community build ever
  const hasContent = snapshot && !snapshot.isDefault && snapshot.htmlContent

  return (
    <>
      <ProtectedBar />
      {loading ? (
        <div style={{ padding: "4rem 2rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#9a8a72" }}>
          loading...
        </div>
      ) : hasContent ? (
        <iframe
          className="community-iframe"
          srcDoc={snapshot!.htmlContent}
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="community site"
        />
      ) : (
        <DefaultSite />
      )}
    </>
  )
}

const tagIcons: Record<string, string> = {
  "Python":      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 3.5 7 5.5V8h5v1H5.5C3.5 9 2 10.5 2 13s1.5 4 3.5 4H7v-2.5c0-2 2-3.5 5-3.5s5 1.5 5 3.5V17h1.5c2 0 3.5-1.5 3.5-4s-1.5-4-3.5-4H17V8h-5V5.5C12 3.5 14 2 17 2"/><circle cx="9.5" cy="5.5" r="0.75" fill="currentColor" stroke="none"/><circle cx="14.5" cy="18.5" r="0.75" fill="currentColor" stroke="none"/></svg>`,
  "JavaScript":  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M7 16.5c0 1 .5 1.5 1.5 1.5S10 17.5 10 16V11M13 11v4c0 1.5.5 2.5 2 2.5s2-1 2-2"/></svg>`,
  "TypeScript":  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M7 11h10M12 11v8M17 13.5c-.5-2-4-2.5-4 0s4 1.5 4 3.5-3.5 2.5-4.5.5"/></svg>`,
  "C++":         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3C7 3 4 7 4 12s3 9 8 9 8-4 8-9"/><path d="M15 10h4M17 8v4M20 13h4M22 11v4"/></svg>`,
  "Node.js":     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L3 7v5c0 5 4 9 9 10 5-1 9-5 9-10V7L12 2z"/><path d="M9 12l2 2 4-4"/></svg>`,
  "Next.js":     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 8.5l7 9M15 8.5v7"/></svg>`,
  "PostgreSQL":  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v5c0 1.5 3 2.5 7 2.5s7-1 7-2.5V6"/><path d="M5 11v5c0 1.5 3 2.5 7 2.5s7-1 7-2.5v-5"/></svg>`,
  "AWS":         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 15.5C4 14.5 3 12.5 3 11c0-2 1.5-3.5 3.5-3.5.3 0 .5 0 .8.1C7.8 5.9 9.8 4 12.5 4c2.5 0 4.5 1.5 5 3.5H18c2 0 3 1.5 3 3s-1 3-3 3h-1"/><path d="M8 19l2-2-2-2M10 17h6M16 19l2-2-2-2"/></svg>`,
  "Azure":       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 3L5 19h6l2-4h4l2 4h-4M13 3l4 8h-4"/></svg>`,
  "Linux":       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C9 2 7 5 7 9c0 2 .5 4 1.5 5.5L7 17c-1 1.5-.5 3 1 3h8c1.5 0 2-1.5 1-3l-1.5-2.5C16.5 13 17 11 17 9c0-4-2-7-5-7z"/><circle cx="10" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="9" r="1" fill="currentColor" stroke="none"/><path d="M10 13.5s1 1 2 0"/></svg>`,
  "Grafana":     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  "React":       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  "SQL":         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="6" rx="7" ry="2"/><path d="M5 6v4c0 1 3 2 7 2s7-1 7-2V6"/><path d="M5 10v4c0 1 3 2 7 2s7-1 7-2v-4"/><path d="M5 14v4c0 1 3 2 7 2s7-1 7-2v-4"/></svg>`,
  "Spark":       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z"/></svg>`,
  "Bash":        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>`,
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="tags">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tagIcons[tag] && (
            <span className="tag-icon" dangerouslySetInnerHTML={{ __html: tagIcons[tag] }} />
          )}
          {tag}
        </span>
      ))}
    </div>
  )
}

function Job({ job }: { job: typeof siteConfig.experience[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="job">
      <button className="job-header" onClick={() => setOpen((o) => !o)}>
        <div className="job-header-left">
          <span className="job-company">{job.company}</span>
          <span className="job-role">{job.role}</span>
        </div>
        <div className="job-header-right">
          <span className="job-period">{job.period}</span>
          <span className={`job-chevron ${open ? "job-chevron--open" : ""}`}>▾</span>
        </div>
      </button>
      <div className={`job-body ${open ? "job-body--open" : ""}`}>
        <ul className="job-points">
          {job.points.map((pt, i) => <li key={i}>{pt}</li>)}
        </ul>
        <Tags tags={job.tags} />
      </div>
    </div>
  )
}

function DefaultSite() {
  return (
    <main className="paper">
      <div className="content">
        <header>
          <h1 className="name">{siteConfig.name}</h1>
          <div className="contact-row">
            <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className="contact-link">github</a>
            <a href={`mailto:${siteConfig.links.email}`} className="contact-link">email</a>
            <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">linkedin</a>
            <a href={siteConfig.links.resume} download className="resume-link">resume.pdf ↓</a>
          </div>
        </header>
        <hr className="divider" />
        <section>
          <p className="section-label">about</p>
          <p className="bio">{siteConfig.bio}</p>
        </section>
        <hr className="divider" />
        <section>
          <p className="section-label">experience</p>
          <div className="experience-list">
            {siteConfig.experience.map((job) => <Job key={job.company} job={job} />)}
          </div>
        </section>
        <hr className="divider" />
        <section>
          <p className="section-label">projects</p>
          <div className="project-list">
            {siteConfig.projects.map((project) => (
              <div key={project.name} className="project">
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-name">
                  {project.name} ↗
                </a>
                <p className="project-desc">{project.description}</p>
                <Tags tags={project.tags} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
