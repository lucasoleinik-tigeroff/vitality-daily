export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="section-label">{label}</span>
      <span aria-hidden style={{ width: 24, height: 2, background: "var(--color-accent)", borderRadius: 2 }} />
    </div>
  );
}
