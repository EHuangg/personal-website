export const siteConfig = {
  name: "Evan Huang",
  bio: "Mathematics graduate from the University of Waterloo with experience in software development and network infrastructure. Outside of work, I enjoy basketball, soccer, and recently started exploring pixel art.",
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
      name: "this website",
      description: "A personal site slowly being rewritten by strangers on the internet.",
      url: "https://github.com/EHuangg/personal-website",
      tags: ["Next.js", "TypeScript", "PostgreSQL"],
    },
    {
      name: "Live Subtitles",
      description: "Desktop captioning app with per-application audio splitting and local speech-to-text.",
      url: "https://github.com/EHuangg/Live-Subtitles",
      tags: ["JavaScript", "Python", "C++"],
    },
    {
      name: "Yamagotchi",
      description: "Windows toolbar for ESPN Fantasy NBA with live stats.",
      url: "https://github.com/EHuangg/Yamagotchi",
      tags: ["Python", "Node.js"],
    },
  ],
}