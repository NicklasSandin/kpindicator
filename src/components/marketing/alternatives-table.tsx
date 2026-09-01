import { ALTERNATIVES, ALTERNATIVE_ROWS } from "@/content/alternatives";
import { Eyebrow, Reveal } from "@/components/marketing/section";

/**
 * The comparison, as a ledger rather than a grid.
 *
 * Four columns of prose never fit a viewport, so the old table shipped a
 * horizontal scrollbar — which hides the one column that matters until the
 * reader thinks to drag, and hides it completely from anyone who doesn't.
 *
 * Reading it down instead of across also matches the argument the section
 * makes: each row is one question, our answer is the finding, and the three
 * alternatives are what the answer is being measured against. So the answer
 * leads at reading size and the alternatives sit underneath it, recessive.
 *
 * Marked up as a description list because that is what it is — a term and its
 * answers — which also gives screen readers a sane reading order, something the
 * scrolling grid never had.
 */
export function AlternativesTable() {
  const featured = ALTERNATIVES.find((alt) => alt.featured) ?? ALTERNATIVES[ALTERNATIVES.length - 1];
  const others = ALTERNATIVES.filter((alt) => alt.id !== featured.id);

  return (
    <dl className="border-t border-rule">
      {ALTERNATIVE_ROWS.map((row, index) => (
        <Reveal
          key={row.feature}
          className="grid gap-x-10 gap-y-6 border-b border-rule py-9 lg:grid-cols-12 lg:py-10"
        >
          <dt className="lg:col-span-4">
            <Eyebrow index={String(index + 1).padStart(2, "0")}>{row.feature}</Eyebrow>
          </dt>

          <dd className="lg:col-span-8">
            {/* Our answer, at reading size. The amber rule is the only place
                signal colour appears in this component. */}
            <div className="border-l-2 border-signal pl-5">
              <p className="font-display text-[1.4rem] leading-[1.25] text-foreground sm:text-[1.7rem]">
                {row.values[featured.id]}
              </p>
              <p className="eyebrow mt-3 text-signal-ink">{featured.name}</p>
            </div>

            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-3">
              {others.map((alt) => (
                <div key={alt.id}>
                  <p className="eyebrow text-muted-foreground">{alt.name}</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {row.values[alt.id]}
                  </p>
                </div>
              ))}
            </div>
          </dd>
        </Reveal>
      ))}
    </dl>
  );
}
