//frontend\components\mobile\mobile-dialog.tsx
import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type MobileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  children?: ReactNode;

  footer?: ReactNode;

  className?: string;

  contentClassName?: string;

  onBack?: () => void;

  headerAction?: ReactNode;

  desktopMaxWidthClassName?: string;
};

export function MobileDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  onBack,
  headerAction,
  desktopMaxWidthClassName = "sm:max-w-lg",
}: MobileDialogProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(desktopMaxWidthClassName, className)}>
          <DialogHeader>
            <DialogTitle className="truncate">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          {children && (
            <div className={cn("min-w-0 overflow-hidden", contentClassName)}>{children}</div>
          )}

          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onBack={onBack}
      headerAction={headerAction}
    >
      <div className="flex min-h-0 flex-col overflow-hidden">
        {description && (
          <div className="min-w-0 overflow-hidden px-5 pt-3">
            <p className="break-words text-[13.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        )}

        {children && (
          <div className={cn("min-w-0 overflow-hidden px-5 pt-3", contentClassName)}>
            {children}
          </div>
        )}

        {footer && (
          <div className="sticky bottom-0 mt-5 border-t border-border/60 bg-background px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </MobileSheet>
  );
}
