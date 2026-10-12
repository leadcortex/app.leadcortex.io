//frontend\components\mobile-nav-menu.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  isLinkActive,
  isSectionActive,
  type MobileNavLink,
  type MobileNavSection,
} from "@/lib/mobile-nav-tree";

type MenuCtx = { openKey: string | null; setOpenKey: (key: string | null) => void };
const MobileNavMenuContext = createContext<MenuCtx>({ openKey: null, setOpenKey: () => {} });

export function MobileNavMenuProvider({ children }: { children: ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    setOpenKey(null);
  }, [pathname]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  return (
    <MobileNavMenuContext.Provider value={{ openKey, setOpenKey }}>
      {children}
    </MobileNavMenuContext.Provider>
  );
}

type Placement = { top: number; left: number; width: number; direction: "up" | "down" };

const MARGIN = 8;
const GAP = 10;

const ESTIMATED_HEIGHT = 260;

export function MobileNavSectionButton({
  section,
  iconStyle,
  className,
  activeClassName,
  idleClassName,
}: {
  section: MobileNavSection;
  iconStyle?: CSSProperties;
  className?: string;
  activeClassName?: string;
  idleClassName?: string;
}) {
  const { openKey, setOpenKey } = useContext(MobileNavMenuContext);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const open = openKey === section.key;
  const active = isSectionActive(section, pathname);
  const Icon = section.icon;
  const allLinks = [...section.items, ...(section.groups?.flatMap((g) => g.items) ?? [])];
  const singleLink = allLinks.length === 1 ? allLinks[0] : null;

  const computeFromRect = useCallback((rect: DOMRect, height: number): Placement => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(216, vw * 0.58), vw - MARGIN * 2);

    const spaceAbove = rect.top - GAP - MARGIN;
    const spaceBelow = vh - rect.bottom - GAP - MARGIN;
    const direction: "up" | "down" =
      spaceAbove >= height || spaceAbove >= spaceBelow ? "up" : "down";

    const top =
      direction === "up"
        ? Math.max(MARGIN, rect.top - GAP - Math.min(height, spaceAbove))
        : Math.min(rect.bottom + GAP, vh - MARGIN - Math.min(height, spaceBelow));

    const left = Math.min(
      Math.max(MARGIN, rect.left + rect.width / 2 - width / 2),
      vw - width - MARGIN,
    );

    return { top, left, width, direction };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = buttonRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    setPlacement(computeFromRect(rect, panel.offsetHeight));

    const onChange = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      const p = panelRef.current;
      if (!r || !p) return;
      setPlacement(computeFromRect(r, p.offsetHeight));
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, computeFromRect]);

  const go = (link: MobileNavLink) => {
    setOpenKey(null);
    navigate({ to: link.to as "/app" });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={section.label}
        aria-haspopup={singleLink ? undefined : "menu"}
        aria-expanded={singleLink ? undefined : open}
        onClick={() => {
          if (singleLink) {
            setOpenKey(null);
            navigate({ to: singleLink.to as "/app" });
            return;
          }
          if (open) {
            setOpenKey(null);
            setPlacement(null);
            return;
          }

          const trigger = buttonRef.current;
          if (trigger) {
            const rect = trigger.getBoundingClientRect();
            setPlacement(computeFromRect(rect, ESTIMATED_HEIGHT));
          }
          setOpenKey(section.key);
        }}
        className={cn(
          "flex items-center justify-center transition-colors select-none",
          className,
          active || open ? activeClassName : idleClassName,
        )}
      >
        <Icon strokeWidth={active || open ? 2.2 : 1.8} className="shrink-0" style={iconStyle} />
      </button>

      {open &&
        !singleLink &&
        placement &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/25"
              onClick={() => setOpenKey(null)}
              aria-hidden
            />
            <div
              ref={panelRef}
              role="menu"
              aria-label={section.label}
              className={cn(
                "fixed z-[61] max-h-[62vh] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-2xl",
                "animate-in fade-in duration-150",
              )}
              style={{
                top: placement.top,
                left: placement.left,
                width: placement.width,
              }}
            >
              <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {section.label}
              </p>

              <div className="space-y-0.5">
                {section.items.map((link) => (
                  <MenuLink
                    key={link.to}
                    link={link}
                    active={isLinkActive(link, pathname)}
                    onSelect={go}
                  />
                ))}
              </div>

              {section.groups?.map((group) => (
                <div key={group.label} className="mt-1.5 border-t border-border pt-1.5">
                  <p className="px-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((link) => (
                      <MenuLink
                        key={link.to}
                        link={link}
                        active={isLinkActive(link, pathname)}
                        onSelect={go}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function MenuLink({
  link,
  active,
  onSelect,
}: {
  link: MobileNavLink;
  active: boolean;
  onSelect: (link: MobileNavLink) => void;
}) {
  const Icon = link.icon;
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(link)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground hover:bg-secondary/60 active:bg-secondary/60",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 truncate">{link.label}</span>
    </button>
  );
}
