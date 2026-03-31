export const siteConfig = {
  name: "Evan Huang",
  bio: `Hi! I’m Evan. I am a Canadian new grad based near Toronto. I enjoy building software, understanding how systems work, and solving technical problems from the ground up. 

Outside of tech, I’m also into basketball, soccer, and art.`,
  links: {
    github: "https://github.com/EHuangg",
    email: "evan.hu.huang@gmail.com",
    linkedin: "https://www.linkedin.com/in/evan-huang-187116179/",
    resume: "/Evan_Huang_Resume.pdf",
  },
  experience: [
    {
      company: "BlackBerry",
      role: "Network Engineer Intern",
      period: "Jan 2024 – Aug 2024",
      points: [
        "Built Python scripts to tune alert thresholds, reducing false positives by 70%.",
        "Created network monitoring dashboards for 100+ endpoints using Grafana.",
        "Maintained production network and cloud infrastructure across AWS and Linux.",
      ],
      tags: ["Python", "AWS", "Grafana", "Linux"],
    },
    {
      company: "Compugen Inc.",
      role: "Network Operations Intern",
      period: "Apr 2022 – Dec 2022",
      points: [
        "Diagnosed production incidents in Linux environments, reducing MTTR by 10%.",
        "Monitored Azure cloud infrastructure to maintain 99.9%+ availability SLAs.",
        "Documented troubleshooting protocols used to onboard new technical staff.",
      ],
      tags: ["Azure", "Linux"],
    },
  ],
  projects: [
    {
      name: "This Website",
      description: "Portfolio site built as a map-based interface for exploring my projects, and experience.",
      url: "https://github.com/EHuangg/personal-website",
      tags: ["Next.js", "TypeScript", "PostgreSQL"],
    },
    {
      name: "Server Monitor",
      description: "Public monitoring dashboard for my homelab, with live system and service telemetry.",
      url: "https://server.evan-huang.dev",
      tags: ["threeJS", "animeJS", "TypeScript", "Python", "Linux"],
    },
    {
      name: "Live Subtitles",
      description: "Desktop captioning app with per-application audio splitting and local speech-to-text LLM.",
      url: "https://github.com/EHuangg/Live-Subtitles",
      tags: ["JavaScript", "Python", "C++"],
    },
    {
      name: "Yamagotchi",
      description: "Fantasy Basketball toolbar that shows live scores, player stats, and matchup updates.",
      url: "https://github.com/EHuangg/Yamagotchi",
      tags: ["Python", "Node.js"],
    },
  ],
}
