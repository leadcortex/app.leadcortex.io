// frontend/components/layout/mobile-bottom-nav.tsx

import { useEffect, useMemo, useRef } from "react";
import { buildBar } from "@/lib/mobile/nav-layout";
import {
  MobileNavMenuProvider,
  MobileNavSectionButton,
} from "@/components/layout/mobile-nav-menu";
import { MobileNavBarView, NAV_ICON_STYLE } from "@/components/layout/mobile-nav-bar-view";
import { useMobileNavSide, useMobileNavLayout } from "@/lib/core/layout-prefs";
import { useAppStore } from "@/lib/state/store";
import { cn } from "@/lib/core/utils";

const BADGE_SOURCES: Record<string, "emails" | "tasks" | "meetings"> = {
  "/app/emails": "emails",
  "/app/hub": "tasks",
  "/app/meetings": "meetings",
};

export function MobileBottomNav() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const side = useMobileNavSide();
  const layout = useMobileNavLayout();
  const isTop = side === "top";

  const { emails, tasks, meetings = [] } = useAppStore();

  const { bubble, main } = useMemo(() => buildBar(layout), [layout]);

  const sectionBadges = useMemo(() => {
    const unreadEmails = emails.filter((e) => e.unread).length;
    const pendingTasks = tasks.filter((t) => !t.done).length;
    const pendingMeetings = meetings.filter((m: any) => !m.done).length;

    const counterByKey: Record<"emails" | "tasks" | "meetings", number> = {
      emails: unreadEmails,
      tasks: pendingTasks,
      meetings: pendingMeetings,
    };

    const map: Record<string, number> = {};
    for (const section of bubble ? [bubble, ...main] : main) {
      let total = 0;
      for (const m of section.matches) {
        const key = BADGE_SOURCES[m];
        if (key && counterByKey[key] !== undefined) total += counterByKey[key];
      }
      if (total > 0) map[section.key] = total;
    }
    return map;
  }, [emails, tasks, meetings, bubble, main]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--pen-nav-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      document.documentElement.style.removeProperty("--pen-nav-h");
    };
  }, [side, layout]);

  return (
    <MobileNavMenuProvider>
      <div
        ref={wrapperRef}
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-50 p-2 md:hidden",
          isTop ? "top-0" : "bottom-0",
        )}
        style={
          isTop
            ? { paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }
            : { paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }
        }
      >
        <MobileNavBarView
          bubbleLabel={bubble?.label}
          bubble={
            bubble && (
              <MobileNavSectionButton
                section={bubble}
                className="size-full rounded-full"
                iconStyle={NAV_ICON_STYLE}
                activeClassName="text-primary"
                idleClassName="text-muted-foreground"
                badge={sectionBadges[bubble.key]}
              />
            )
          }
          items={main.map((section) => (
            <MobileNavSectionButton
              key={section.key}
              section={section}
              className="h-full w-full rounded-none"
              iconStyle={NAV_ICON_STYLE}
              activeClassName="text-primary"
              idleClassName="text-muted-foreground"
              badge={sectionBadges[section.key]}
            />
          ))}
        />
      </div>
    </MobileNavMenuProvider>
  );
}
