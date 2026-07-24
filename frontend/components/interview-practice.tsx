"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mic,
  Send,
  Sparkles
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  answerInterviewQuestion,
  createInterviewSession,
  InterviewQuestion,
  InterviewSession,
  listInterviewSessions
} from "@/lib/api";

const categoryLabels: Record<InterviewQuestion["category"], string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  job_description: "Job description",
  projects_resume: "Projects and resume"
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function InterviewPractice() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["interviews", params.id],
    queryFn: () => listInterviewSessions(params.id)
  });

  const sessions = useMemo(
    () => sessionsQuery.data?.items ?? [],
    [sessionsQuery.data?.items]
  );
  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      null,
    [selectedSessionId, sessions]
  );
  const activeQuestion = activeSession?.questions[questionIndex] ?? null;

  const createMutation = useMutation({
    mutationFn: () => createInterviewSession(params.id),
    onSuccess: (session) => {
      setSelectedSessionId(session.id);
      setQuestionIndex(0);
      setAnswerText("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["interviews", params.id] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to generate interview prep."
      );
    }
  });

  const answerMutation = useMutation({
    mutationFn: () => {
      if (!activeSession || !activeQuestion) {
        throw new Error("Choose a question first.");
      }
      return answerInterviewQuestion({
        sessionId: activeSession.id,
        questionId: activeQuestion.id,
        answerText
      });
    },
    onSuccess: () => {
      setAnswerText("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["interviews", params.id] });
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to submit answer."
      );
    }
  });

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-lagoon"
        />
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <div className="rounded-lg border border-coral/20 bg-coral/10 p-5 text-sm text-orange-800">
        Unable to load interview prep.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-lagoon/10 p-2 text-lagoon">
            <Mic aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Interview sessions
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Generate questions from this application, then practice one answer
              at a time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-lagoon px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {createMutation.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          )}
          Generate prep session
        </button>

        {sessions.length > 0 ? (
          <div className="mt-5 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  setSelectedSessionId(session.id);
                  setQuestionIndex(0);
                  setAnswerText("");
                }}
                className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                  activeSession?.id === session.id
                    ? "border-lagoon bg-lagoon/5 text-ink"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="block font-semibold">
                  {session.questions.length} questions
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {formatDate(session.created_at)} - {session.provider}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            No interview prep sessions yet.
          </div>
        )}
      </aside>

      <section className="space-y-5">
        {formError ? (
          <div className="rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
            {formError}
          </div>
        ) : null}

        {activeSession && activeQuestion ? (
          <>
            <SessionOverview session={activeSession} />

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
                    Question {questionIndex + 1} of{" "}
                    {activeSession.questions.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    {categoryLabels[activeQuestion.category]}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIndex((value) => Math.max(0, value - 1))
                    }
                    disabled={questionIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous question"
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIndex((value) =>
                        Math.min(activeSession.questions.length - 1, value + 1)
                      )
                    }
                    disabled={
                      questionIndex === activeSession.questions.length - 1
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next question"
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-5 text-xl leading-8 text-ink">
                {activeQuestion.question_text}
              </p>
              {activeQuestion.rationale ? (
                <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                  {activeQuestion.rationale}
                </p>
              ) : null}

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  answerMutation.mutate();
                }}
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Practice answer
                  </span>
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    rows={9}
                    placeholder="Type your answer here..."
                    className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    answerMutation.isPending || answerText.trim().length === 0
                  }
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {answerMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <Send aria-hidden="true" className="h-4 w-4" />
                  )}
                  Submit for feedback
                </button>
              </form>
            </article>

            <FeedbackPanel question={activeQuestion} />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm leading-6 text-slate-600">
            Generate an interview prep session to start practicing.
          </div>
        )}
      </section>
    </div>
  );
}

function SessionOverview({ session }: { session: InterviewSession }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-normal text-lagoon">
        {session.company}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">
        {session.job_title}
      </h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <ListBlock title="Preparation plan" items={session.preparation_plan} />
        <ListBlock title="Strong topics" items={session.strong_topics} />
        <ListBlock title="Weak areas to review" items={session.weak_areas} />
      </div>
    </article>
  );
}

function FeedbackPanel({ question }: { question: InterviewQuestion }) {
  const latestAnswer = question.answers.at(-1);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-ink">Feedback</h3>
      {latestAnswer ? (
        <>
          <p className="mt-2 text-xs text-slate-500">
            {formatDate(latestAnswer.created_at)} - {latestAnswer.provider}
          </p>
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            {latestAnswer.feedback.overall_feedback}
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Strong"
              items={latestAnswer.feedback.strong_points}
            />
            <ListBlock
              title="Unclear"
              items={latestAnswer.feedback.unclear_points}
            />
            <ListBlock
              title="Missing"
              items={latestAnswer.feedback.missing_points}
            />
            <ListBlock
              title="Stronger structure"
              items={latestAnswer.feedback.stronger_answer_structure}
            />
            <ListBlock
              title="Improved outline"
              items={latestAnswer.feedback.improved_outline}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Submit an answer for this question to see structured feedback.
        </p>
      )}
    </article>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-md bg-slate-50 px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None yet.</p>
      )}
    </section>
  );
}
