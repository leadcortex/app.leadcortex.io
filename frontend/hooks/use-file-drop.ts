// frontend/hooks/use-file-drop.ts

"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

export type UseFileDropOptions = {
  onDrop: (files: File[]) => void;
  filter?: (file: File) => boolean;
  enabled?: boolean;
};

export function useFileDrop({ onDrop, filter, enabled = true }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const counter = useRef(0);

  const accepts = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!enabled) return false;
      return Array.from(e.dataTransfer.types).includes("Files");
    },
    [enabled],
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!accepts(e)) return;
      e.preventDefault();
      counter.current += 1;
      setIsDragging(true);
    },
    [accepts],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!accepts(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [accepts],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!accepts(e)) return;
      e.preventDefault();
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setIsDragging(false);
    },
    [accepts],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!accepts(e)) return;
      e.preventDefault();
      counter.current = 0;
      setIsDragging(false);
      const raw = Array.from(e.dataTransfer.files);
      const files = filter ? raw.filter(filter) : raw;
      if (files.length) onDrop(files);
    },
    [accepts, filter, onDrop],
  );

  return {
    isDragging,
    bind: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
