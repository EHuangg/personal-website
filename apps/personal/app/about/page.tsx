"use client"

import { useEffect } from "react"
import gsap from "gsap"
import PageShell from "../components/PageShell"

const SKILL_GROUPS = [
  { title: "Languages", items: ["TypeScript", "Python", "SQL", "C", "R"] },
  { title: "Frontend",  items: ["Next.js", "React", "JavaScript", "Tailwind", "Framer Motion"] },
  { title: "Backend",   items: ["Node.js", "PostgreSQL", "Supabase", "REST", "Spark"] },
  { title: "Systems",   items: ["AWS", "Azure", "Linux", "Docker", "Grafana"] },
]

export default function SkillsPage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".noir-section-title",
        { opacity: 0, x: -80, rotation: -2 },
        { opacity: 1, x: 0, rotation: 0, duration: 0.8, ease: "power4.out" }
      )
      gsap.fromTo(
        ".gsap-reveal",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.3 }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <PageShell>
      <div className="noir-section-title">
        <span className="title-outline">SKILL</span>
        <span className="title-red">SET</span>
      </div>

      <div className="noir-container">
        <div className="skills-grid gsap-reveal">
          {SKILL_GROUPS.map((group) => (
            <div key={group.title} className="skill-row">
              <span className="skill-cat">{group.title}</span>
              <span className="skill-items">{group.items.join("  ·  ")}</span>
            </div>
          ))}
        </div>

        <div style={{ paddingBottom: "clamp(40px, 5vw, 80px)" }} />
      </div>
    </PageShell>
  )
}
