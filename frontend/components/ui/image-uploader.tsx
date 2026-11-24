// frontend/components/ui/image-uploader.tsx

import { useRef, useState } from "react";
import { Camera } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { CompanyLogo } from "@/components/company-logo";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { TransparencyGrid } from "@/components/ui/transparency-grid";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isSvgFile,
  isSvgDataUrl,
  type ImageBackground,
} from "@/lib/core/image-utils";

export type ImageUploaderProps = {
  type?: "avatar" | "logo";
  name?: string;
  src: string;
  onChange: (url: string) => void;
  label?: string;
  defaultBackground?: ImageBackground;
};

export function ImageUploader({
  type = "avatar",
  name = "",
  src,
  onChange,
  label,
  defaultBackground,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const isMobile = useIsMobile();

  const isAvatar = type === "avatar";
  const borderRadius = isAvatar ? "9999px" : "0.75rem";

  const resolvedDefaultBackground: ImageBackground =
    defaultBackground ?? (isAvatar ? "surface" : "transparent");

  const acceptFile = (file: File) => {
    if (!file.type.startsWith("image/") && !isSvgFile(file)) {
      toast.error("Format d'image requis (PNG, JPG, WebP, SVG…)");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 4 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        toast.error("Impossible de lire cette image.");
        return;
      }
      setCropSrc(result);
      setCropOpen(true);
    };
    reader.onerror = () => {
      toast.error("Impossible de lire cette image.");
    };
    reader.readAsDataURL(file);
  };

  const openCropperOrPicker = () => {
    if (src) {
      setCropSrc(src);
      setCropOpen(true);
    } else {
      inputRef.current?.click();
    }
  };

  const previewInteractionProps = isMobile
    ? { onClick: openCropperOrPicker }
    : { onDoubleClick: openCropperOrPicker };

  const showTransparencyGrid = isSvgDataUrl(src) && !isAvatar;

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) acceptFile(f);
        }}
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-3 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-surface/20",
        )}
      >
        <div className="relative shrink-0">
          <div
            {...previewInteractionProps}
            role="button"
            tabIndex={0}
            aria-label={src ? "Modifier l'image" : "Ajouter une image"}
            title={
              src
                ? "Double-cliquez pour ajuster l'image"
                : "Cliquez pour choisir une image"
            }
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ borderRadius }}
          >
            {src ? (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius,
                  overflow: "hidden",
                  backgroundColor: isAvatar ? "var(--surface)" : "var(--background)",
                  boxShadow:
                    "0 0 0 2px color-mix(in oklab, var(--primary) 30%, transparent)",
                  position: "relative",
                }}
              >
                {showTransparencyGrid && <TransparencyGrid size={10} />}
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    position: "relative",
                  }}
                />
              </div>
            ) : isAvatar ? (
              <LetterAvatar name={name || "?"} size={64} shape="circle" />
            ) : (
              <CompanyLogo name={name || "?"} size={64} rounded="lg" />
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={`Changer ${label ?? "l'image"}`}
            title="Changer l'image (nouvelle image)"
            className="absolute -bottom-1 -right-1 z-10 grid size-6 place-items-center rounded-full border border-border bg-background shadow-[0_1px_0_var(--border)] hover:bg-surface active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Camera className="size-3" />
          </button>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">
            Glissez ou cliquez · PNG, JPG, SVG
          </p>
        </div>
        {src && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] text-destructive hover:underline"
          >
            Retirer
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,image/svg+xml,.svg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <ImageCropperDialog
        open={cropOpen}
        onOpenChange={(v) => {
          setCropOpen(v);
          if (!v) setCropSrc("");
        }}
        src={cropSrc}
        shape={isAvatar ? "circle" : "rounded"}
        defaultBackground={resolvedDefaultBackground}
        allowBackgroundChoice
        onSave={(url) => {
          onChange(url);
          setCropSrc("");
        }}
      />
    </>
  );
}
