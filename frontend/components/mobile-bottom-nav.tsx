//frontend\components\mobile-bottom-nav.tsx
import { useEffect, useMemo, useRef } from "react";
import { MOBILE_NAV_SECTIONS } from "@/lib/mobile-nav-tree";
import { MobileNavMenuProvider, MobileNavSectionButton } from "@/components/mobile-nav-menu";
import {
  useMobileNavSide,
  useHideAcademyFromMobile,
} from "@/lib/layout-prefs";
import { cn } from "@/lib/utils";

const HOME_KEYS = ["home", "accueil", "dashboard", "accueil-home"];
const ACADEMY_KEY = "academy";

export function MobileBottomNav() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const side = useMobileNavSide();
  const hideAcademy = useHideAcademyFromMobile();
  const isTop = side === "top";

  const { academySection, mainSections } = useMemo(() => {
    const academy = MOBILE_NAV_SECTIONS.find((s) => s.key === ACADEMY_KEY) ?? null;
    const others = MOBILE_NAV_SECTIONS.filter((s) => s.key !== ACADEMY_KEY);

    // Reorder : "home" au centre de la barre principale.
    const homeIndex = others.findIndex((s) => HOME_KEYS.includes(s.key));
    if (homeIndex !== -1) {
      const center = Math.floor(others.length / 2);
      if (homeIndex !== center) {
        const [home] = others.splice(homeIndex, 1);
        others.splice(center, 0, home);
      }
    }

    return { academySection: academy, mainSections: others };
  }, []);

  // Expose la hauteur RÉELLE occupée dans le viewport via --pen-nav-h,
  // consommée par AppShell et AssistantSidebar.
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
              className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border/70 bg-surface/95 shadow-lg backdrop-blur-md"
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
              />
            </nav>
          )}

          <nav
            aria-label="Navigation principale"
            className="grid h-14 flex-1 items-stretch overflow-hidden rounded-2xl border border-border/70 bg-surface/95 shadow-lg backdrop-blur-md"
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
              />
            ))}
          </nav>
        </div>
      </div>
    </MobileNavMenuProvider>
  );
}