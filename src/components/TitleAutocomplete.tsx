import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { fetchSuggestions } from "@/lib/api";
import { useDropdownPosition } from "@/lib/use-dropdown-position";
import type { TransactionSuggestion } from "@/lib/types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: TransactionSuggestion) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
};

const DEBOUNCE_MS = 250;

export function TitleAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  className,
  "data-testid": testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const { menuPos, portalTarget } = useDropdownPosition(open, ref, 288);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const trimmed = debounced.trim();
  const { data } = useQuery({
    queryKey: ["transaction-suggestions", trimmed],
    queryFn: async () => (await fetchSuggestions(trimmed)).data,
    enabled: trimmed.length >= 1 && open,
  });

  const suggestions = trimmed.length >= 1 ? (data ?? []) : [];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const menu = document.getElementById("title-autocomplete-menu");
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const menu =
    open && suggestions.length > 0 ? (
      <div
        id="title-autocomplete-menu"
        className="fixed z-[200] bg-card border rounded-2xl shadow-lg p-2 overflow-y-auto overscroll-contain pointer-events-auto"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: Math.max(menuPos.width, 256),
          maxHeight: menuPos.maxHeight,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {suggestions.map((s) => (
          <button
            key={s.title}
            type="button"
            className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent truncate"
            onClick={() => {
              onSelectSuggestion(s);
              setOpen(false);
            }}
          >
            {s.title}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={className}
        data-testid={testId}
        autoComplete="off"
      />
      {menu && createPortal(menu, portalTarget ?? document.body)}
    </div>
  );
}
