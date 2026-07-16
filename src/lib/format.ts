export function formatKopecks(kopecks: number): string {
  const rub = kopecks / 100;
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rub);
}

export function formatRubles(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(kopecks / 100));
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}

export function parseRublesInput(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return rublesToKopecks(num);
}

/**
 * Вычисляет арифметическое выражение (+, -, *, /, скобки), введённое в поле
 * суммы, например "378+567+844". Возвращает null, если это не арифметическое
 * выражение или оно некорректно (не заменяет обычный числовой ввод).
 * Собственный recursive-descent парсер — намеренно не eval()/new Function()
 * на пользовательском вводе.
 */
export function evaluateAmountExpression(input: string): number | null {
  const normalized = input.replace(/\s/g, "").replace(/,/g, ".");
  if (!normalized || !/[+\-*/]/.test(normalized)) return null;
  if (!/^[0-9+\-*/().]+$/.test(normalized)) return null;

  let pos = 0;

  function peek(): string | undefined {
    return normalized[pos];
  }

  function parseExpr(): number {
    let value = parseTerm();
    for (;;) {
      const op = peek();
      if (op === "+" || op === "-") {
        pos++;
        const rhs = parseTerm();
        value = op === "+" ? value + rhs : value - rhs;
      } else {
        return value;
      }
    }
  }

  function parseTerm(): number {
    let value = parseFactor();
    for (;;) {
      const op = peek();
      if (op === "*" || op === "/") {
        pos++;
        const rhs = parseFactor();
        if (op === "/") {
          if (rhs === 0) throw new Error("division by zero");
          value = value / rhs;
        } else {
          value = value * rhs;
        }
      } else {
        return value;
      }
    }
  }

  function parseFactor(): number {
    if (peek() === "-") {
      pos++;
      return -parseFactor();
    }
    if (peek() === "(") {
      pos++;
      const value = parseExpr();
      if (peek() !== ")") throw new Error("expected )");
      pos++;
      return value;
    }
    const start = pos;
    while (pos < normalized.length && /[0-9.]/.test(normalized[pos])) pos++;
    if (pos === start) throw new Error("expected number");
    const num = parseFloat(normalized.slice(start, pos));
    if (isNaN(num)) throw new Error("invalid number");
    return num;
  }

  try {
    const result = parseExpr();
    if (pos !== normalized.length) return null; // лишние символы после выражения
    if (!isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
