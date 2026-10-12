//frontend\components\workflow\Minimap.tsx
import { useWorkflow } from "@/lib/workflow/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { categoryMap, docBounds, nodeHeight, nodeWidth } from "@/lib/workflow/geometry";
import { cn } from "@/lib/utils";

const MW_DESKTOP = 200;
const MH_DESKTOP = 130;

// Mobile : très fortement réduite pour ne pas encombrer le canevas — à cette
const MW_MOBILE = 96;
const MH_MOBILE = 60;
const MOBILE_DOT_RADIUS = 2.25;

export function Minimap() {
  const { doc, viewport, setViewport, size, settings, selection } = useWorkflow();
  const isMobile = useIsMobile();
  if (!settings.showMinimap) return null;
  if (doc.nodes.length === 0) return null;

  const MW = isMobile ? MW_MOBILE : MW_DESKTOP;
  const MH = isMobile ? MH_MOBILE : MH_DESKTOP;

  const b = docBounds(doc);
  const pad = 120;
  const minX = Math.min(b.minX, 0) - pad;
  const minY = Math.min(b.minY, 0) - pad;
  const maxX = Math.max(b.maxX, settings.bounded ? settings.width : 0) + pad;
  const maxY = Math.max(b.maxY, settings.bounded ? settings.height : 0) + pad;
  const k = Math.min(MW / (maxX - minX), MH / (maxY - minY));
  const px = (x: number) => (x - minX) * k;
  const py = (y: number) => (y - minY) * k;

  const view = {
    x: px(-viewport.x / viewport.zoom),
    y: py(-viewport.y / viewport.zoom),
    w: (size.w / viewport.zoom) * k,
    h: (size.h / viewport.zoom) * k,
  };

  const jump = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const wx = (e.clientX - r.left) / k + minX;
    const wy = (e.clientY - r.top) / k + minY;
    setViewport((v) => ({ ...v, x: size.w / 2 - wx * v.zoom, y: size.h / 2 - wy * v.zoom }));
  };

  return (
    <div
      className={cn(
        "absolute right-3 top-3 z-20 rounded-lg border border-border bg-panel/90 shadow-node backdrop-blur",
        isMobile ? "p-1" : "p-1.5",
      )}
    >
      {}
      {!isMobile && (
        <div className="mb-1 px-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
          Mini-carte
        </div>
      )}
      <svg width={MW} height={MH} className="cursor-pointer rounded bg-canvas" onClick={jump}>
        {isMobile ? (
          doc.nodes.map((n) => (
            <circle
              key={n.id}
              cx={px(n.x + nodeWidth(n) / 2)}
              cy={py(n.y + nodeHeight(n) / 2)}
              r={MOBILE_DOT_RADIUS}
              fill={categoryMap[n.category].color}
              opacity={selection.includes(n.id) ? 1 : 0.8}
            />
          ))
        ) : (
          <>
            {settings.bounded && (
              <rect
                x={px(0)}
                y={py(0)}
                width={settings.width * k}
                height={settings.height * k}
                fill="none"
                className="stroke-border"
                strokeDasharray="3 3"
              />
            )}
            {doc.comments.map((c) => (
              <rect
                key={c.id}
                x={px(c.x)}
                y={py(c.y)}
                width={Math.max(2, c.w * k)}
                height={Math.max(2, c.h * k)}
                className="fill-annotation/25 stroke-annotation/60"
              />
            ))}
            {doc.nodes.map((n) => (
              <rect
                key={n.id}
                x={px(n.x)}
                y={py(n.y)}
                width={Math.max(3, nodeWidth(n) * k)}
                height={Math.max(2, nodeHeight(n) * k)}
                rx={1.5}
                fill={categoryMap[n.category].color}
                opacity={selection.includes(n.id) ? 1 : 0.75}
              />
            ))}
          </>
        )}
        <rect
          x={view.x}
          y={view.y}
          width={Math.max(4, view.w)}
          height={Math.max(4, view.h)}
          fill="var(--color-ring)"
          fillOpacity={0.1}
          stroke="var(--color-ring)"
        />
      </svg>
    </div>
  );
}
