import PageLayout from '../components/PageLayout'
import { ContactChapter } from '../components/StoryChapters'

function ContactPage() {
  return <PageLayout>
    <main className="min-h-[70vh]">
      <section className="section-wrap pt-12 sm:pt-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.42em] text-[var(--color-accent)]">Contact</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.92] tracking-tight text-white">Let&apos;s connect</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Open to conversations about practical AI applications, agent workflows, and thoughtful engineering.</p>
      </section>
      <ContactChapter />
    </main>
  </PageLayout>
}

export default ContactPage