"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AgentActionProposal,
  AgentConversation,
  approveAgentProposal,
  rejectAgentProposal,
  sendAgentMessage
} from "@/lib/api";

const EXAMPLE_PROMPTS = [
  "Show my upcoming deadlines",
  "List my saved jobs",
  "Show my applications",
  "Move my Northstar Robotics application to Applied"
];

export function ControlledAgent() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<AgentConversation | null>(
    null
  );
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      sendAgentMessage({
        conversation_id: conversation?.id,
        message: text
      }),
    onSuccess: (response) => {
      setConversation(response.conversation);
      setMessage("");
      setError("");
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : "Unable to send.");
    }
  });

  const approveMutation = useMutation({
    mutationFn: approveAgentProposal,
    onSuccess: (proposal) => {
      setConversation((current) => replaceProposal(current, proposal));
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setError("");
    },
    onError: (caught) => {
      setError(
        caught instanceof Error ? caught.message : "Unable to approve proposal."
      );
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAgentProposal,
    onSuccess: (proposal) => {
      setConversation((current) => replaceProposal(current, proposal));
      setError("");
    },
    onError: (caught) => {
      setError(
        caught instanceof Error ? caught.message : "Unable to reject proposal."
      );
    }
  });

  const proposals = useMemo(
    () => conversation?.proposals ?? [],
    [conversation?.proposals]
  );
  const messages = conversation?.messages ?? [];
  const pendingProposalId =
    approveMutation.variables ?? rejectMutation.variables ?? null;

  function submit(text = message) {
    const cleaned = text.trim();
    if (!cleaned || sendMutation.isPending) return;
    sendMutation.mutate(cleaned);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="flex min-h-[620px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-md bg-lagoon/10 p-2 text-lagoon">
              <Bot aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Controlled career agent
              </h2>
              <p className="text-sm text-slate-600">
                Reads can run immediately. Changes require your approval.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm leading-6 text-slate-600">
                Ask about profile details, saved jobs, applications, deadlines,
                or resume suggestions. For updates, the agent will create a
                reviewable proposal first.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submit(prompt)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-lagoon/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((item) => (
            <div
              key={item.id}
              className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] whitespace-pre-line rounded-lg px-4 py-3 text-sm leading-6 ${
                  item.role === "user"
                    ? "bg-lagoon text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.content}
              </div>
            </div>
          ))}

          {sendMutation.isPending ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Thinking
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mx-5 mb-3 rounded-md border border-coral/20 bg-coral/10 px-3 py-2 text-sm text-orange-800">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="border-t border-slate-200 p-4"
        >
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              placeholder="Ask the agent to inspect data or propose a safe application update."
              className="min-h-14 flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !message.trim()}
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-lagoon text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              aria-label="Send message"
            >
              {sendMutation.isPending ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-md bg-lagoon/10 p-2 text-lagoon">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Approval queue</h2>
              <p className="text-sm text-slate-600">
                Database changes wait here.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {proposals.length === 0 ? (
              <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">
                No proposed changes yet.
              </p>
            ) : null}

            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                isPending={pendingProposalId === proposal.id}
                onApprove={() => approveMutation.mutate(proposal.id)}
                onReject={() => rejectMutation.mutate(proposal.id)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Allowed tools</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <ToolRow label="Read profile" />
            <ToolRow label="List saved jobs" />
            <ToolRow label="List applications" />
            <ToolRow label="Show deadlines" />
            <ToolRow label="Show resume suggestions" />
            <ToolRow label="Propose application stage update" />
            <ToolRow label="Propose follow-up date" />
            <ToolRow label="Propose next action" />
          </div>
        </section>
      </aside>
    </div>
  );
}

function ProposalCard({
  proposal,
  isPending,
  onApprove,
  onReject
}: {
  proposal: AgentActionProposal;
  isPending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canDecide = proposal.status === "proposed";
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{proposal.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {proposal.explanation}
          </p>
        </div>
        <span
          className={`rounded-md px-2 py-1 text-xs font-semibold ${
            proposal.status === "executed"
              ? "bg-lagoon/10 text-lagoon"
              : proposal.status === "rejected"
                ? "bg-coral/10 text-orange-800"
                : "bg-white text-slate-600"
          }`}
        >
          {proposal.status}
        </span>
      </div>

      <dl className="mt-3 space-y-2 rounded-md bg-white px-3 py-2 text-xs text-slate-600">
        {Object.entries(proposal.arguments).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-500">{formatLabel(key)}</dt>
            <dd className="text-right text-ink">{String(value ?? "None")}</dd>
          </div>
        ))}
      </dl>

      {canDecide ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <X aria-hidden="true" className="h-4 w-4" />
            )}
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-lagoon px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="h-4 w-4" />
            )}
            Approve
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ToolRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
      <Check aria-hidden="true" className="h-4 w-4 text-lagoon" />
      <span>{label}</span>
    </div>
  );
}

function replaceProposal(
  conversation: AgentConversation | null,
  proposal: AgentActionProposal
) {
  if (!conversation) return conversation;
  return {
    ...conversation,
    proposals: conversation.proposals.map((item) =>
      item.id === proposal.id ? proposal : item
    )
  };
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}
