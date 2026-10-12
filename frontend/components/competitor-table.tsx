//frontend\components\competitor-table.tsx
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { ApolloLogo, HunterLogo, LemlistLogo, ClayLogo } from "@/components/pricing-logos";
import { COMPARISON_ROWS, type ComparisonRow } from "@/lib/pricing-strategy";

type ColId = keyof Omit<ComparisonRow, "feature">;

export function CompetitorTable({ compact = false }: { compact?: boolean }) {
  const iconSize = compact ? "size-6" : "size-9 md:size-10";

  const cols: { id: ColId; label: string; logo: React.ReactNode; highlight: boolean }[] = [
    {
      id: "leadcortex",
      label: "LeadCortex",

      logo: (
        <BrandLogoMark
          aria-label=""
          size="100%"
          className={`block shrink-0 text-foreground ${iconSize}`}
        />
      ),
      highlight: true,
    },
    {
      id: "apollo",
      label: "Apollo.io",
      logo: <ApolloLogo className={iconSize} />,
      highlight: false,
    },
    {
      id: "hunter",
      label: "Hunter.io",
      logo: <HunterLogo className={iconSize} />,
      highlight: false,
    },
    {
      id: "lemlist",
      label: "Lemlist",
      logo: <LemlistLogo className={iconSize} />,
      highlight: false,
    },
    { id: "clay", label: "Clay", logo: <ClayLogo className={iconSize} />, highlight: false },
  ];

  const cell = compact ? "px-2 py-2" : "px-3 py-3 md:px-4";
  const head = compact ? "px-2 py-3" : "px-3 py-4 md:px-4";

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <table
        className={`w-full table-fixed ${
          compact ? "min-w-[680px] text-[11px]" : "min-w-[960px] text-xs md:text-sm"
        }`}
      >
        <thead>
          <tr className="border-b border-border">
            <th
              className={`${compact ? "w-[24%]" : "w-[22%]"} ${head} text-left align-middle font-medium text-muted-foreground`}
            >
              Fonctionnalité
            </th>
            {cols.map((c) => (
              <th
                key={c.id}
                className={`${head} text-left align-middle font-medium ${
                  c.highlight ? "text-primary" : "text-foreground/80"
                }`}
              >
                <div
                  className={
                    compact
                      ? "flex flex-col items-start gap-1 whitespace-nowrap"
                      : "flex min-h-10 items-center gap-2.5 whitespace-nowrap md:min-h-11"
                  }
                >
                  {c.logo}
                  <span
                    className={
                      compact
                        ? `text-[11px] font-semibold ${c.highlight ? "text-primary" : "text-foreground"}`
                        : `text-sm font-semibold md:text-base ${c.highlight ? "text-primary" : "text-foreground"}`
                    }
                  >
                    {c.label}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr
              key={row.feature}
              className="border-b border-border/60 last:border-0 hover:bg-surface/30"
            >
              <td className={`${cell} font-medium text-foreground`}>{row.feature}</td>
              {cols.map((c) => (
                <td
                  key={c.id}
                  className={`${cell} ${
                    c.highlight ? "font-medium text-primary" : "text-muted-foreground"
                  }`}
                >
                  {row[c.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
