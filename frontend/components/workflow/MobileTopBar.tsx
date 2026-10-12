//frontend\components\workflow\MobileTopBar.tsx
import { ArrowLeft, Workflow } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppTabs } from "@/components/app-tabs";
import { WorkflowMenus } from "./WorkflowMenus";

export const MOBILE_TOP_BAR_HEIGHT = 44;

export function MobileTopBar({
  returnTo,
  onOpenDrawer,
  onOpenPalette,
}: {
  returnTo?: string;
  onOpenDrawer: () => void;
  onOpenPalette: () => void;
}) {
  return (
    <header
      className="flex shrink-0 items-center gap-1.5 border-b border-border bg-panel px-2"
      style={{ height: MOBILE_TOP_BAR_HEIGHT }}
    >
      <Link
        to={returnTo ?? "/app"}
        aria-label="Retour"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Workflow className="h-3.5 w-3.5" />
      </span>

      <div className="flex min-w-0 flex-1 items-center">
        <AppTabs />
      </div>

      <WorkflowMenus mobile onOpenPalette={onOpenPalette} onOpenMobileDrawer={onOpenDrawer} />
    </header>
  );
}
