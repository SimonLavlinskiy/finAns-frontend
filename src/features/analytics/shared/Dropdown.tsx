import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useDropdownPosition } from "@/lib/use-dropdown-position";
import { cn } from "@/lib/utils";

type Option<T> = { value: T; label: string };

const MAX_MENU_HEIGHT = 440;

/**
 * Собственный выпадающий список (не системный <select>): белая капсула с шевроном;
 * меню под кнопкой с зазором 8 px или над ней — там, где больше места; высота ≤ 440 px
 * с внутренней прокруткой. Открытие не прокручивает страницу. Закрывается по выбору,
 * клику вне и Esc; ↑/↓ двигают по пунктам, Enter выбирает.
 */
export function Dropdown<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const { menuPos, portalTarget } = useDropdownPosition(open, buttonRef, MAX_MENU_HEIGHT, {
    gap: 8,
    preferLargerSide: true,
    minWidth: 0,
  });

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  function openMenu() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus({ preventScroll: true });
  }

  function choose(i: number) {
    const o = options[i];
    if (o) onChange(o.value);
    close();
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) close(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    // Прокрутка только внутри списка, не страницы.
    if (el && listRef.current) {
      const list = listRef.current;
      if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
      else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
    }
  }, [active, open]);

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel}: ${selected?.label ?? ""}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-3 rounded-full bg-card pl-4 pr-3 text-sm font-medium soft-shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open &&
        portalTarget &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            className="fixed z-[200] overflow-y-auto overscroll-contain rounded-[14px] bg-card p-1.5 soft-shadow-lg focus:outline-none"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width, maxHeight: menuPos.maxHeight }}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={String(o.value)}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-[10px] px-3 py-2 text-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : i === active
                        ? "bg-accent text-foreground"
                        : "text-foreground",
                  )}
                >
                  {o.label}
                </li>
              );
            })}
          </ul>,
          portalTarget,
        )}
    </>
  );
}
