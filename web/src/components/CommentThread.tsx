"use client";

import { useActionState, useState } from "react";
import { addCommentAction } from "@/lib/actions/social-actions";
import type { CommentNode } from "@/lib/comments";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(date: Date) {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function CommentBody({ comment, activityId }: { comment: CommentNode; activityId: string }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex gap-2.5">
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded border border-border-strong bg-surface text-[11px] font-semibold text-tertiary">
        {initialsOf(comment.user.displayName)}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold">{comment.user.displayName}</span>
          <span className="text-[10px] tracking-[0.1em] text-secondary">{relativeTime(comment.createdAt)}</span>
        </div>
        <div className="mt-1 text-[13px] leading-relaxed text-tertiary">{comment.body}</div>
        <button
          onClick={() => setReplying((r) => !r)}
          className="mt-1 text-[11px] font-semibold tracking-[0.1em] text-secondary"
        >
          REPLY
        </button>
        {replying && (
          <div className="mt-2">
            <AddCommentForm
              activityId={activityId}
              parentId={comment.id}
              autoFocus
              onSubmitted={() => setReplying(false)}
            />
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l border-border-weak pl-3">
            {comment.replies.map((reply) => (
              <CommentBody key={reply.id} comment={reply} activityId={activityId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AddCommentForm({
  activityId,
  parentId,
  autoFocus,
  onSubmitted,
}: {
  activityId: string;
  parentId?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const [state, formAction, pending] = useActionState(addCommentAction, undefined);
  const [value, setValue] = useState("");

  return (
    <form
      action={(formData) => {
        formAction(formData);
        setValue("");
        onSubmitted?.();
      }}
      className="flex items-center gap-2.5 rounded border border-border-strong px-3.5 py-3"
    >
      <input type="hidden" name="activityId" value={activityId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={parentId ? "Write a reply" : "Add a comment"}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-secondary"
      />
      <button type="submit" disabled={pending} className="text-[11px] font-bold tracking-[0.12em] text-accent">
        POST
      </button>
      {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
    </form>
  );
}

export function CommentThread({ comments, activityId }: { comments: CommentNode[]; activityId: string }) {
  return (
    <div id="comments" className="flex flex-col gap-4">
      {comments.map((c) => (
        <CommentBody key={c.id} comment={c} activityId={activityId} />
      ))}
      <AddCommentForm activityId={activityId} />
    </div>
  );
}
