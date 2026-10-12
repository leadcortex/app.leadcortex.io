//frontend\lib\workflow\block-touch-drag.ts
export const BLOCK_TOUCH_DRAG_MOVE = "workflow:block-drag-move";
export const BLOCK_TOUCH_DRAG_END = "workflow:block-drag-end";

export type BlockTouchDragDetail = {
  blockId: string;

  clientX: number;
  clientY: number;
  /** Vrai si le geste a été interrompu : rien ne doit être déposé. */
  cancelled?: boolean;
};

export function emitBlockTouchDrag(
  type: typeof BLOCK_TOUCH_DRAG_MOVE | typeof BLOCK_TOUCH_DRAG_END,
  detail: BlockTouchDragDetail,
) {
  window.dispatchEvent(new CustomEvent<BlockTouchDragDetail>(type, { detail }));
}
