// frontend/components/mail/email-skeleton-gmail.tsx

import { Skeleton } from "@/components/ui/skeleton";

export function GmailThreadsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-2 border-b border-border/60 px-3 py-3"
        >
          <Skeleton variant="circle" className="size-8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-2.5 w-1/3" />
              <Skeleton variant="text" className="ml-auto h-2 w-10 shrink-0" />
            </div>
            <Skeleton variant="text" className="h-2.5 w-4/5" />
            <Skeleton variant="text" className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GmailMessageSkeleton() {
  return (
    <div className="space-y-3 px-3 py-4 md:px-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="size-9 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton variant="text" className="h-2.5 w-2/5" />
          <Skeleton variant="text" className="h-2 w-1/3" />
        </div>
        <Skeleton variant="text" className="h-2 w-14 shrink-0" />
      </div>
      <div className="space-y-1.5 pl-0 md:pl-12">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-11/12" />
        <Skeleton variant="text" className="w-4/5" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
}
