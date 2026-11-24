// frontend/components/layout/mobile-bottom-nav.tsx

import { useEffect, useMemo, useRef } from "react";
import { MOBILE_NAV_SECTIONS } from "@/lib/mobile/nav-tree";
import {
  MobileNavMenuProvider,
  MobileNavSectionButton,
} from "@/components/layout/mobile-nav-menu";
import { useMobileNavSide, useHideAcademyFromMobile } from "@/lib/core/layout-prefs";
import { useAppStore } from "@/lib/state/store";
import { cn } from "@/lib/core/utils";

const ACADEMY_KEY = "academy";

const BADGE_SOURCES: Record<string, "emails" | "tasks" | "meetings"> = {
  "/app/emails": "emails",
  "/app/hub": "tasks",
  "/app/meetings": "meetings",
};

export function MobileBottomNav() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const side = useMobileNavSide();
  const hideAcademy = useHideAcademyFromMobile();
  const isTop = side === "top";

  const { emails, tasks, meetings = [] } = useAppStore();

  const { academySection, mainSections } = useMemo(() => {
    const academy = MOBILE_NAV_SECTIONS.find((s) => s.key === ACADEMY_KEY) ?? null;
    const others = MOBILE_NAV_SECTIONS.filter((s) => s.key !== ACADEMY_KEY);
    return { academySection: academy, mainSections: others };
  }, []);

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
    for (const section of MOBILE_NAV_SECTIONS) {
      let total = 0;
      for (const m of section.matches) {
        const key = BADGE_SOURCES[m];
        if (key && counterByKey[key] !== undefined) total += counterByKey[key];
      }
      if (total > 0) map[section.key] = total;
    }
    return map;
  }, [emails, tasks, meetings]);

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
  }, [side, hideAcademy]);

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
        <div className="pointer-events-auto flex items-center gap-2">
          {academySection && !hideAcademy && (
            <nav
              aria-label={academySection.label}
              className={cn(
                "grid size-14 shrink-0 place-items-center overflow-hidden rounded-full",
                "border border-white/15 dark:border-white/10",
                "shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
                "bg-white/15 dark:bg-white/[0.06]",
                "backdrop-blur-2xl",
              )}
            >
              <MobileNavSectionButton
                section={academySection}
                className="size-full rounded-full"
                iconStyle={{
                  width: "clamp(20px, 5.5vw, 26px)",
                  height: "clamp(20px, 5.5vw, 26px)",
                }}
                activeClassName="text-primary"
                idleClassName="text-muted-foreground"
                badge={sectionBadges[academySection.key]}
              />
            </nav>
          )}

          <nav
            aria-label="Navigation principale"
            className={cn(
              "grid h-14 flex-1 items-stretch overflow-hidden rounded-2xl",
              "border border-white/15 dark:border-white/10",
              "shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
              "bg-white/[0.12] dark:bg-white/[0.05]",
              "backdrop-blur-2xl",
            )}
            style={{
              gridTemplateColumns: `repeat(${mainSections.length}, minmax(0, 1fr))`,
            }}
          >
            {mainSections.map((section) => (
              <MobileNavSectionButton
                key={section.key}
                section={section}
                className="h-full w-full rounded-none"
                iconStyle={{
                  width: "clamp(20px, 5.5vw, 26px)",
                  height: "clamp(20px, 5.5vw, 26px)",
                }}
                activeClassName="text-primary"
                idleClassName="text-muted-foreground"
                badge={sectionBadges[section.key]}
              />
            ))}
          </nav>
        </div>
      </div>
    </MobileNavMenuProvider>
  );
}
