"use client";

/**
 * Hook de glisser-déposer de fichiers sur un élément.
 *
 * Renvoie :
 *  - `isDragging` : vrai tant qu'au moins un fichier survole la zone ;
 *  - `bind`       : à étaler sur l'élément cible (onDragEnter/Over/Leave/Drop).
 *
 * Le compteur interne `counter` évite le clignotement classique quand le
 * curseur traverse des enfants : seul un vrai `dragLeave` sortant de la
 * zone remet `isDragging` à false.
 */
import { useCallback, useRef, useState, type DragEvent } from "react";

export type UseFileDropOptions = {
  /** Callback invoqué avec les fichiers déposés (déjà filtrés). */
  onDrop: (files: File[]) => void;
  /** Filtre optionnel ; renvoyer false exclut le fichier. */
  filter?: (file: File) => boolean;
  /** Quand `false`, le hook n'écoute plus (utile pour désactiver sur mobile). */
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