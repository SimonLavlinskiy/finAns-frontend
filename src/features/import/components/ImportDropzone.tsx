import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportFormatHelp } from "@/features/import/components/ImportFormatHelp";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Props = {
  onUpload: (file: File) => void;
  isUploading: boolean;
  error: unknown;
};

function describeUploadError(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof ApiError) return err.message;
  return "Не удалось загрузить файл. Проверьте соединение с сервером";
}

export function ImportDropzone({ onUpload, isUploading, error }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return;
    onUpload(file);
  }

  return (
    <div className="surface-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Импорт транзакций из CSV</h2>
          <p className="text-sm text-muted-foreground">
            Загрузите файл, проверьте и исправьте строки, затем примите их в таблицу
            операций
          </p>
        </div>
        <ImportFormatHelp />
      </div>

      <div
        className={cn(
          "rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border/80",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Перетащите .csv файл сюда или выберите его вручную
        </p>
        <Button
          type="button"
          className="rounded-xl"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Загрузка…" : "Выбрать файл"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {describeUploadError(error) && (
        <p className="text-sm text-destructive">{describeUploadError(error)}</p>
      )}
    </div>
  );
}
