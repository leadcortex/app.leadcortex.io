// frontend/components/ui/image-cropper-dialog.tsx

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Move, RotateCcw, X, ZoomIn, ZoomOut } from "@/components/icons";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransparencyGrid } from "@/components/ui/transparency-grid";
import {
  type ImageBackground,
  isSvgDataUrl,
  measureImage,
  normalizeSvgDataUrl,
  resolveBackgroundColor,
} from "@/lib/core/image-utils";
import { cn } from "@/lib/core/utils";

type ImageCropperDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  shape: "circle" | "rounded";
  onSave: (url: string) => void;
  defaultBackground?: ImageBackground;
  allowBackgroundChoice?: boolean;
};

type Point = { x: number; y: number };

const OUTPUT_SIZE = 512;
const MAX_ZOOM = 3;
const FALLBACK_CROP_SIZE = 320;

export function ImageCropperDialog({
  open,
  onOpenChange,
  src,
  shape,
  onSave,
  defaultBackground = "transparent",
  allowBackgroundChoice = true,
}: ImageCropperDialogProps) {
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    startOffset: Point;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropEl, setCropEl] = useState<HTMLDivElement | null>(null);

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [loadedSrc, setLoadedSrc] = useState("");
  const [cropSize, setCropSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [background, setBackground] = useState<ImageBackground>(defaultBackground);
  const [localSrc, setLocalSrc] = useState(src);

  useEffect(() => {
    if (open) setLocalSrc(src);
  }, [open, src]);

  const isSvg = useMemo(() => isSvgDataUrl(localSrc), [localSrc]);

  const normalizedSrc = useMemo(() => normalizeSvgDataUrl(localSrc), [localSrc]);

  useEffect(() => {
    if (!open || !localSrc) {
      setSourceImage(null);
      setLoadedSrc("");
      setNaturalSize({ width: 0, height: 0 });
      return;
    }

    let cancelled = false;
    setSourceImage(null);
    setLoadedSrc("");
    setNaturalSize({ width: 0, height: 0 });
    setBackground(defaultBackground);

    (async () => {
      try {
        const measure = await measureImage(localSrc);
        if (cancelled) return;

        if (measure.usedFallback) {
          toast.message("Dimensions SVG inconnues", {
            description: `Rendu sur ${measure.naturalWidth}×${measure.naturalHeight}px par défaut.`,
          });
        }

        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (cancelled) return;
          setSourceImage(img);
          setNaturalSize({ width: measure.naturalWidth, height: measure.naturalHeight });
          setLoadedSrc(localSrc);
        };
        img.onerror = () => {
          if (cancelled) return;
          toast.error("Impossible de charger cette image.");
        };
        img.src = normalizedSrc;
      } catch {
        if (!cancelled) toast.error("Impossible de charger cette image.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, localSrc, normalizedSrc, defaultBackground]);

  useLayoutEffect(() => {
    if (!cropEl) {
      setCropSize(0);
      return;
    }
    const update = () => {
      const s = cropEl.getBoundingClientRect().width;
      if (s > 0) setCropSize(s);
    };
    update();
    const ro = new ResizeObserver(([entry]) => {
      const s = entry.contentRect.width;
      if (s > 0) setCropSize(s);
    });
    ro.observe(cropEl);
    return () => ro.disconnect();
  }, [cropEl]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    dragRef.current = null;
    pinchRef.current = null;
    pointersRef.current.clear();
    setIsDragging(false);
  }, [open, localSrc]);

  const imageReady = open && !!sourceImage && loadedSrc === localSrc && naturalSize.width > 0;
  const effectiveCropSize = cropSize > 0 ? cropSize : FALLBACK_CROP_SIZE;

  const baseScale = imageReady
    ? Math.max(effectiveCropSize / naturalSize.width, effectiveCropSize / naturalSize.height)
    : 0;

  const containZoom =
    imageReady && baseScale > 0
      ? Math.min(
          effectiveCropSize / (naturalSize.width * baseScale),
          effectiveCropSize / (naturalSize.height * baseScale),
        )
      : 1;
  const fullImageZoom = shape === "circle" ? containZoom / Math.SQRT2 : containZoom;
  const minZoom = imageReady ? Math.max(0.05, fullImageZoom * 0.6) : 0.5;

  const imageWidth = imageReady ? naturalSize.width * baseScale * zoom : 0;
  const imageHeight = imageReady ? naturalSize.height * baseScale * zoom : 0;
  const canCrop = imageReady && effectiveCropSize > 0 && baseScale > 0;

  const clampOffset = useCallback(
    (point: Point, nextZoom: number): Point => {
      if (!imageReady) return point;
      const nextWidth = naturalSize.width * baseScale * nextZoom;
      const nextHeight = naturalSize.height * baseScale * nextZoom;
      const size = effectiveCropSize;
      const overscan = size * 0.5;
      return {
        x: Math.min(
          Math.max(point.x, (size - nextWidth) / 2 - overscan),
          (nextWidth - size) / 2 + overscan,
        ),
        y: Math.min(
          Math.max(point.y, (size - nextHeight) / 2 - overscan),
          (nextHeight - size) / 2 + overscan,
        ),
      };
    },
    [imageReady, naturalSize, baseScale, effectiveCropSize],
  );

  const setZoomLevel = useCallback(
    (nextZoom: number) => {
      const next = Math.min(MAX_ZOOM, Math.max(minZoom, nextZoom));
      setZoom(next);
      setOffset((current) => clampOffset(current, next));
    },
    [clampOffset, minZoom],
  );

  useEffect(() => {
    if (!cropEl || !open) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    };
    cropEl.addEventListener("wheel", handler, { passive: false });
    return () => cropEl.removeEventListener("wheel", handler);
  }, [cropEl, open, zoom, setZoomLevel]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !canCrop) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinchRef.current = {
        startDist: dist > 0 ? dist : 1,
        startZoom: zoom,
        startOffset: offset,
      };
      dragRef.current = null;
      setIsDragging(false);
    } else if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        origin: offset,
      };
      setIsDragging(true);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2 && pinchRef.current && cropEl) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const ratio = dist / pinchRef.current.startDist;
      const newZoom = Math.min(MAX_ZOOM, Math.max(minZoom, pinchRef.current.startZoom * ratio));

      const rect = cropEl.getBoundingClientRect();
      const midLocal = {
        x: (p1.x + p2.x) / 2 - rect.left,
        y: (p1.y + p2.y) / 2 - rect.top,
      };
      const oldCenter = {
        x: effectiveCropSize / 2 + pinchRef.current.startOffset.x,
        y: effectiveCropSize / 2 + pinchRef.current.startOffset.y,
      };
      const zoomRatio = newZoom / pinchRef.current.startZoom;
      const newCenter = {
        x: midLocal.x - (midLocal.x - oldCenter.x) * zoomRatio,
        y: midLocal.y - (midLocal.y - oldCenter.y) * zoomRatio,
      };
      const newOffset = {
        x: newCenter.x - effectiveCropSize / 2,
        y: newCenter.y - effectiveCropSize / 2,
      };

      setZoom(newZoom);
      setOffset(clampOffset(newOffset, newZoom));
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(
      clampOffset(
        {
          x: drag.origin.x + event.clientX - drag.start.x,
          y: drag.origin.y + event.clientY - drag.start.y,
        },
        zoom,
      ),
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      pinchRef.current = null;
      setIsDragging(false);
      return;
    }

    if (pointersRef.current.size === 1) {
      pinchRef.current = null;
      const entries = Array.from(pointersRef.current.entries());
      const [remainingId, remainingPos] = entries[0];
      dragRef.current = {
        pointerId: remainingId,
        start: remainingPos,
        origin: offset,
      };
      setIsDragging(true);
      return;
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const handleSave = () => {
    if (!sourceImage || !canCrop) return;

    const scale = baseScale * zoom;
    const sourceSize = effectiveCropSize / scale;
    const sourceX = (imageWidth / 2 - effectiveCropSize / 2 - offset.x) / scale;
    const sourceY = (imageHeight / 2 - effectiveCropSize / 2 - offset.y) / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Impossible de recadrer cette image.");
      return;
    }

    const bgColor = resolveBackgroundColor(background);
    if (bgColor) {
      let resolved = bgColor;
      if (bgColor.startsWith("var(")) {
        const probe = document.createElement("div");
        probe.style.color = bgColor;
        document.body.appendChild(probe);
        resolved = getComputedStyle(probe).color || "#f5f5f4";
        document.body.removeChild(probe);
      }
      ctx.fillStyle = resolved;
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    } else {
      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      sourceImage,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    let result: string;
    try {
      result = canvas.toDataURL("image/png");
    } catch (err) {
      console.error("Failed to encode cropped image", err);
      toast.error("Impossible d'enregistrer l'image recadrée.");
      return;
    }

    onSave(result);
    onOpenChange(false);
  };

  const previewBgStyle: React.CSSProperties =
    background === "transparent"
      ? {}
      : { backgroundColor: resolveBackgroundColor(background) ?? undefined };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-[650px] flex-col gap-0 overflow-hidden border border-border bg-background p-0 shadow-xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-lg italic">
            <Move className="size-4 text-primary" />
            Recadrer l'image
            {isSvg && (
              <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold not-italic text-primary">
                SVG
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Déplacez et zoomez l'image pour choisir la zone à conserver.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b border-border bg-background px-5 py-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface"
          >
            <ImagePlus className="size-3.5 text-primary" />
            Changer l&apos;image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/svg+xml,.svg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = typeof reader.result === "string" ? reader.result : "";
                if (result) setLocalSrc(result);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="bg-[#171717] px-4 py-4 sm:px-8">
            <div
              ref={setCropEl}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "relative mx-auto aspect-square w-full max-w-[460px] touch-none select-none overflow-hidden",
                shape === "circle" ? "rounded-full" : "rounded-2xl",
              )}
              style={{
                cursor: !canCrop ? "default" : isDragging ? "grabbing" : "grab",
                backgroundColor: "#0f0f0f",
              }}
            >
              {imageReady && background === "transparent" && (
                <TransparencyGrid className="opacity-60" size={14} />
              )}
              {imageReady && background !== "transparent" && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={previewBgStyle}
                />
              )}

              {imageReady ? (
                <img
                  src={normalizedSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                  Chargement…
                </div>
              )}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 border-2 border-white/50",
                  shape === "circle" ? "rounded-full" : "rounded-2xl",
                )}
              />
            </div>
            <p className="mt-3 text-center text-xs text-white/70">
              Glissez pour déplacer · Molette ou curseur pour zoomer
            </p>
          </div>

          {allowBackgroundChoice && (
            <div className="border-b border-border px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Fond de l'image
              </p>
              <div className="flex items-stretch gap-1.5">
                <BackgroundOption
                  value="transparent"
                  current={background}
                  onChange={setBackground}
                  label="Transparent"
                />
                <BackgroundOption
                  value="white"
                  current={background}
                  onChange={setBackground}
                  label="Blanc"
                />
                <BackgroundOption
                  value="surface"
                  current={background}
                  onChange={setBackground}
                  label="Surface"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-5 py-3">
            <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={minZoom}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoomLevel(Number(event.target.value))}
              disabled={!canCrop}
              aria-label="Zoom de l'image"
              className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed"
            />
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
              {zoom.toFixed(2)}×
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            disabled={!canCrop}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface"
            >
              <X className="size-4" />
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canCrop}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="size-4" />
              Utiliser
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BackgroundOption({
  value,
  current,
  onChange,
  label,
}: {
  value: ImageBackground;
  current: ImageBackground;
  onChange: (v: ImageBackground) => void;
  label: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-surface",
      )}
    >
      <span
        className={cn(
          "size-3.5 shrink-0 rounded border border-border overflow-hidden",
          value === "transparent" &&
            "bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%)] bg-[length:6px_6px] bg-[position:0_0,3px_3px]",
        )}
        style={{
          backgroundColor:
            value === "transparent"
              ? undefined
              : value === "white"
                ? "#ffffff"
                : "var(--surface, #f5f5f4)",
        }}
      />
      {label}
    </button>
  );
}
