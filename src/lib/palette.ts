/** Палитра finAns — luxury */
export const PALETTE = {
  sapphire: "#3C5070",
  royalBlue: "#112250",
  quicksand: "#E0C68F",
  swanWing: "#F5F0E9",
  shellstone: "#D9CBC2",
} as const;

/** Цвета только из палитры — для корневых категорий */
export const TAG_COLORS = [
  PALETTE.royalBlue,
  PALETTE.sapphire,
  PALETTE.quicksand,
  PALETTE.shellstone,
] as const;

const CHILD_LIGHTEN = 0.4;

export function lightenColor(hex: string, amount = CHILD_LIGHTEN): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = parsed.map(mix);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

export function contrastText(bg: string): string {
  const parsed = parseHex(bg);
  if (!parsed) return "#FFFFFF";
  const [r, g, b] = parsed;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? PALETTE.royalBlue : "#FFFFFF";
}

export function resolveTagDisplayColors(
  tag: { color: string; parent?: { color?: string } | null },
  parentColor?: string,
): { category?: string; self: string } {
  const base = parentColor ?? tag.parent?.color;
  if (base) {
    return { category: base, self: lightenColor(base) };
  }
  return { self: tag.color };
}
