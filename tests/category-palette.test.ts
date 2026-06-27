import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS } from "../src/lib/palette";
import { contrastText } from "../src/lib/palette";

const DARK_TEXT = "#112250";
const LIGHT_TEXT = "#FFFFFF";

const expectedContrast: Record<string, string> = {
  "#112250": LIGHT_TEXT,
  "#3C5070": LIGHT_TEXT,
  "#6B4226": LIGHT_TEXT,
  "#8A6D3B": LIGHT_TEXT,
  "#4A5D52": LIGHT_TEXT,
  "#7D6B91": LIGHT_TEXT,
  "#B85C5C": LIGHT_TEXT,
  "#E0C68F": DARK_TEXT,
  "#D9CBC2": DARK_TEXT,
  "#9FAFA0": DARK_TEXT,
};

describe("contrastText на CATEGORY_COLORS", () => {
  it("все 10 цветов присутствуют в палитре", () => {
    expect(CATEGORY_COLORS).toHaveLength(10);
  });

  for (const color of CATEGORY_COLORS) {
    it(`${color} → ${expectedContrast[color]}`, () => {
      expect(contrastText(color)).toBe(expectedContrast[color]);
    });
  }
});
