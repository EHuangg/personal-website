"use client"

import { useEffect } from "react"
import { siteConfig } from "@personal-website/shared"
import gsap from "gsap"
import PageShell from "../components/PageShell"

export default function ProjectsPage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".noir-section-title",
        { opacity: 0, x: -80, rotation: -2 },
        { opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: "power4.out" }
      )
      gsap.fromTo(
        ".project-card",
        { opacity: 0, y: 40, rotation: () => gsap.utils.random(-1, 1) },
        { opacity: 1, y: 0, rotation: 0, duration: 0.6, stagger: 0.12, ease: "power3.out", delay: 0.3 }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <PageShell>
      <div className="noir-section-title">
        <span className="title-outline">MY</span>
        <span className="title-red">PROJECTS</span>
      </div>

      <div className="noir-container">
        <div className="project-entries">
          {siteConfig.projects.map((project, i) => (
            <div key={project.name} className="project-card">
              <span className="project-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="project-info">
                <h3>
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    {project.name} ↗
                  </a>
                </h3>
                <p className="project-desc">{project.description}</p>
                <p className="project-tags">{project.tags.join("  ·  ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "clamp(40px, 5vw, 80px)" }} />
    </PageShell>
  )
}
