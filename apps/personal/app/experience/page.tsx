"use client"

import { useEffect } from "react"
import { siteConfig } from "@personal-website/shared"
import gsap from "gsap"
import PageShell from "../components/PageShell"

export default function ExperiencePage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".noir-section-title",
        { opacity: 0, x: -80, rotation: -2 },
        { opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: "power4.out" }
      )
      gsap.fromTo(
        ".exp-entry",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out", delay: 0.3 }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <PageShell>
      <div className="noir-section-title">
        <span className="title-outline">WORK</span>
        <span className="title-red">EXPERIENCE</span>
      </div>

      <div className="noir-container">
        <div className="exp-entries">
          {siteConfig.experience.map((exp) => (
            <div key={`${exp.company}-${exp.period}`} className="exp-entry">
              <div className="exp-head">
                <span className="exp-company">{exp.company}</span>
                <span className="exp-period">{exp.period}</span>
              </div>
              <p className="exp-role">{exp.role}</p>
              <ul className="exp-points">
                {exp.points.map((point) => (
                  <li key={point} className="exp-point">{point}</li>
                ))}
              </ul>
              <p className="exp-tags">{exp.tags.join("  ·  ")}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "clamp(40px, 5vw, 80px)" }} />
    </PageShell>
  )
}
