import { describe, expect, it } from "vitest";
import { moodColor } from "../src/features/analytics/components/SpendingMoodCalendar";

describe("moodColor", () => {
  it("share=0 returns the income (green) endpoint", () => {
    expect(moodColor(0)).toBe("hsl(152, 55%, 42%)");
  });

  it("share=1 returns the expense (red) endpoint", () => {
    expect(moodColor(1)).toBe("hsl(0, 72%, 58%)");
  });

  it("share=0.5 is the midpoint of both endpoints", () => {
    expect(moodColor(0.5)).toBe("hsl(76, 63.5%, 50%)");
  });
});
