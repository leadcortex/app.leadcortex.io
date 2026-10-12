//frontend\components\mobile-bottom-nav.tsx
import { useEffect, useMemo, useRef } from "react";
import { MOBILE_NAV_SECTIONS } from "@/lib/mobile-nav-tree";
import { MobileNavMenuProvider, MobileNavSectionButton } from "@/components/mobile-nav-menu";
import { useMobileNavSide } from "@/lib/layout-prefs";
import { cn } from "@/lib/utils";

const HOME_KEYS = ["home", "accueil", "dashboard", "accueil-home"];

export function MobileBottomNav() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const side = useMobileNavSide();
  const isTop = side === "top";

  const sections = useMemo(() => {
    const list = [...MOBILE_NAV_SECTIONS];
    const homeIndex = list.findIndex((s) => HOME_KEYS.includes(s.key));
    if (homeIndex === -1) return list;
    const center = Math.floor(list.length / 2);
    if (homeIndex === center) return list;
    const [home] = list.splice(homeIndex, 1);
    list.splice(center, 0, home);
    return list;
  }, []);

  // Expose la hauteur RÉELLE occupée dans le viewport (padding inclus) via
  // la variable CSS --pen-nav-h, consommée par AppShell et AssistantSidebar.

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
  }, [side]);

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
        <nav
          aria-label="Navigation principale"
          className="pointer-events-auto grid grid-cols-6 items-stretch overflow-hidden rounded-2xl border border-border/70 bg-surface/95 shadow-lg backdrop-blur-md"
        >
          {sections.map((section) => (
            <MobileNavSectionButton
              key={section.key}
              section={section}
              className="h-14 w-full rounded-none"
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
    </MobileNavMenuProvider>
  );
}