import { useEffect, useState, type RefObject } from "react";

export type DropdownMenuPos = { top: number; left: number; width: number; maxHeight: number };

/**
 * Вычисляет позицию и максимальную высоту portal-дропдауна с учётом
 * доступного места сверху/снизу и мобильной клавиатуры (visualViewport), и
 * выбирает portal-контейнер: ближайший открытый `[role="dialog"]` вместо
 * `document.body` — Radix-модалки блокируют touch-скролл вне своего DOM
 * поддерева, так что портал прямо в body рендерил бы несворачиваемое меню
 * на мобильных.
 */
export type DropdownPositionOptions = {
  /** Зазор между кнопкой и меню, px. */
  gap?: number;
  /** Открывать в сторону, где больше места (иначе — вниз, если снизу ≥ 160 px). */
  preferLargerSide?: boolean;
  /** Минимальная ширина меню, px. */
  minWidth?: number;
};

export function useDropdownPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement>,
  maxMenuHeight = 288,
  options: DropdownPositionOptions = {},
) {
  const { gap = 4, preferLargerSide = false, minWidth = 256 } = options;
  const [menuPos, setMenuPos] = useState<DropdownMenuPos>({ top: 0, left: 0, width: 0, maxHeight: maxMenuHeight });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const dialog = anchorRef.current.closest('[role="dialog"]') as HTMLElement | null;
    setPortalTarget(dialog ?? document.body);

    function recalc() {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      const vv = window.visualViewport;
      const viewportTop = vv?.offsetTop ?? 0;
      const viewportHeight = vv?.height ?? window.innerHeight;
      const viewportBottom = viewportTop + viewportHeight;

      const menuWidth = Math.max(r.width, minWidth);
      const spaceBelow = viewportBottom - r.bottom;
      const spaceAbove = r.top - viewportTop;

      let top: number;
      let maxHeight: number;
      const openBelow = preferLargerSide ? spaceBelow >= spaceAbove : spaceBelow >= 160 || spaceBelow >= spaceAbove;
      if (openBelow) {
        top = r.bottom + gap;
        maxHeight = Math.min(maxMenuHeight, Math.max(120, spaceBelow - gap - 8));
      } else {
        maxHeight = Math.min(maxMenuHeight, Math.max(120, spaceAbove - gap - 8));
        top = Math.max(viewportTop + 8, r.top - maxHeight - gap);
      }

      const left = Math.min(r.left, window.innerWidth - menuWidth - 8);
      setMenuPos({ top, left: Math.max(8, left), width: r.width, maxHeight });
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.visualViewport?.addEventListener("resize", recalc);
    window.visualViewport?.addEventListener("scroll", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.visualViewport?.removeEventListener("resize", recalc);
      window.visualViewport?.removeEventListener("scroll", recalc);
    };
  }, [open, anchorRef, maxMenuHeight, gap, preferLargerSide, minWidth]);

  return { menuPos, portalTarget };
}
