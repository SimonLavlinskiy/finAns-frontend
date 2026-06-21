import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TagPills } from "@/components/TagPills";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

type Props = {
  tags: Tag[];
  value: string;
  onChange: (tagId: string) => void;
  placeholder?: string;
  className?: string;
  /** Скрыть пункт «Все метки» (для формы создания) */
  required?: boolean;
};

export function TagFilterPicker({
  tags,
  value,
  onChange,
  placeholder = "Все метки",
  className,
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    tags.forEach((t) => {
      if (t.children?.length) init[t.id] = true;
    });
    return init;
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const menu = document.getElementById("tag-picker-menu");
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }, [open]);

  const selected = findTagById(tags, value ? Number(value) : null);

  function select(id: number | null) {
    if (required && id == null) return;
    onChange(id ? String(id) : "");
    setOpen(false);
  }

  const menu = open ? (
    <div
      id="tag-picker-menu"
      className="fixed z-[200] bg-card border rounded-2xl shadow-lg p-2 max-h-72 overflow-y-auto pointer-events-auto"
      style={{
        top: menuPos.top,
        left: menuPos.left,
        width: Math.max(menuPos.width, 256),
      }}
    >
      {!required && (
        <button
          type="button"
          className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent"
          onClick={() => select(null)}
        >
          Все метки
        </button>
      )}
      <div className={cn("space-y-0.5", !required && "mt-1")}>
        {tags.map((tag) => (
          <TagGroup
            key={tag.id}
            tag={tag}
            value={value}
            expanded={expanded[tag.id] ?? false}
            onToggle={() =>
              setExpanded((e) => ({ ...e, [tag.id]: !e[tag.id] }))
            }
            onSelect={select}
          />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full rounded-full justify-between font-normal h-10",
          required && !value && "border-destructive/50",
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">
          {value && selected ? (
            <TagPills tag={selected} size="sm" />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
      </Button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
}

function TagGroup({
  tag,
  value,
  expanded,
  onToggle,
  onSelect,
}: {
  tag: Tag;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: number) => void;
}) {
  const hasChildren = (tag.children?.length ?? 0) > 0;
  const isSelected = value === String(tag.id);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-accent/60",
          isSelected && "bg-accent",
        )}
      >
        {hasChildren ? (
          <button type="button" className="p-0.5 shrink-0" onClick={onToggle}>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          type="button"
          className="flex-1 text-left min-w-0"
          onClick={() => onSelect(tag.id)}
        >
          <TagPills tag={tag} size="sm" />
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="ml-5 pl-2 border-l-2 border-primary/25 space-y-0.5">
          {tag.children!.map((child) => {
            const childSelected = value === String(child.id);
            return (
              <button
                key={child.id}
                type="button"
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent/60",
                  childSelected && "bg-accent",
                )}
                onClick={() => onSelect(child.id)}
              >
                <TagPills tag={child} parentColor={tag.color} size="sm" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function findTagById(tags: Tag[], id: number | null): Tag | null {
  if (id == null) return null;
  for (const t of tags) {
    if (t.id === id) return t;
    for (const c of t.children ?? []) {
      if (c.id === id) return c;
    }
  }
  return null;
}

export function TagFormPicker({
  tags,
  value,
  onChange,
}: {
  tags: Tag[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TagFilterPicker
      tags={tags}
      value={value}
      onChange={onChange}
      placeholder="Выберите метку"
      required
    />
  );
}
