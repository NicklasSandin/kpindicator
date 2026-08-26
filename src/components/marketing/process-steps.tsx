import { PROCESS_STEPS } from "@/content/process";
import { cn } from "@/lib/utils";

export function ProcessSteps({ compact = false }: { compact?: boolean }) {
  const steps = compact ? PROCESS_STEPS.slice(0, 7) : PROCESS_STEPS;

  return (
    <ol className="relative">
      <div
        aria-hidden
        className="absolute top-0 bottom-0 left-[19px] w-px bg-border sm:left-[23px]"
      />
      {steps.map((step, i) => (
        <li key={step.step} className={cn("relative flex gap-5 pb-10", i === steps.length - 1 && "pb-0")}>
          <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground sm:size-12">
            {step.step}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{step.title}</h3>
              <span className="text-xs font-medium text-muted-foreground">{step.duration}</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-[15px]">
              {compact ? step.summary : step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
