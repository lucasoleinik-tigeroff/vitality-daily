import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

function CoachPage() {
  return (
    <div className="px-5 pt-5 pb-24">
      <h1 className="text-2xl font-bold">Coach</h1>
      <p className="text-sm text-muted-foreground">Guidance and resources for your journey</p>

      <div className="mt-6 p-5 rounded-xl bg-surface border border-border text-center">
        <p className="text-sm text-muted-foreground">Coming in the next phase: weekly messages, ebook library, and the AI Coach (when activated).</p>
      </div>
    </div>
  );
}
