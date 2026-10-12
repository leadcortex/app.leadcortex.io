//frontend\components\loading.tsx
import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
  xl: "w-16 h-16 border-4",
};

export function Loading({ size = "md", className, label, fullScreen = false }: LoadingProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          sizeMap[size],
        )}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function TableLoading({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface/50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-2.5 border-b border-border">
                  <div className="h-3 rounded bg-secondary w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 rounded bg-secondary w-full max-w-[80%]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
