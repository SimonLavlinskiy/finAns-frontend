import { describe, it, expect, vi, afterEach } from "vitest";
import { apiClient, apiUpload, ApiError } from "../src/lib/api-client";

// Helpers to build mock responses
function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockEmptyResponse(status: number): Response {
  return new Response(null, { status });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiError", () => {
  it("is instanceof Error", () => {
    const err = new ApiError("fail", 400, "BAD", {});
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("fail");
    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD");
    expect(err.name).toBe("ApiError");
  });

  it("works without optional fields", () => {
    const err = new ApiError("oops", 500);
    expect(err.code).toBeUndefined();
    expect(err.fields).toBeUndefined();
  });
});

describe("apiClient", () => {
  it("returns parsed JSON on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({ data: { id: 1, name: "test" } }),
    );

    const result = await apiClient<{ data: { id: number; name: string } }>("/api/v1/test");
    expect(result).toEqual({ data: { id: 1, name: "test" } });
  });

  it("returns undefined on 204", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockEmptyResponse(204));

    const result = await apiClient<undefined>("/api/v1/test");
    expect(result).toBeUndefined();
  });

  it("throws ApiError with message and code on error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse(
        { error: { code: "NOT_FOUND", message: "Resource not found" } },
        404,
      ),
    );

    await expect(apiClient("/api/v1/missing")).rejects.toThrow(ApiError);
    try {
      await apiClient("/api/v1/missing");
    } catch (e) {
      if (e instanceof ApiError) {
        expect(e.status).toBe(404);
        expect(e.code).toBe("NOT_FOUND");
        expect(e.message).toBe("Resource not found");
      }
    }
  });

  it("throws ApiError with field errors on 422", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "validation failed",
            fields: { title: "required" },
          },
        },
        422,
      ),
    );

    try {
      await apiClient("/api/v1/transactions", { method: "POST" });
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      if (e instanceof ApiError) {
        expect(e.status).toBe(422);
        expect(e.fields).toEqual({ title: "required" });
      }
    }
  });

  it("dispatches finans:unauthorized event on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({ error: { code: "UNAUTHORIZED", message: "no auth" } }, 401),
    );

    // Provide a minimal window stub for event dispatching in Node.js test env
    const dispatched: Event[] = [];
    const mockWindow = new EventTarget();
    vi.stubGlobal("window", mockWindow);
    mockWindow.addEventListener("finans:unauthorized", (e) => dispatched.push(e));

    try {
      await apiClient("/api/v1/protected");
    } catch {
      // expected — 401 throws ApiError
    } finally {
      vi.unstubAllGlobals();
    }

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toBe("finans:unauthorized");
  });

  it("includes credentials and Content-Type header", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse({ ok: true }));

    await apiClient("/api/v1/test", { method: "GET" });

    expect(spy).toHaveBeenCalledOnce();
    const [, options] = spy.mock.calls[0];
    expect((options as RequestInit).credentials).toBe("include");
    expect(((options as RequestInit).headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("serialises body to JSON", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse({ data: {} }, 201));

    await apiClient("/api/v1/transactions", { method: "POST", body: { title: "test", amount: 100 } });

    const [, options] = spy.mock.calls[0];
    expect((options as RequestInit).body).toBe(JSON.stringify({ title: "test", amount: 100 }));
  });

  it("falls back to statusText when response body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("not json", { status: 503, statusText: "Service Unavailable" }),
    );

    try {
      await apiClient("/api/v1/test");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      if (e instanceof ApiError) {
        expect(e.status).toBe(503);
      }
    }
  });
});

describe("apiUpload", () => {
  it("posts FormData and returns JSON on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({ data: { path: "/uploads/file.csv" } }),
    );

    const fd = new FormData();
    fd.append("file", new Blob(["csv"]), "test.csv");

    const result = await apiUpload<{ data: { path: string } }>("/api/v1/import/batches", fd);
    expect(result.data.path).toBe("/uploads/file.csv");
  });

  it("throws ApiError on upload failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({ error: { code: "TOO_LARGE", message: "file too large" } }, 413),
    );

    const fd = new FormData();
    await expect(apiUpload("/api/v1/import/batches", fd)).rejects.toThrow(ApiError);
  });

  it("sends without Content-Type header (multipart/form-data boundary)", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse({ data: {} }));

    const fd = new FormData();
    await apiUpload("/api/v1/import/batches", fd);

    const [, options] = spy.mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string> | undefined;
    // No Content-Type should be set for multipart uploads (browser sets it with boundary)
    expect(headers?.["Content-Type"]).toBeUndefined();
  });
});
