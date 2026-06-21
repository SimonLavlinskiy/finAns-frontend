import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImportFormatHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" title="Формат файла">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Формат CSV-файла</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Кодировка UTF-8, разделитель — запятая, первая строка — заголовки.
          </p>
          <div>
            <p className="font-medium mb-1">Обязательные колонки</p>
            <p className="text-muted-foreground">title, amount, date</p>
          </div>
          <div>
            <p className="font-medium mb-1">Необязательные колонки</p>
            <p className="text-muted-foreground">tag, category, specificity, comment, url</p>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>date — формат YYYY-MM-DD</li>
            <li>amount — число с точкой, в рублях (1250.00 или 1250)</li>
            <li>category — expense (расход) или income (доход)</li>
            <li>specificity — required (обязательный) или simple (простой)</li>
            <li>
              tag — название тега или путь через «/» для подтега (Еда/Кафе); если тег не
              найден в системе, строка получит статус «Ошибка»
            </li>
          </ul>
          <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
            title,amount,date,tag,category,specificity,comment,url
            <br />
            Продукты Магнит,1250.00,2026-06-15,Еда,expense,simple,,
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
