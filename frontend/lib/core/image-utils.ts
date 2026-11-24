// frontend/lib/core/image-utils.ts

export type ImageBackground = "transparent" | "white" | "surface";

export type ImageMeasure = {
  naturalWidth: number;
  naturalHeight: number;
  isSvg: boolean;
  usedFallback: boolean;
};

const SVG_FALLBACK_SIZE = 512;

export function getMimeFromDataUrl(src: string): string {
  const match = /^data:([^;,]+)/.exec(src);
  return match ? match[1].toLowerCase() : "";
}

export function isSvgDataUrl(src: string): boolean {
  return getMimeFromDataUrl(src).includes("svg");
}

export function isSvgFile(file: File): boolean {
  if (file.type === "image/svg+xml") return true;
  if (file.type) return false;
  return file.name.toLowerCase().endsWith(".svg");
}

export function decodeSvgFromDataUrl(src: string): string | null {
  try {
    const comma = src.indexOf(",");
    if (comma === -1) return null;
    const header = src.slice(0, comma);
    const payload = src.slice(comma + 1);
    if (header.includes(";base64")) {
      return atob(payload);
    }
    return decodeURIComponent(payload);
  } catch {
    return null;
  }
}

export function getSvgIntrinsicSize(svgText: string): {
  width: number;
  height: number;
  usedFallback: boolean;
} {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.documentElement as unknown as SVGSVGElement;

    if (!svg || svg.nodeName.toLowerCase() !== "svg") {
      return { width: SVG_FALLBACK_SIZE, height: SVG_FALLBACK_SIZE, usedFallback: true };
    }

    const widthAttr = parseFloat(svg.getAttribute("width") || "0");
    const heightAttr = parseFloat(svg.getAttribute("height") || "0");

    const viewBox = svg.getAttribute("viewBox");
    let vbWidth = 0;
    let vbHeight = 0;
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
        vbWidth = parts[2];
        vbHeight = parts[3];
      }
    }

    const width = widthAttr || vbWidth;
    const height = heightAttr || vbHeight;

    if (width > 0 && height > 0) {
      return { width, height, usedFallback: false };
    }

    return { width: SVG_FALLBACK_SIZE, height: SVG_FALLBACK_SIZE, usedFallback: true };
  } catch {
    return { width: SVG_FALLBACK_SIZE, height: SVG_FALLBACK_SIZE, usedFallback: true };
  }
}

export function normalizeSvgDataUrl(src: string): string {
  if (!isSvgDataUrl(src)) return src;

  const svgText = decodeSvgFromDataUrl(src);
  if (!svgText) return src;

  const { width, height } = getSvgIntrinsicSize(svgText);

  const normalized = svgText.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\swidth\s*=\s*"[^"]*"/gi, "")
      .replace(/\sheight\s*=\s*"[^"]*"/gi, "")
      .replace(/\swidth\s*=\s*'[^']*'/gi, "")
      .replace(/\sheight\s*=\s*'[^']*'/gi, "");
    return `<svg${cleaned} width="${width}" height="${height}">`;
  });

  if (normalized === svgText) return src;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized)}`;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image."));
    img.src = src;
  });
}

export async function measureImage(src: string): Promise<ImageMeasure> {
  const isSvg = isSvgDataUrl(src);

  if (isSvg) {
    const svgText = decodeSvgFromDataUrl(src);
    if (svgText) {
      const { width, height, usedFallback } = getSvgIntrinsicSize(svgText);
      await loadImageElement(src).catch(() => null);
      return { naturalWidth: width, naturalHeight: height, isSvg, usedFallback };
    }
    return {
      naturalWidth: SVG_FALLBACK_SIZE,
      naturalHeight: SVG_FALLBACK_SIZE,
      isSvg,
      usedFallback: true,
    };
  }

  const img = await loadImageElement(src);
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    return {
      naturalWidth: SVG_FALLBACK_SIZE,
      naturalHeight: SVG_FALLBACK_SIZE,
      isSvg,
      usedFallback: true,
    };
  }
  return {
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    isSvg,
    usedFallback: false,
  };
}

export function resolveBackgroundColor(bg: ImageBackground): string | null {
  if (bg === "transparent") return null;
  if (bg === "white") return "#ffffff";
  return "var(--surface, #f5f5f4)";
}
