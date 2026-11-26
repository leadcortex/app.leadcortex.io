// frontend/components/mobile/mobile-top-bar.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, MessageSquare, Search as SearchIcon, X } from "@/components/icons";

import { useDebounce } from "@/hooks/use-debounce";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { useSettings } from "@/components/settings/settings-context";
import { useAppStore } from "@/lib/state/store";
import { cn } from "@/lib/core/utils";
import { highlightRanges } from "@/lib/core/fuzzy-search";
import {
  searchEntries,
  useMobileSearchIndex,
  type SearchEntry,
  type SearchHit,
} from "@/lib/mobile/search-index";
import { MobileProfileDrawer } from "./mobile-profile-drawer";
import { NotificationCenter } from "@/components/layout/notification-center";
import { BrandLogoMark } from "@/components/brand/brand-logo-mark";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";
import { useAssistantDocked } from "@/components/ai-assistant/assistant-dock";

export function MobileTopBar() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { openSettings } = useSettings();
  const store = useAppStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const assistantDocked = useAssistantDocked();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 110);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const unreadEmails = store.emails.filter((e) => e.unread).length;
  const index = useMobileSearchIndex();

  const results = useMemo(() => searchEntries(debouncedQuery, index, 14), [debouncedQuery, index]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    for (const r of results) {
      const arr = map.get(r.entry.category) ?? [];
      arr.push(r);
      map.set(r.entry.category, arr);
    }
    return Array.from(map.entries());
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!focused) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [focused]);

  const handleSelect = (entry: SearchEntry) => {
    setFocused(false);
    setQuery("");
    inputRef.current?.blur();
    if (entry.action.type === "settings") {
      openSettings(entry.action.section);
    } else {
      navigate({ to: entry.action.to as "/app" });
    }
  };

  const showDropdown = focused && debouncedQuery.trim().length > 0;

  return (
    <>
      <header className="flex items-center gap-1 rounded-2xl border border-border/70 bg-background p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Ouvrir le menu du compte"
          className="grid size-11 shrink-0 place-items-center rounded-full transition-colors active:bg-surface"
        >
          <span className="relative block size-8">
            <LetterAvatar name={user.fullName} size={32} shape="circle" />
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 size-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </span>
        </button>

        <div ref={containerRef} className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (!showDropdown || results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = results[activeIndex];
                if (hit) handleSelect(hit.entry);
              }
            }}
            placeholder="Recherche"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            className={cn(
              "h-11 w-full rounded-full border border-transparent bg-surface/60 pl-10 pr-11",
              "text-[16px] leading-tight text-foreground",
              "outline-none transition-colors placeholder:text-muted-foreground",
              "focus:border-border focus:bg-background",
              "[&::-webkit-search-cancel-button]:hidden",
            )}
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors active:bg-surface"
            >
              <X className="size-4" />
            </button>
          )}

          {showDropdown && (
            <SearchDropdown
              grouped={grouped}
              query={debouncedQuery}
              total={results.length}
              activeIndex={activeIndex}
              onHoverIndex={setActiveIndex}
              onSelect={handleSelect}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: "/app/conversations" })}
          aria-label="Ouvrir les conversations"
          className="relative grid size-11 shrink-0 place-items-center rounded-full transition-colors active:bg-surface"
        >
          <MessageSquare className="size-5" strokeWidth={1.75} />
          {unreadEmails > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none tabular-nums text-primary-foreground"
            >
              {unreadEmails > 99 ? "99+" : unreadEmails}
            </span>
          )}
        </button>

        {assistantDocked && (
          <button
            type="button"
            onClick={() => openAssistant()}
            aria-label="Ouvrir l'assistant IA"
            className="relative grid size-11 shrink-0 place-items-center rounded-full transition-colors active:bg-surface"
          >
            <span className="relative grid size-5 place-items-center">
              <BrandLogoMark size="100%" aria-label="" className="size-full" />
              <span
                aria-hidden
                className="absolute -top-1.5 -right-2 grid size-3.5 place-items-center rounded-full bg-primary text-[7px] leading-none font-bold tracking-tight text-primary-foreground ring-2 ring-background"
              >
                IA
              </span>
            </span>
          </button>
        )}
      </header>

      <MobileProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
      <NotificationCenter headless />
    </>
  );
}

function SearchDropdown({
  grouped,
  query,
  total,
  activeIndex,
  onHoverIndex,
  onSelect,
}: {
  grouped: Array<[string, SearchHit[]]>;
  query: string;
  total: number;
  activeIndex: number;
  onHoverIndex: (i: number) => void;
  onSelect: (entry: SearchEntry) => void;
}) {
  let cursor = -1;

  return (
    <div
      role="listbox"
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+6px)] z-50",
        "max-h-[62dvh] overflow-y-auto overscroll-contain",
        "rounded-2xl border border-border bg-popover p-1.5",
        "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]",
        "animate-in fade-in zoom-in-95 duration-150",
      )}
    >
      {total === 0 ? (
        <div className="px-3 py-8 text-center">
          <SearchIcon className="mx-auto mb-2 size-6 text-muted-foreground/30" />
          <p className="text-[13px] text-muted-foreground">
            Aucun résultat pour « <span className="font-medium text-foreground">{query}</span> »
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Essayez « prospects », « facturation », « workflows »…
          </p>
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <div key={category} className="mb-1 last:mb-0">
            <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{category}</p>
            <div className="space-y-0.5">
              {items.map((r) => {
                cursor++;
                const isActive = cursor === activeIndex;
                return (
                  <ResultRow
                    key={r.entry.id}
                    hit={r}
                    active={isActive}
                    onHover={() => onHoverIndex(cursor)}
                    onSelect={() => onSelect(r.entry)}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ResultRow({
  hit,
  active,
  onHover,
  onSelect,
}: {
  hit: SearchHit;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const { entry, indices } = hit;
  const Icon = entry.icon;
  const parts = highlightRanges(entry.label, indices);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseEnter={onHover}
      onTouchStart={onHover}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
        active ? "bg-primary/[0.08]" : "active:bg-surface/70",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-tight">
          {parts.map((part, i) =>
            part.match ? (
              <mark key={i} className="rounded-[3px] bg-transparent font-semibold text-primary">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {entry.description}
        </span>
      </span>

      {active && (
        <CornerDownLeft className="mt-1 size-3 shrink-0 text-muted-foreground/60" strokeWidth={2} />
      )}
    </button>
  );
}
