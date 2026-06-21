import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImportDropzone } from "@/features/import/components/ImportDropzone";
import { ModerationTable } from "@/features/import/components/ModerationTable";
import { ModerationToolbar } from "@/features/import/components/ModerationToolbar";
import {
  acceptModerationBatch,
  acceptModerationRow,
  closeImportBatch,
  fetchActiveImportBatch,
  fetchTags,
  updateModerationRow,
  uploadImportBatch,
  type UpdateModerationRowInput,
} from "@/lib/api";
import { parseRublesInput } from "@/lib/format";
import type { ImportBatchWithRows, ModerationRow } from "@/lib/types";

type DataResponse<T> = { data: T };
type ActiveBatchData = DataResponse<ImportBatchWithRows> | null;

const ACTIVE_BATCH_KEY = ["import", "active"];
const FADE_MS = 1200;

function toRowPatch(patch: UpdateModerationRowInput): Partial<ModerationRow> {
  const out: Partial<ModerationRow> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.amount !== undefined) out.amount = parseRublesInput(patch.amount);
  if (patch.date !== undefined) out.date = patch.date;
  if (patch.tag_id !== undefined) out.tag_id = patch.tag_id;
  if (patch.category !== undefined) out.category = patch.category as ModerationRow["category"];
  if (patch.specificity !== undefined)
    out.specificity = patch.specificity as ModerationRow["specificity"];
  if (patch.comment !== undefined) out.comment = patch.comment;
  if (patch.url !== undefined) out.url = patch.url;
  return out;
}

export function ImportPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set());
  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await fetchTags()).data,
  });
  const tags = tagsData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ACTIVE_BATCH_KEY,
    queryFn: fetchActiveImportBatch,
  });

  const batch = data?.data.batch;
  const rows = data?.data.rows ?? [];

  function removeRowsFromCache(ids: number[]) {
    qc.setQueryData<ActiveBatchData>(ACTIVE_BATCH_KEY, (old) => {
      if (!old) return old;
      return { data: { ...old.data, rows: old.data.rows.filter((r) => !ids.includes(r.id)) } };
    });
  }

  function scheduleFadeRemoval(ids: number[]) {
    setFadingIds((prev) => new Set([...prev, ...ids]));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    qc.invalidateQueries({ queryKey: ["balance"] });
    window.setTimeout(() => {
      removeRowsFromCache(ids);
      setFadingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, FADE_MS);
  }

  const uploadMutation = useMutation({
    mutationFn: uploadImportBatch,
    onSuccess: (res) => {
      qc.setQueryData(ACTIVE_BATCH_KEY, res);
      setSelectedIds(new Set());
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateModerationRowInput }) =>
      updateModerationRow(id, patch),
    onMutate: async ({ id, patch }) => {
      const previous = qc.getQueryData<ActiveBatchData>(ACTIVE_BATCH_KEY);
      qc.setQueryData<ActiveBatchData>(ACTIVE_BATCH_KEY, (old) => {
        if (!old) return old;
        return {
          data: {
            ...old.data,
            rows: old.data.rows.map((r) =>
              r.id === id ? { ...r, ...toRowPatch(patch) } : r,
            ),
          },
        };
      });
      return { previous };
    },
    onSuccess: (res, { id }) => {
      qc.setQueryData<ActiveBatchData>(ACTIVE_BATCH_KEY, (old) => {
        if (!old) return old;
        return {
          data: { ...old.data, rows: old.data.rows.map((r) => (r.id === id ? res.data : r)) },
        };
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(ACTIVE_BATCH_KEY, context.previous);
    },
  });

  const acceptRowMutation = useMutation({
    mutationFn: (id: number) => acceptModerationRow(id),
    onMutate: (id) => setAcceptingIds((prev) => new Set(prev).add(id)),
    onSuccess: (_res, id) => scheduleFadeRemoval([id]),
    onSettled: (_d, _e, id) =>
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }),
  });

  const acceptBatchMutation = useMutation({
    mutationFn: ({ batchId, rowIds }: { batchId: number; rowIds: number[] }) =>
      acceptModerationBatch(batchId, rowIds),
    onMutate: ({ rowIds }) =>
      setAcceptingIds((prev) => new Set([...prev, ...rowIds])),
    onSuccess: (_res, { rowIds }) => scheduleFadeRemoval(rowIds),
    onSettled: (_d, _e, { rowIds }) =>
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        rowIds.forEach((id) => next.delete(id));
        return next;
      }),
  });

  const closeBatchMutation = useMutation({
    mutationFn: (batchId: number) => closeImportBatch(batchId),
    onSuccess: () => {
      qc.setQueryData<ActiveBatchData>(ACTIVE_BATCH_KEY, null);
      setSelectedIds(new Set());
    },
  });

  const readyRows = rows.filter((r) => r.status === "ready");
  const errorRows = rows.filter((r) => r.status === "error");
  const allReadySelected =
    readyRows.length > 0 && readyRows.every((r) => selectedIds.has(r.id));
  const isComplete = !!batch && rows.every((r) => r.status === "error");
  const transferredCount = batch ? batch.total_rows - rows.length : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Импорт</h1>
        <p className="page-subtitle">Загрузка транзакций из CSV-файла</p>
      </div>

      {!batch && (
        <ImportDropzone
          isUploading={uploadMutation.isPending}
          error={uploadMutation.error}
          onUpload={(file) => uploadMutation.mutate(file)}
        />
      )}

      {batch && (
        <>
          <div className="surface-card p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {batch.file_name} · {batch.total_rows} строк
            </p>
          </div>

          {isComplete ? (
            <div className="surface-card p-6 space-y-4">
              <p className="font-medium text-foreground">
                Импорт завершён: {transferredCount} транзакций добавлено, {errorRows.length}{" "}
                строк с ошибками
              </p>
              <div className="flex gap-2">
                <Button className="rounded-xl" onClick={() => navigate("/transactions")}>
                  Перейти к транзакциям
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => closeBatchMutation.mutate(batch.id)}
                >
                  Загрузить новый файл
                </Button>
              </div>
            </div>
          ) : (
            <>
              {errorRows.length > 0 && (
                <div className="surface-card p-4 space-y-1 text-sm text-destructive">
                  {errorRows.map((row) =>
                    Object.entries(row.field_errors).map(([field, message]) => (
                      <p key={`${row.id}-${field}`}>
                        Строка {row.row_number}: поле «{field}» {message}
                      </p>
                    )),
                  )}
                </div>
              )}

              <ModerationToolbar
                totalRows={batch.total_rows}
                currentRows={rows}
                selectedCount={selectedIds.size}
                allReadySelected={allReadySelected}
                accepting={acceptBatchMutation.isPending}
                onToggleSelectAllReady={(checked) => {
                  setSelectedIds(checked ? new Set(readyRows.map((r) => r.id)) : new Set());
                }}
                onAcceptSelected={() => {
                  if (!batch) return;
                  if (
                    !window.confirm(
                      `Добавить ${selectedIds.size} транзакций в таблицу расходов?`,
                    )
                  )
                    return;
                  acceptBatchMutation.mutate({
                    batchId: batch.id,
                    rowIds: Array.from(selectedIds),
                  });
                }}
              />

              {!isLoading && (
                <ModerationTable
                  rows={rows}
                  tags={tags}
                  fadingIds={fadingIds}
                  selectedIds={selectedIds}
                  acceptingIds={acceptingIds}
                  onToggleSelect={(id) =>
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  onPatch={(id, patch) => patchMutation.mutate({ id, patch })}
                  onAccept={(id) => acceptRowMutation.mutate(id)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
