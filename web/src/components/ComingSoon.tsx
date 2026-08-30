export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-sm font-semibold tracking-[0.12em]">{title}</p>
      <p className="max-w-[260px] text-sm text-secondary">Landing in {phase}.</p>
    </div>
  );
}
