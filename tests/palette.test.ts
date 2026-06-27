import { describe, it, expect } from "vitest";
import { PALETTE, TAG_COLORS, lightenColor, contrastText, resolveTagDisplayColors } from "../src/lib/palette";

describe("PALETTE", () => {
  it("contains expected colors", () => {
    expect(PALETTE.royalBlue).toBe("#112250");
    expect(PALETTE.sapphire).toBe("#3C5070");
    expect(PALETTE.quicksand).toBe("#E0C68F");
  });
});

describe("TAG_COLORS", () => {
  it("has at least 2 entries", () => {
    expect(TAG_COLORS.length).toBeGreaterThanOrEqual(2);
  });
  it("all entries are valid hex strings", () => {
    for (const c of TAG_COLORS) {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("lightenColor", () => {
  it("black + 50% → gray", () => {
    expect(lightenColor("#000000", 0.5)).toBe("#808080");
  });
  it("white stays white", () => {
    expect(lightenColor("#ffffff", 0.5)).toBe("#ffffff");
  });
  it("invalid hex passthrough", () => {
    expect(lightenColor("notahex")).toBe("notahex");
  });
  it("undefined → fallback color, не падает", () => {
    expect(() => lightenColor(undefined as unknown as string)).not.toThrow();
    expect(lightenColor(undefined as unknown as string)).toBe("#888888");
  });
  it("amount 0 → no change", () => {
    const color = PALETTE.royalBlue;
    expect(lightenColor(color, 0)).toBe(color.toLowerCase());
  });
  it("amount 1 → white", () => {
    expect(lightenColor(PALETTE.royalBlue, 1)).toBe("#ffffff");
  });
});

describe("contrastText", () => {
  it("dark bg → white text", () => {
    expect(contrastText(PALETTE.royalBlue)).toBe("#FFFFFF");
  });
  it("light bg → dark text", () => {
    expect(contrastText("#FFFFFF")).toBe(PALETTE.royalBlue);
  });
  it("very light color → dark text", () => {
    expect(contrastText(PALETTE.swanWing)).toBe(PALETTE.royalBlue);
  });
  it("invalid hex → white text (fallback)", () => {
    expect(contrastText("invalid")).toBe("#FFFFFF");
  });
  it("undefined → white text fallback, не падает", () => {
    expect(() => contrastText(undefined as unknown as string)).not.toThrow();
    expect(contrastText(undefined as unknown as string)).toBe("#FFFFFF");
  });
});

describe("resolveTagDisplayColors", () => {
  it("root tag → self color only", () => {
    const result = resolveTagDisplayColors({ color: "#3C5070", parent: null });
    expect(result.self).toBe("#3C5070");
    expect(result.category).toBeUndefined();
  });

  it("child tag with parent → category = parent color, self = lightened", () => {
    const parentColor = "#112250";
    const result = resolveTagDisplayColors({
      color: "#000",
      parent: { color: parentColor },
    });
    expect(result.category).toBe(parentColor);
    expect(result.self).not.toBe(parentColor);
    // self should be lighter than parent
    const selfHex = parseInt(result.self.replace("#", ""), 16);
    const parentHex = parseInt(parentColor.replace("#", ""), 16);
    expect(selfHex).toBeGreaterThan(parentHex);
  });

  it("explicit parentColor overrides tag.parent.color", () => {
    const overrideColor = "#3C5070";
    const result = resolveTagDisplayColors(
      { color: "#000", parent: { color: "#112250" } },
      overrideColor,
    );
    expect(result.category).toBe(overrideColor);
  });
});
