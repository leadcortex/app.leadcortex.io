//frontend\components\ui\dialog.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/*  ─── Important sur le PADDING ─────────────────────────────────────────────
/*  Le bouton de fermeture (X) est positionné en absolu :
/*    • Desktop : right-4 (16px) + size-4 (16px)  → occupe jusqu'à 32px du bord
/*    • Mobile  : right-3 (12px) + size-8 (32px)  → occupe jusqu'à 44px du bord
/*
/*  Pour ne JAMAIS chevaucher le contenu, on réserve :
/*    • Desktop : pr-12 (48px) sur le DialogContent
/*    • Mobile  : pl-4 + pr-12 (48px) sur le DialogContent
/*
/*  ⚠️  Les modales qui passent `p-0` (nos custom avec header intégré) doivent
/*  gérer elles-mêmes leur `pr-14` sur le header. Les modales standards
/*  héritent automatiquement de la bonne marge.
/* -------------------------------------------------------------------------- */

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DialogPortal>
        <DialogOverlay className="bg-foreground/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col",
            "overflow-y-auto overscroll-contain",
            "rounded-t-3xl rounded-b-none border-x border-t border-border bg-background",
            "shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)]",
            "pl-4 pr-12 pt-5 pb-[max(env(safe-area-inset-bottom),0.75rem)]",
            "duration-300",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            className,
          )}
          {...props}
        >
          {children}

          {}
          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full",
              "bg-surface/80 text-foreground backdrop-blur transition-colors active:bg-surface",
              "focus:outline-none focus:ring-2 focus:ring-ring",
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // que le contenu ne soit jamais sous le bouton X (right-4 + size-4).
          "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 pr-12 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 z-20 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
