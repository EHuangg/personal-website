import { siteConfig } from "@personal-website/shared"
import { EditorState, Section } from "./types"

function id() { return Math.random().toString(36).slice(2, 9) }

export function getDefaultEditorState(): EditorState {
  const sections: Section[] = [
    {
      id: id(), type: "text", locked: false,
      content: siteConfig.name,
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "2.4rem", fontWeight: "600", color: "#2a2318", padding: "2rem 2rem 0.5rem" },
    },
    {
      id: id(), type: "text", locked: false,
      content: siteConfig.bio,
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", color: "#6a5a42", padding: "0 2rem 1rem", lineHeight: "1.9" },
    },
    {
      id: id(), type: "divider", locked: false, content: "",
      style: { borderColor: "#c8b89a", borderWidth: "1px", margin: "0.5rem 2rem" },
    },
    {
      id: id(), type: "text", locked: false,
      content: "Experience",
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: "400", color: "#9a8a72", letterSpacing: "0.25em", padding: "1rem 2rem 0.5rem" },
    },
    ...siteConfig.experience.map((job) => ({
      id: id(), type: "text" as const, locked: false,
      content: `${job.company} — ${job.role} (${job.period})`,
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", color: "#2a2318", fontWeight: "600", padding: "0.25rem 2rem" },
    })),
    {
      id: id(), type: "divider", locked: false, content: "",
      style: { borderColor: "#c8b89a", borderWidth: "1px", margin: "0.5rem 2rem" },
    },
    {
      id: id(), type: "text", locked: false,
      content: "Projects",
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", fontWeight: "400", color: "#9a8a72", letterSpacing: "0.25em", padding: "1rem 2rem 0.5rem" },
    },
    ...siteConfig.projects.map((project) => ({
      id: id(), type: "button" as const, locked: false,
      content: `${project.name} ↗`,
      href: project.url,
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", color: "#2a2318", fontWeight: "600", padding: "0.25rem 2rem", background: "transparent" },
    })),
    {
      id: id(), type: "divider", locked: false, content: "",
      style: { borderColor: "#c8b89a", borderWidth: "1px", margin: "0.5rem 2rem" },
    },
    {
      id: id(), type: "tags", locked: false, content: "Contact",
      tags: ["github", "email", "linkedin"],
      style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#6a5a42", padding: "0.5rem 2rem 2rem" },
    },
  ]

  return {
    sections,
    globalStyles: { background: "#f5f0e8", fontFamily: "'IBM Plex Mono', monospace", primaryColor: "#2a2318", textColor: "#2a2318" },
    paintStrokes: [],
  }
}