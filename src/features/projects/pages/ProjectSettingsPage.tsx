import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/features/auth/AuthProvider";
import { addProjectMember, createTag, deleteTag, fetchProjectMembers, fetchTags, removeProjectMember, updateTag } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
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

export function ProjectSettingsPage() {
  const { user, projectId } = useAuth();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Tags state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState<TagFormState>(emptyForm);
  const [subtagParentId, setSubtagParentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => (await fetchProjectMembers(projectId!)).data,
    enabled: !!projectId,
  });

  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });
  const tags = tagsData ?? [];
  const parentOptions = rootTagsOnly(tags, editTag?.id);

  const currentMember = members?.find((m) => m.user_id === user?.id);
  const isOwner = currentMember?.role === "owner";

  const addMutation = useMutation({
    mutationFn: () => addProjectMember(projectId!, username.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      setUsername("");
      setAddError(null);
    },
    onError: (err: Error) => {
      setAddError(err instanceof ApiError ? err.message : "Не удалось добавить участника");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });

  const createTagMut = useMutation({
    mutationFn: () =>
      createTag({
        name: tagForm.name,
        color: tagForm.color,
        parent_id: tagForm.parentId === "none" ? null : Number(tagForm.parentId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setCreateOpen(false);
      setSubtagParentId(null);
      setTagForm(emptyForm());
    },
  });

  const updateTagMut = useMutation({
    mutationFn: () => updateTag(editTag!.id, { name: tagForm.name, color: tagForm.color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setEditTag(null);
      setTagForm(emptyForm());
    },
  });

  const deleteTagMut = useMutation({
    mutationFn: (id: number) => deleteTag(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  function openCreateTag(parentId: number | null = null) {
    const parent = parentId ? tags.find((t) => t.id === parentId) : null;
    setTagForm({
      ...emptyForm(),
      parentId: parentId ? String(parentId) : "none",
      color: parent?.color ?? TAG_COLORS[0],
    });
    setSubtagParentId(parentId);
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
    setCreateOpen(true);
  }

  function openEditTag(tag: Tag) {
    setEditTag(tag);
    setTagForm({
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
      <div>
        <h1 className="page-title">Настройки проекта</h1>
        <p className="page-subtitle">Участники, доступ и категории</p>
      </div>

      {/* Members section */}
      <div className="surface-card p-4 space-y-4">
        <h2 className="font-semibold">Участники</h2>

        {membersLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <div className="space-y-2">
            {members?.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between py-2 px-1 border-b border-border/40 last:border-0"
              >
                <div>
                  <span className="font-medium">{m.display_name}</span>
                  <span className="text-muted-foreground text-sm ml-2">@{m.username}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {m.role === "owner" ? "Владелец" : "Участник"}
                  </span>
                </div>
                {isOwner && m.user_id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Удалить @${m.username} из проекта?`))
                        removeMutation.mutate(m.user_id);
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="pt-2 space-y-2 border-t border-border/40">
            <p className="text-sm font-medium">Добавить участника</p>
            <div className="flex gap-2">
              <Input
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!username.trim() || addMutation.isPending}
              >
                Добавить
              </Button>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>
        )}
      </div>

      {/* Categories section */}
      <div className="surface-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Категории</h2>
          <Button size="sm" className="rounded-xl" onClick={() => openCreateTag(null)}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить категорию
          </Button>
        </div>

        {tagsLoading ? (
          <p className="text-muted-foreground text-sm">Загрузка…</p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <TagCategoryRow
                key={tag.id}
                tag={tag}
                expanded={expanded[tag.id] ?? false}
                onToggle={() => toggleExpand(tag.id)}
                onAddSubtag={() => openCreateTag(tag.id)}
                onEdit={openEditTag}
                onDelete={(id) => {
                  if (confirm("Удалить категорию и подкатегории?")) deleteTagMut.mutate(id);
                }}
              />
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">Нет категорий. Добавьте первую.</p>
            )}
          </ul>
        )}
      </div>

      {/* Create tag dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {subtagParentId ? "Новая подкатегория" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <TagFormFields
            form={tagForm}
            setForm={setTagForm}
            parentOptions={parentOptions}
            showParent={!subtagParentId}
            isSubtag={!!subtagParentId}
          />
          <Button
            className="rounded-full w-full"
            disabled={!tagForm.name.trim()}
            onClick={() => createTagMut.mutate()}
          >
            Сохранить
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit tag dialog */}
      <Dialog open={!!editTag} onOpenChange={(o) => !o && setEditTag(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <TagFormFields
            form={tagForm}
            setForm={setTagForm}
            parentOptions={parentOptions}
            showParent={false}
            isSubtag={!!editTag?.parent_id}
          />
          <Button
            className="rounded-full w-full"
            disabled={!tagForm.name.trim()}
            onClick={() => updateTagMut.mutate()}
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
            title="Добавить подкатегорию"
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
            <li key={child.id} className="flex items-center gap-2 px-3 py-2 pl-12">
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
            <SelectValue placeholder="Родительская категория" />
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
