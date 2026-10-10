"use client";

import { useState, type RefObject } from "react";

/**
 * Exports the referenced DOM node as a downloadable PNG (roadmap #12) — e.g. a portfolio
 * demo screenshot of the current conditions card. `html-to-image` is loaded lazily so its
 * ~5kb (plus the canvas work it does) is only paid for by someone who actually clicks
 * export, not on every page load.
 */
export function ExportSnapshotButton({
  targetRef,
  fileName,
}: {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleExport() {
    const node = targetRef.current;
    if (!node || isExporting) {
      return;
    }

    setIsExporting(true);
    setFailed(false);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to export the snapshot as PNG.", error);
      setFailed(true);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      title="Export as PNG"
      aria-label="Export as PNG"
      className="shrink-0 rounded-full p-1 text-ink-muted transition hover:bg-black/5 hover:text-ink-primary disabled:opacity-50 dark:hover:bg-white/10"
    >
      <span aria-hidden>{isExporting ? "…" : "📷"}</span>
      {failed && <span className="sr-only">Export failed</span>}
    </button>
  );
}
