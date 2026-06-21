import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TagPills } from "@/components/TagPills";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTag, deleteTag, fetchTags, updateTag } from "@/lib/api";
import { TAG_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

type TagFormState = {
  name: string;
  color: string;
  parentId: string;
};

const emptyForm = (): TagFormState => ({
  name: "",
  color: TAG_COLORS[0],
  parentId: "none",
});

function rootTagsOnly(tags: Tag[], excludeId?: number): Tag[] {
  return tags.filter((t) => t.id !== excludeId);
}

export function TagsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [form, setForm] = useState<TagFormState>(emptyForm);
  const [subtagParentId, setSubtagParentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });
  const tags = tagsData ?? [];

  const parentOptions = rootTagsOnly(tags, editTag?.id);

  const createMut = useMutation({
    mutationFn: () =>
      createTag({
        name: form.name,
        color: form.color,
        parent_id:
          form.parentId === "none" ? null : Number(form.parentId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setCreateOpen(false);
      setSubtagParentId(null);
      setForm(emptyForm());
    },
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateTag(editTag!.id, { name: form.name, color: form.color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setEditTag(null);
      setForm(emptyForm());
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTag(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  function openCreate(parentId: number | null = null) {
    const parent = parentId ? tags.find((t) => t.id === parentId) : null;
    setForm({
      ...emptyForm(),
      parentId: parentId ? String(parentId) : "none",
      color: parent?.color ?? TAG_COLORS[0],
    });
    setSubtagParentId(parentId);
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
    setCreateOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditTag(tag);
    setForm({
      name: tag.name,
      color: tag.color,
      parentId: tag.parent_id ? String(tag.parent_id) : "none",
    });
  }

  function toggleExpand(id: number) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Метки</h1>
          <p className="page-subtitle">Категории и подкатегории</p>
        </div>
        <Button className="rounded-xl" onClick={() => openCreate(null)}>
          <Plus className="h-4 w-4 mr-1" />
          Добавить метку
        </Button>
      </div>

      <div className="surface-card p-5">
        {isLoading ? (
          <p className="text-muted-foreground">Загрузка…</p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <TagCategoryRow
                key={tag.id}
                tag={tag}
                expanded={expanded[tag.id] ?? false}
                onToggle={() => toggleExpand(tag.id)}
                onAddSubtag={() => openCreate(tag.id)}
                onEdit={openEdit}
                onDelete={(id) => {
                  if (confirm("Удалить метку и подметки?")) deleteMut.mutate(id);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {subtagParentId ? "Новая подметка" : "Новая метка"}
            </DialogTitle>
          </DialogHeader>
          <TagFormFields
            form={form}
            setForm={setForm}
            parentOptions={parentOptions}
            showParent={!subtagParentId}
            isSubtag={!!subtagParentId}
          />
          <Button
            className="rounded-full w-full"
            disabled={!form.name.trim()}
            onClick={() => createMut.mutate()}
          >
            Сохранить
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTag} onOpenChange={(o) => !o && setEditTag(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать метку</DialogTitle>
          </DialogHeader>
          <TagFormFields
            form={form}
            setForm={setForm}
            parentOptions={parentOptions}
            showParent={false}
            isSubtag={!!editTag?.parent_id}
          />
          <Button
            className="rounded-full w-full"
            disabled={!form.name.trim()}
            onClick={() => updateMut.mutate()}
          >
            Сохранить изменения
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TagCategoryRow({
  tag,
  expanded,
  onToggle,
  onAddSubtag,
  onEdit,
  onDelete,
}: {
  tag: Tag;
  expanded: boolean;
  onToggle: () => void;
  onAddSubtag: () => void;
  onEdit: (t: Tag) => void;
  onDelete: (id: number) => void;
}) {
  const hasChildren = (tag.children?.length ?? 0) > 0;

  return (
    <li className="rounded-2xl bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        {hasChildren ? (
          <button type="button" onClick={onToggle} className="p-1 shrink-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}
        <TagPills tag={tag} size="md" />
        <div className="flex items-center gap-0.5 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
            title="Добавить подметку"
            onClick={onAddSubtag}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onEdit(tag)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-destructive"
            onClick={() => onDelete(tag.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="divide-y divide-border/40 bg-card">
          {tag.children!.map((child) => (
            <li
              key={child.id}
              className="flex items-center gap-2 px-3 py-2 pl-12"
            >
              <TagPills tag={child} parentColor={tag.color} size="sm" />
              <div className="flex items-center gap-0.5 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => onEdit({ ...child, parent_id: tag.id })}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-destructive"
                  onClick={() => onDelete(child.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function TagFormFields({
  form,
  setForm,
  parentOptions,
  showParent,
  isSubtag,
}: {
  form: TagFormState;
  setForm: (f: TagFormState) => void;
  parentOptions: Tag[];
  showParent: boolean;
  isSubtag: boolean;
}) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Название"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-xl"
      />
      {showParent && (
        <Select
          value={form.parentId}
          onValueChange={(v) => setForm({ ...form, parentId: v })}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Родительская метка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Корневая категория</SelectItem>
            {parentOptions.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex gap-2 flex-wrap">
        {isSubtag ? (
          <p className="text-sm text-muted-foreground">
            Цвет наследуется от категории (более светлый оттенок).
          </p>
        ) : (
          TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform",
                form.color === c ? "border-foreground scale-110" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              onClick={() => setForm({ ...form, color: c })}
            />
          ))
        )}
      </div>
    </div>
  );
}
