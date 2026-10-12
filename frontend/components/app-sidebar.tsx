//frontend\components\app-sidebar.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  Wand2,
  Send,
  Mail,
  Phone,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Target,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  Bookmark,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  CircleHelp,
  ArrowUpCircle,
  Download,
  Info,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { BrandLogoMark } from "@/components/brand-logo-mark";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useSettings } from "@/components/settings/settings-context";
import { useCurrentUser } from "@/hooks/use-current-user";

const COLLAPSE_STORAGE_KEY = "leadcortex:app-sidebar-collapsed";

type Item = { to: string; label: string; icon: typeof Users; exact?: boolean; badge?: string };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Accueil",
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Prospecter & enrichir",
    items: [
      { to: "/app/people", label: "Prospects", icon: Users },
      { to: "/app/companies", label: "Entreprises", icon: Building2 },
      { to: "/app/lists", label: "Listes", icon: ListChecks },
      { to: "/app/enrichment", label: "Enrichissement", icon: Wand2 },
    ],
  },
  {
    label: "Engager",
    items: [
      { to: "/app/sequences", label: "Séquences", icon: Send },
      { to: "/app/emails", label: "Emails", icon: Mail },
      { to: "/app/calls", label: "Appels", icon: Phone },
      { to: "/app/tasks", label: "Tâches", icon: CheckSquare },
    ],
  },
  {
    label: "Gagner",
    items: [
      { to: "/app/meetings", label: "Meetings", icon: CalendarDays },
      { to: "/app/conversations", label: "Conversations", icon: MessageSquare },
      { to: "/app/deals", label: "Opportunités", icon: Target },
    ],
  },
  {
    label: "Outils",
    items: [
      { to: "/app/workflows", label: "Workflows", icon: Workflow },
      { to: "/app/analytics", label: "Analyses", icon: BarChart3 },
    ],
  },
  {
    label: "Inbound",
    items: [
      { to: "/app/visitors", label: "Visiteurs", icon: Eye },
      { to: "/app/forms", label: "Formulaires", icon: FileInput },
    ],
  },
  {
    label: "Sauvegardés",
    items: [{ to: "/app/saved", label: "Prospects & entreprises", icon: Bookmark }],
  },
];

export function AppSidebar({ badges = {} }: { badges?: Record<string, string> }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const { openSettings } = useSettings();

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {
      /* Intentionally ignored. */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* Intentionally ignored. */
      }
      return next;
    });
  };

  const isActive = (item: Item) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

  const renderItem = (item: Item) => {
    const Icon = item.icon;
    const active = isActive(item);
    const badge = badges[item.to];

    const link = (
      <Link
        to={item.to}
        className={cn(
          "group/link flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-surface/80",
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && badge && (
          <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
            {badge}
          </span>
        )}
        {collapsed && badge && (
          <span className="absolute right-2 size-1.5 rounded-full bg-primary" aria-hidden />
        )}
      </Link>
    );

    if (!collapsed) return <li key={item.to}>{link}</li>;

    return (
      <li key={item.to} className="relative">
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
            {badge ? ` · ${badge}` : ""}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  };

  const collapseButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg",
        "text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" strokeWidth={1.75} />
      ) : (
        <PanelLeftClose className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        data-sidebar="app"
        className={cn(
          "hidden md:flex h-full shrink-0 flex-col overflow-hidden",
          "rounded-2xl border border-border/70 bg-background shadow-sm",
          "p-2 gap-2",
          "transition-[width] duration-200 ease-out",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 rounded-xl bg-surface/40",
            collapsed
              ? "flex-col items-center gap-1.5 py-2 px-0"
              : "items-center justify-between pl-2.5 pr-1 py-1.5",
          )}
        >
          {collapsed ? (
            <Link to="/app" aria-label="LeadCortex">
              <BrandLogoMark size={28} />
            </Link>
          ) : (
            <BrandLogo size={28} to="/app" />
          )}
          {collapseButton}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto scrollbar-hide rounded-xl bg-surface/30 p-1.5">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-2 last:mb-0">
              {!collapsed && (
                <p className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
              {collapsed && <div className="mx-2 my-1.5 h-px bg-border/60 last:hidden" />}
            </div>
          ))}
        </nav>

        <div className="shrink-0 rounded-xl bg-surface/40 p-1.5">
          <UserMenu collapsed={collapsed} onOpenSettings={openSettings} />
        </div>
      </aside>
    </TooltipProvider>
  );
}

