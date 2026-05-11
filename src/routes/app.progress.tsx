import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div className="px-5 pt-5 pb-24">
      <h1 className="text-2xl font-bold">Progress</h1>
      <p className="text-sm text-muted-foreground">Your journey so far</p>

      <div className="mt-6 p-5 rounded-xl bg-surface border border-border text-center">
        <p className="text-sm text-muted-foreground">Coming in the next phase: vitality score chart, streak calendar, body metrics tracker, and weekly summary.</p>
      </div>
    </div>
  );
}
