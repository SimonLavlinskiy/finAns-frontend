import { describe, it, expect, beforeEach } from "vitest";
import {
  clearSession,
  getActiveProjectId,
  getActiveUserId,
  setActiveProjectId,
  setActiveUserId,
} from "../src/lib/session";

beforeEach(() => {
  localStorage.clear();
});

describe("session userId", () => {
  it("getActiveUserId → null если не установлен", () => {
    expect(getActiveUserId()).toBeNull();
  });

  it("setActiveUserId → getActiveUserId возвращает то же значение", () => {
    setActiveUserId(42);
    expect(getActiveUserId()).toBe(42);
  });

  it("setActiveUserId обновляет значение", () => {
    setActiveUserId(1);
    setActiveUserId(99);
    expect(getActiveUserId()).toBe(99);
  });
});

describe("session projectId", () => {
  it("getActiveProjectId → null если не установлен", () => {
    expect(getActiveProjectId()).toBeNull();
  });

  it("setActiveProjectId → getActiveProjectId возвращает то же значение", () => {
    setActiveProjectId(7);
    expect(getActiveProjectId()).toBe(7);
  });
});

describe("clearSession", () => {
  it("сбрасывает оба значения", () => {
    setActiveUserId(1);
    setActiveProjectId(2);
    clearSession();
    expect(getActiveUserId()).toBeNull();
    expect(getActiveProjectId()).toBeNull();
  });
});
