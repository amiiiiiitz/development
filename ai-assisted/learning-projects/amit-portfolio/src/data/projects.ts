export type ProjectCategory = 'Built with AI Tools' | 'Built from Scratch'
export type ProjectStatus = 'Built' | 'In Progress' | 'Planned'

export const projectCategories: ProjectCategory[] = ['Built with AI Tools', 'Built from Scratch']

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
  status: ProjectStatus
  category: ProjectCategory
  stack: string[]
  technologyStatus: 'Planned' | 'Used'
  learning: string
  accent: 'cyan' | 'violet'
  visual: 'erp' | 'agent' | 'rag' | 'portfolio'
  caseStudy?: CaseStudy
  resources?: ProjectResources
  modulePhases?: { name: string; modules: string[] }[]
}

const projects: Project[] = [
  {
    number: '01', slug: 'amit-personal-portfolio', title: "Amit's Personal Portfolio", subtitle: 'STORY-LED ENGINEERING',
    description: 'A recruiter-focused portfolio that connects my projects, learning, and direction toward practical AI engineering.',
    status: 'Built', category: 'Built with AI Tools', stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'React Router', 'Motion', 'Lucide React'], technologyStatus: 'Used',
    learning: 'Continue refining the portfolio as genuine implementation evidence, project details, and verified contact resources become available.',
    accent: 'violet', visual: 'portfolio',
    resources: {
      liveDemo: 'https://amit-hasan-portfolio.vercel.app/',
      sourceCode: 'https://github.com/amiiiiiitz/development/tree/main/builtWithAI/amit-portfolio',
      readme: 'https://github.com/amiiiiiitz/development/blob/main/builtWithAI/amit-portfolio/README.md',
    },
    caseStudy: {
      story: 'The portfolio is intended to present an early-career developer’s direction and evidence as one connected story, rather than imply expertise through a long skills list. The brief established a cinematic dark editorial direction and a clear path through experience, projects, recognition, personal background, and contact.',
      problem: 'An early-career portfolio needs to make current learning and future direction easy to understand while distinguishing demonstrated work from planned concepts.',
      challenge: 'The content includes project ideas that are not implemented yet. The design therefore needs to feel engaging without using fabricated product screenshots, outcomes, or credentials as evidence.',
      contribution: 'Built through iterative AI-assisted implementation from the user’s product direction and supplied personal context. The user steered and reviewed requested refinements. A detailed tool-by-tool development log is not available.',
      approach: 'Keep project and personal information in typed data modules, reuse shared cards and navigation, and label planned technology separately from technology used by the portfolio itself.',
      architecture: 'React and TypeScript render the homepage and dedicated /projects route. React Router handles navigation; Tailwind CSS v4 styles the interface; Motion provides restrained reveals and scroll effects; Lucide React supplies icons.',
      implementation: 'The current repository contains the responsive portfolio, shared header and footer, a homepage story, a project overview with expandable case studies, data-driven project and achievement content, and reduced-motion handling.',
      features: ['Story-led homepage and section navigation', 'Two-category project overview and expandable case studies', 'Central typed project, profile, and achievement data', 'Responsive layouts and reduced-motion support'],
      decisions: [
        { decision: 'Keep case-study content in the project data model.', reason: 'New projects can use the shared layout without embedding their copy into UI components.' },
        { decision: 'Label planned concepts and illustrative previews explicitly.', reason: 'The visual presentation should not imply that unimplemented products are real.' },
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
  {
    number: '02', slug: 'real-estate-erp', title: 'Real Estate ERP', subtitle: 'PROPERTY OPERATIONS',
    description: 'A planned full-stack business system for coordinating property projects, inventory, customer relationships, bookings, and day-to-day operations.',
    status: 'Planned', category: 'Built with AI Tools', stack: ['React.js', 'FastAPI'], technologyStatus: 'Planned',
    learning: 'Shape requirements, make design decisions, build in manageable modules, and verify behavior. Any AI assistance and personal review will be documented as the work happens.',
    accent: 'cyan', visual: 'erp',
    caseStudy: {
      story: 'This concept is intended to bring property operations and related customer workflows into one business management system. No personal origin story or user research has been documented.',
      problem: 'The idea is to coordinate property project, inventory, customer, booking, and operational information in one place. User or stakeholder validation has not been documented.',
      challenge: 'The intended MVP spans several connected business workflows. Requirements, data relationships, permissions, and implementation trade-offs still need to be worked through.',
      contribution: 'Planned personal project. Implementation work is not present in the repository.',
      approach: 'Plan a staged MVP: first the five core modules, then basic collections, complaints, and reports. Authentication and basic role-based access are foundational requirements.',
      architecture: 'React.js frontend and FastAPI backend are intended. A database-backed architecture must be designed; no database choice, API contract, or schema is recorded.',
      implementation: 'Planning concept only. The repository contains no ERP implementation, working modules, or product screenshots.',
      features: ['Dashboard', 'Project Management', 'Inventory Management', 'Customer & Lead Management', 'Booking Management', 'Basic Collection Management', 'Customer Complaints', 'Basic Reports'],
      aiWorkflow: 'Planned as an AI-assisted build. Specific tools and any completed planning, prompting, code review, debugging, or testing have not been documented.',
      verification: 'No implementation or verification has been recorded yet.',
      limitations: ['All modules, authentication, access control, database design, implementation, and verification remain future work.', 'The need has not been validated with intended users.'],
      nextSteps: ['Clarify requirements and user roles.', 'Design data relationships and API boundaries.', 'Plan and build the first five core modules, then phase two.'],
    },
    modulePhases: [
      { name: 'MVP phase 1', modules: ['Dashboard', 'Project Management', 'Inventory Management', 'Customer & Lead Management', 'Booking Management'] },
      { name: 'MVP phase 2', modules: ['Basic Collection Management', 'Customer Complaints', 'Basic Reports'] },
    ],
  },
  {
    number: '03', slug: 'ai-agent-system', title: 'AI Agent System', subtitle: 'TOOL USE & TASKS',
    description: 'A planned application concept exploring how an agent could interpret a task, select a tool, and make its actions understandable.',
    status: 'Planned', category: 'Built from Scratch', stack: ['Python', 'LLMs', 'Tools'], technologyStatus: 'Planned',
    learning: 'Explore task decomposition, tool orchestration, validation, and clear boundaries around agent actions.',
    accent: 'violet', visual: 'agent',
    caseStudy: {
      problem: 'Explore how an application might turn a task request into understandable tool use and useful output.',
      intendedSolution: 'A concept for an AI agent application involving tools and task execution.',
      implementation: 'Planned concept; no implementation is documented.',
      verification: 'No implementation or verification has been recorded yet.',
      nextSteps: ['Choose a narrow task and define safe tool boundaries.', 'Document an implementation and verification plan before building.'],
    },
  },
  {
    number: '04', slug: 'rag-knowledge-assistant', title: 'RAG Knowledge Assistant', subtitle: 'RETRIEVAL & CONTEXT',
    description: 'A planned knowledge assistant concept focused on retrieving relevant source material to ground answers in context.',
    status: 'Planned', category: 'Built from Scratch', stack: ['Python', 'RAG', 'Embeddings'], technologyStatus: 'Planned',
    learning: 'Study document handling, retrieval quality, source grounding, and how to evaluate answers against their references.',
    accent: 'cyan', visual: 'rag',
    caseStudy: {
      problem: 'Explore a way to retrieve relevant information from a knowledge base when responding to a question.',
      intendedSolution: 'A knowledge assistant concept that connects retrieved source material to a grounded response.',
      implementation: 'Planned concept; no implementation is documented.',
      verification: 'No implementation or verification has been recorded yet.',
      nextSteps: ['Define a suitable knowledge source and evaluation questions.', 'Choose and document a retrieval approach before implementation.'],
    },
  },
]

export default projects