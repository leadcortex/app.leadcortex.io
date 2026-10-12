//frontend\components\confirm-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmer l'action",
  description = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
}: ConfirmDialogProps) {
  const isMobile = useIsMobile();
  const isDestructive = variant === "destructive";

  if (!isMobile) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {}
        <AlertDialogContent className="z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={isDestructive ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title} compact>
      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="min-w-0 overflow-hidden px-5 pt-3">
          <p className="break-words text-[13.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-6 space-y-2 px-5">
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isDestructive
                ? "bg-destructive text-destructive-foreground active:bg-destructive/90"
                : "bg-primary text-primary-foreground active:bg-primary/90",
            )}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-xl border border-border bg-background",
              "text-[15px] font-medium text-foreground transition-colors active:bg-surface",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </MobileSheet>
  );
}
