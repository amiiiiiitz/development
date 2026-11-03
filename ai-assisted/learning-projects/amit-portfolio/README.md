# Amit Hasan Simanto — Personal Portfolio

A personal portfolio website showcasing my background, development projects, technical interests, academic achievements, and journey toward becoming an AI Engineer.

**Live Portfolio:** [amit-hasan-portfolio.vercel.app](https://amit-hasan-portfolio.vercel.app/)

## Overview

This project is my personal portfolio, built to present my work, academic background, and ongoing development as a Computer Science and Engineering student.

It is a multi-page web application featuring dedicated sections for projects, achievements, experience, research interests, and professional information.

## Features

- **Home** — Introduction, technical interests, and career direction.
- **Projects** — Development projects with their objectives and implementation details.
- **Achievements** — Academic recognition and programming contest achievements.
- **About** — Academic background, learning journey, and technical interests.
- **Experience** — Relevant experience and practical work.
- **Resume** — Resume access and download functionality.
- **Publications** — A dedicated section for research and publications.
- **Contact** — Professional profiles and contact information.
- **Responsive Design** — Layouts adapted for different screen sizes.
- **Interactive UI** — Page transitions, motion effects, and reusable components.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and production build |
| Tailwind CSS v4 | Styling and responsive layouts |
| Motion for React | Animations and transitions |
| React Router | Multi-page navigation |
| Lucide React | Interface icons |
| Vercel | Deployment and hosting |

## Design Approach

The portfolio uses a dark visual theme with restrained gold accents, minimal layouts, and purposeful motion.

Development priorities include:

- Clear content hierarchy and readable typography.
- Consistent navigation and visual identity.
- Reusable components and maintainable code.
- Responsive layouts across screen sizes.
- Meaningful animations with consideration for reduced-motion preferences.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- npm (included with Node.js)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/amiiiiiitz/development.git
```

**2. Navigate to the portfolio directory**

```bash
cd development/ai-assisted/learning-projects/amit-portfolio
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
amit-portfolio/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Resume

The homepage includes a resume download feature. The PDF can be configured through `resumePdfUrl` in `src/data/profile.ts`, with the file stored in the `public/` directory.

Until a resume is configured, the button displays a notification that it will be available soon.

## Deployment

The application is deployed on Vercel.

When connected to the GitHub repository, pushing changes to the configured deployment branch can trigger automatic deployments.

## Connect With Me

- **GitHub:** [@amiiiiiitz](https://github.com/amiiiiiitz)
- **LinkedIn:** [Amit Hasan Simanto](https://www.linkedin.com/in/amit-hasan-simanto-301694346/)
- **Codeforces:** [amit.hasan2730](https://codeforces.com/profile/amit.hasan2730)
- **Email:** [amit.hasan2730@gmail.com](mailto:amit.hasan2730@gmail.com)

## About Me

I'm a third-year Computer Science and Engineering student at IUBAT, aspiring to become an AI Engineer.

My interests include Python, applied AI, large language models (LLMs), retrieval-augmented generation (RAG), AI agents, and building practical applications that address real-world problems.

I'm focused on strengthening my engineering fundamentals and turning what I learn into useful, well-structured projects.

---

*Designed and developed by Amit Hasan Simanto.*
