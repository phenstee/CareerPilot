import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ApplicationStage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { StageDot, stageStyle } from "@/components/ui/stage";
import { Wordmark } from "@/components/ui/wordmark";

type SampleCard = {
  title: string;
  company: string;
  due: string;
  soon?: boolean;
  next?: string;
};

/** Static sample data for the showcase board. Labelled as such on the page. */
const sampleBoard: { stage: ApplicationStage; cards: SampleCard[] }[] = [
  {
    stage: "Preparing",
    cards: [
      {
        title: "Backend Engineering Intern",
        company: "Northstar Robotics",
        due: "Due Nov 20 · In 3 days",
        soon: true,
        next: "Draft backend-focused cover letter"
      },
      {
        title: "Full-stack Product Intern",
        company: "Maple Health",
        due: "Due Dec 8",
        next: "Ask Mina Patel for a referral"
      }
    ]
  },
  {
    stage: "Applied",
    cards: [
      {
        title: "Frontend Platform Intern",
        company: "Northwind Commerce",
        due: "Due Dec 1",
        next: "Prepare React project walkthrough"
      },
      {
        title: "Software Developer Co-op",
        company: "Harbourline Bank",
        due: "No deadline",
        next: "Follow up on Nov 24"
      }
    ]
  },
  {
    stage: "Interview",
    cards: [
      {
        title: "AI Engineering Intern",
        company: "Boreal AI Labs",
        due: "Due Nov 26",
        next: "Practice behavioral and ML fundamentals"
      }
    ]
  },
  { stage: "Offer", cards: [] }
];

const aiDoes = [
  "Finds postings that match your profile or a description you write",
  "Drafts an application preview and cover letter for you to edit",
  "Writes a prep plan and practice questions for one specific role",
  "Gives structured feedback on answers you type"
];