function UserMenu({
  collapsed,
  onOpenSettings,
}: {
  collapsed: boolean;
  onOpenSettings: (
    section?: import("@/components/settings/settings-context").SettingsSection,
  ) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const user = useCurrentUser();

  const close = () => setOpen(false);

  const handleSettings = () => {
    close();
    onOpenSettings("general");
  };

  const handleLanguage = () => {
    close();
    // ✅ Cible explicitement la section « Général » (où vit le réglage Langue).
    onOpenSettings("general");
    toast.info("Langue : modifiable dans la section Général");
  };

  const handleHelp = () => {
    close();
    toast.info("Centre d'aide bientôt disponible.");
  };

  const handleUpgrade = () => {
    close();
    onOpenSettings("billing");
    toast.success("Direction la facturation…");
  };

  const handleApps = () => {
    close();
    toast.info("Applications et extensions bientôt disponibles.");
  };

  const handleLearnMore = () => {
    close();
    toast.info("Page « En savoir plus » bientôt disponible.");
  };

  const handleLogout = () => {
    close();
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    toast.success("Vous avez été déconnecté");
    navigate({ to: "/login" });
  };

  const chipInner = collapsed ? (
    <LetterAvatar name={user.fullName} size={32} shape="rounded" />
  ) : (
    <>
      <LetterAvatar name={user.fullName} size={32} shape="rounded" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-xs font-medium text-foreground">{user.fullName}</span>
        <span className="block truncate text-[10px] text-muted-foreground">· {user.plan}</span>
      </span>
      <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </>
  );

  const chipClass = cn(
    "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
    "hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "data-[state=open]:bg-surface/80",
    collapsed && "justify-center px-0",
  );

  const trigger = (
    <PopoverTrigger asChild>
      <button type="button" className={chipClass} aria-label="Menu du compte">
        {chipInner}
      </button>
    </PopoverTrigger>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{user.fullName}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}

        <PopoverContent
          side="top"
          align={collapsed ? "start" : "end"}
          sideOffset={8}
          alignOffset={collapsed ? 6 : -6}
          collisionPadding={{ top: 8, right: 12, bottom: 12, left: 12 }}
          className="w-[280px] overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-border/70 px-3 py-2.5">
            <p className="truncate text-xs text-muted-foreground">{user.email || "—"}</p>
          </div>

          <div className="p-1">
            <MenuButton icon={Settings} label="Paramètres" onClick={handleSettings} />
            <MenuButton icon={Globe} label="Langue" onClick={handleLanguage} />
            <MenuButton icon={CircleHelp} label="Obtenir de l'aide" onClick={handleHelp} />
          </div>

          <div className="mx-1 h-px bg-border/70" />

          <div className="p-1">
            <MenuButton
              icon={ArrowUpCircle}
              label="Mettre le forfait à niveau"
              onClick={handleUpgrade}
            />
            <MenuButton
              icon={Download}
              label="Obtenir les applications et extensions"
              onClick={handleApps}
              truncate
            />
            <MenuButton
              icon={Info}
              label="En savoir plus"
              onClick={handleLearnMore}
              trailing="chevron"
            />
          </div>

          <div className="mx-1 h-px bg-border/70" />

          <div className="p-1">
            <MenuButton
              icon={LogOut}
              label="Se déconnecter"
              onClick={handleLogout}
              variant="destructive"
            />
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={confirmLogout}
        title="Se déconnecter ?"
        description="Votre travail enregistré restera disponible à votre prochaine connexion."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        variant="destructive"
      />
    </>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  trailing,
  variant = "default",
  truncate = false,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  trailing?: "chevron";
  variant?: "default" | "destructive";
  truncate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "destructive"
          ? "text-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-foreground hover:bg-surface",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <span className={cn("min-w-0 flex-1", truncate ? "truncate" : "")}>{label}</span>
      {trailing === "chevron" && (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      )}
    </button>
  );
}
