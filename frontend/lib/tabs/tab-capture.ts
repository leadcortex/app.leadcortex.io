// frontend/lib/tabs/tab-capture.ts

export const CAPTURE_ATTR = "data-tab-capture";
const SCROLL_ATTR = "data-tab-scroll";

function filterNode(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return true;
  return !node.hasAttribute("data-no-capture") && node.tagName !== "IFRAME";
}

export async function captureTabViewport(timeoutMs = 9000): Promise<string> {
  const { toJpeg } = await import("html-to-image");

  const root =
    document.querySelector<HTMLElement>(`[${CAPTURE_ATTR}]`) ??
    document.querySelector<HTMLElement>("main") ??
    document.body;
  const scroller = root.querySelector<HTMLElement>(`[${SCROLL_ATTR}]`);

  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  const bg = getComputedStyle(root).backgroundColor;
  const backgroundColor = bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#ffffff";
  const base = { quality: 0.72, pixelRatio: 0.5, cacheBust: false, backgroundColor, filter: filterNode };

  const content = scroller?.firstElementChild;
  const scrollTop = scroller?.scrollTop ?? 0;
  const shot =
    content instanceof HTMLElement && scrollTop > 0
      ? toJpeg(content, {
          ...base,
          width,
          height,
          style: { transform: `translateY(-${scrollTop}px)`, transformOrigin: "top left" },
        })
      : toJpeg(root, { ...base, width, height });

  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error("capture-timeout")), timeoutMs);
  });
  try {
    return await Promise.race([shot, timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}