const aiDoesNot = [
  "Submit applications or fill in forms on other sites",
  "Change your profile, resume or tracker without you saving it",
  "Run on its own. Nothing is generated until you ask.",
  "Need to be used at all. The tracker works on its own."
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-bar w-full max-w-marketing items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark href="/" />
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className="button button-ghost">
            Sign in
          </Link>
          <Link href="/register" className="button button-primary">
            Create account
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-marketing px-4 pb-12 pt-10 sm:px-6 lg:pb-14 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-3 lg:items-end lg:gap-16">
            <div className="lg:col-span-2">
              <h1 className="font-serif text-display-1 font-medium text-ink">
                Track every internship application in one place, and{" "}
                <em className="voice highlight-stroke">
                  prepare for each one.
                </em>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-2">
                Save postings, move each application through its stages, keep
                deadlines in view, and get a prep plan and practice questions
                written for the specific role.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="button button-primary button-lg"
                >
                  Create account
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="/login" className="button button-ghost button-lg">
                  Sign in
                </Link>
              </div>
            </div>
            <aside className="border-l-2 border-highlight pl-5">
              <p className="font-serif text-xl font-medium text-ink">
                The tracker works on its own.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                AI features are optional and only run when you click Generate.
                Nothing is ever submitted for you.
              </p>
            </aside>
          </div>
        </section>

        <div className="mx-auto max-w-marketing px-4 sm:px-6">
          <figure className="overflow-hidden rounded-3xl bg-accent-deep px-4 pt-5 sm:px-8 sm:pt-7">
            <figcaption className="mb-4 flex justify-between gap-4 text-meta text-cream-muted">
              <span>Your applications board</span>
              <span>Sample data</span>
            </figcaption>
            <div className="flex h-80 gap-3 overflow-hidden sm:h-96 lg:grid lg:grid-cols-4">
              {sampleBoard.map((column) => (
                <section
                  key={column.stage}
                  aria-label={column.stage}
                  className="flex w-64 flex-none flex-col rounded-t-xl bg-sunken p-1.5 lg:w-auto"
                >
                  <div
                    className={`mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2.5 ${stageStyle[column.stage].tint}`}
                  >
                    <StageDot stage={column.stage} />
                    <h2 className="text-sm font-semibold text-ink">
                      {column.stage}
                    </h2>
                    <span className="tabular ml-auto font-serif text-count font-medium text-ink">
                      {column.cards.length}
                    </span>
                  </div>
                  {column.cards.length > 0 ? (
                    <ul className="space-y-1.5">
                      {column.cards.map((card) => (
                        <li
                          key={card.title}
                          className={`relative rounded-lg border border-line bg-surface py-3 pl-4 pr-3 before:absolute before:bottom-3 before:left-1.5 before:top-3 before:w-1 before:rounded-full before:content-[''] ${stageStyle[column.stage].edge}`}
                        >
                          <h3 className="text-sm font-semibold leading-5 text-ink">
                            {card.title}
                          </h3>
                          <p className="mt-0.5 text-meta text-ink-2">
                            {card.company}
                          </p>
                          <div className="mt-2.5">
                            <Badge tone={card.soon ? "warning" : "neutral"}>
                              {card.due}
                            </Badge>
                          </div>
                          {card.next ? (
                            <p className="mt-2 text-meta text-muted">
                              {card.next}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-1 rounded-lg border border-dashed border-line-ui px-3 py-4 text-center text-meta text-muted">
                      Nothing here yet
                    </p>
                  )}
                </section>
              ))}
            </div>
          </figure>
        </div>

        <section
          aria-labelledby="prep-heading"
          className="mx-auto grid max-w-marketing gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28"
        >
          <div>
            <p className="voice text-lg">Prep</p>
            <h2
              id="prep-heading"
              className="mt-1 font-serif text-display-2 font-medium text-ink"
            >
              Prep for the posting, not the job title.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-ink-2">
              Pick a saved job and CareerPilot compares its requirements with
              your profile and resume. You see what you can already point to,
              what&apos;s missing, and a short plan for the gaps.
            </p>
          </div>
          <figure className="surface space-y-1.5 p-1.5">
            <figcaption className="sr-only">Example role analysis</figcaption>
            <EvidenceRow
              title="Python and FastAPI services"
              quote="“Resume Parser Lab: Python, Pydantic, pytest”, from your projects"
            />
            <EvidenceRow
              title="PostgreSQL-backed workflows"
              quote="“CareerPilot full-stack career tracker”, from your experience"
            />
            <EvidenceRow
              gap
              title="Robotics or embedded exposure"
              quote="Not in your profile yet. Prepare one example of working with hardware APIs or simulators."
            />
          </figure>
        </section>

        <section
          aria-labelledby="ai-heading"
          className="bg-accent-deep py-20 text-cream lg:py-28"
        >
          <div className="mx-auto max-w-marketing px-4 sm:px-6">
            <p className="font-serif text-lg italic text-highlight">
              Straight answers
            </p>
            <h2
              id="ai-heading"
              className="mt-1 font-serif text-display-2 font-medium text-cream"
            >
              What the AI does and doesn&apos;t do
            </h2>
            <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-12">
              <AiList title="Does, when you click Generate" items={aiDoes} />
              <AiList title="Doesn't" items={aiDoesNot} hollow />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-marketing flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Wordmark />
        <p className="text-meta text-muted">
          An application tracker and prep workspace for students applying to
          internships and co-ops.
        </p>
      </footer>
    </div>
  );
}

function EvidenceRow({
  title,
  quote,
  gap = false
}: {
  title: string;
  quote: string;
  gap?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3.5 ${
        gap ? "bg-highlight-subtle" : "bg-accent-subtle"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {gap ? <Badge tone="highlight">Gap · high</Badge> : null}
      </div>
      <p className="mt-1 font-serif text-body italic text-ink-2">{quote}</p>
    </div>
  );
}

function AiList({
  title,
  items,
  hollow = false
}: {
  title: string;
  items: string[];
  hollow?: boolean;
}) {
  return (
    <div>
      <h3 className="border-b border-cream/20 pb-3 font-serif text-xl italic text-cream">
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-b border-cream/15 py-4 text-sm leading-6 text-cream-muted"
          >
            <span
              aria-hidden="true"
              className={`mt-2 h-2 w-2 flex-none rounded-full ${
                hollow ? "border border-cream-muted" : "bg-highlight"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
