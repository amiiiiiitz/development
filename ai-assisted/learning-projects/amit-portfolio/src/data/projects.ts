export type ProjectCategory = 'ai-assisted' | 'built-from-scratch'
export type ProjectStatus = 'completed' | 'in-progress'

export const projectCategories: ProjectCategory[] = ['ai-assisted', 'built-from-scratch']
export const projectCategoryLabels: Record<ProjectCategory, string> = {
  'ai-assisted': 'AI-Assisted',
  'built-from-scratch': 'Built from Scratch',
}
export const projectStatusLabels: Record<ProjectStatus, string> = {
  completed: 'Completed',
  'in-progress': 'In Progress',
}

type CaseStudy = {
  story?: string
  problem?: string
  intendedSolution?: string
challenge?: string
  contribution?: string
  approach?: string
  architecture?: string
  implementation?: string
  features?: string[]
  decisions?: { decision: string; reason: string }[]
  aiWorkflow?: string
  verification?: string
  results?: string
  lessons?: string
  limitations?: string[]
  nextSteps?: string[]
  setup?: string[]
}

type ProjectResources = {
  liveDemo?: string
  sourceCode?: string
  readme?: string
}

export type Project = {
  number: string
  slug: string
  title: string
  subtitle: string
  description: string
  featured: boolean
  status: ProjectStatus
  category: ProjectCategory
  stack: string[]
  learning: string
  accent: 'cyan' | 'violet'
  visual: 'erp' | 'agent' | 'rag' | 'portfolio'
  caseStudy?: CaseStudy
  resources?: ProjectResources
}

const projects: Project[] = [
  {
    number: '01', slug: 'amit-personal-portfolio', title: "Amit's Personal Portfolio", subtitle: 'STORY-LED ENGINEERING',
    description: 'A recruiter-focused portfolio that connects my projects, learning, and direction toward practical AI engineering.',
    featured: true, status: 'completed', category: 'ai-assisted', stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'React Router', 'Motion', 'Lucide React'],
    learning: 'Continue refining the portfolio as genuine implementation evidence, project details, and verified contact resources become available.',
    accent: 'violet', visual: 'portfolio',
    resources: {
      liveDemo: 'https://amit-hasan-portfolio.vercel.app/',
      sourceCode: 'https://github.com/amiiiiiitz/development/tree/main/ai-assisted/learning-projects/amit-portfolio',
      readme: 'https://github.com/amiiiiiitz/development/blob/main/ai-assisted/learning-projects/amit-portfolio/README.md',
    },
    caseStudy: {
      story: 'The portfolio is intended to present an early-career developer’s direction and evidence as one connected story, rather than imply expertise through a long skills list. The brief established a cinematic dark editorial direction and a clear path through experience, projects, recognition, personal background, and contact.',
      problem: 'An early-career portfolio needs to make current learning and future direction easy to understand while distinguishing implemented work from future direction.',
      challenge: 'The design needs to feel engaging without using fabricated product screenshots, outcomes, or credentials as evidence.',
      contribution: 'Built through iterative AI-assisted implementation from the user’s product direction and supplied personal context. The user steered and reviewed requested refinements. A detailed tool-by-tool development log is not available.',
      approach: 'Keep project and personal information in typed data modules, reuse shared cards and navigation, and label technology accurately.',
      architecture: 'React and TypeScript render the homepage and dedicated /projects route. React Router handles navigation; Tailwind CSS v4 styles the interface; Motion provides restrained reveals and scroll effects; Lucide React supplies icons.',
      implementation: 'The current repository contains the responsive portfolio, shared header and footer, a homepage story, a project overview with expandable case studies, data-driven project and achievement content, and reduced-motion handling.',
      features: ['Story-led homepage and section navigation', 'Two-category project overview and expandable case studies', 'Central typed project, profile, and achievement data', 'Responsive layouts and reduced-motion support'],
      decisions: [
        { decision: 'Keep case-study content in the project data model.', reason: 'New projects can use the shared layout without embedding their copy into UI components.' },
        { decision: 'Label illustrative previews explicitly.', reason: 'The visual presentation should not imply that previews are real product screenshots.' },
      ],
      aiWorkflow: 'AI-assisted coding and iteration are supported by the project history. Specific prompts, per-feature tool usage, and a complete human review log have not been recorded, so those details are intentionally left open.',
      verification: 'The current implementation was checked with npm run build and npm run lint; both passed in the latest recorded run. Local requests to / and /projects returned HTTP 200. Browser-based visual and responsive verification was not available in that run.',
      results: 'The portfolio and its /projects route are present in this repository, with public demo, source, and README links.',
      lessons: 'Clear status labels and centralized content make it easier to show learning honestly while the project work is still developing.',
      limitations: ['No genuine project-product screenshots are configured.', 'Some personal and recognition details still need verification.'],
      nextSteps: ['Add genuine project screenshots and implementation notes as projects progress.', 'Recheck the experience at mobile and tablet widths in a browser.'],
      setup: ['npm install', 'npm run dev'],
    },
  },
]

export default projects

export function getPublishedProjects<T extends Pick<Project, 'featured'>>(items: readonly T[]) {
  return items.filter((project) => project.featured)
}

export function getFeaturedProjects<T extends Pick<Project, 'featured' | 'status'>>(items: readonly T[]) {
  return getPublishedProjects(items).filter((project) => project.status === 'completed')
}

export const publishedProjects = getPublishedProjects(projects)
export const featuredProjects = getFeaturedProjects(projects)