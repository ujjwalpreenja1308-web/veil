import { describe, it, expect } from "vitest";
import { normalize, normalizeOtlp } from "@/lib/normalizer";

// ─── Veil-native normalize() ──────────────────────────────────────────────────

describe("normalize() — Veil-native", () => {
  it("normalizes a valid minimal payload", () => {
    const result = normalize({
      session_id: "sess-abc123",
      type: "llm.call",
    });
    expect(result.sessionId).toBe("sess-abc123");
    expect(result.type).toBe("llm.call");
    expect(result.step).toBe(0);
    expect(result.payload).toEqual({});
  });

  it("throws 422 if session_id is missing", () => {
    expect(() => normalize({ type: "llm.call" })).toThrow();
  });

  it("throws 422 if session_id contains invalid characters", () => {
    expect(() =>
      normalize({ session_id: "bad session!", type: "llm.call" })
    ).toThrow();
  });

  it("throws 422 if session_id exceeds 128 chars", () => {
    expect(() =>
      normalize({ session_id: "a".repeat(129), type: "llm.call" })
    ).toThrow();
  });

  it("throws 422 if type is missing", () => {
    expect(() => normalize({ session_id: "abc" })).toThrow();
  });

  it("throws 422 if payload exceeds 10KB", () => {
    expect(() =>
      normalize({
        session_id: "abc",
        type: "llm.call",
        payload: { big: "x".repeat(11_000) },
      })
    ).toThrow(/10KB/);
  });

  it("throws 422 if timestamp is invalid", () => {
    expect(() =>
      normalize({ session_id: "abc", type: "llm.call", timestamp: "not-a-date" })
    ).toThrow(/timestamp/i);
  });

  it("throws 422 if timestamp is more than 1 hour in the future", () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(() =>
      normalize({ session_id: "abc", type: "llm.call", timestamp: future })
    ).toThrow(/future/i);
  });

  it("applies aliases: input → gen_ai.prompt, output → gen_ai.completion", () => {
    const result = normalize({
      session_id: "abc",
      type: "llm.call",
      payload: { input: "hello", output: "world" },
    });
    expect(result.payload["gen_ai.prompt"]).toBe("hello");
    expect(result.payload["gen_ai.completion"]).toBe("world");
  });

  it("applies duration_ms → duration_ns alias", () => {
    const result = normalize({
      session_id: "abc",
      type: "llm.call",
      payload: { duration_ms: 500 },
    });
    expect(result.payload["duration_ns"]).toBe(500_000_000);
  });
});

// ─── normalizeOtlp() ──────────────────────────────────────────────────────────

describe("normalizeOtlp()", () => {
  it("returns empty array for empty resourceSpans", () => {
    expect(normalizeOtlp({ resourceSpans: [] })).toEqual([]);
  });

  it("returns empty array for missing resourceSpans", () => {
    expect(normalizeOtlp({})).toEqual([]);
  });

  it("normalizes a single span", () => {
    const result = normalizeOtlp({
      resourceSpans: [
        {
          resource: {
            attributes: [{ key: "service.name", value: { stringValue: "my-agent" } }],
          },
          scopeSpans: [
            {
              spans: [
                {
                  name: "llm.completion",
                  traceId: "trace-1",
                  startTimeUnixNano: "1000000000",
                  endTimeUnixNano: "2000000000",
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("llm.completion");
    expect(result[0].sessionId).toBe("my-agent");
    expect(result[0].payload.duration_ns).toBe(1_000_000_000);
  });

  it("clamps negative duration_ns to 0", () => {
    const result = normalizeOtlp({
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  name: "span",
                  traceId: "t1",
                  startTimeUnixNano: "2000000000",
                  endTimeUnixNano: "1000000000", // end before start
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result[0].payload.duration_ns).toBe(0);
  });

  it("throws 422 when span has no session identifier", () => {
    expect(() =>
      normalizeOtlp({
        resourceSpans: [
          {
            resource: { attributes: [] },
            scopeSpans: [
              {
                spans: [{ name: "span", attributes: [] }],
              },
            ],
          },
        ],
      })
    ).toThrow(/session identifier/i);
  });

  it("throws 422 for non-object payload", () => {
    expect(() => normalizeOtlp("not an object")).toThrow(/JSON object/i);
    expect(() => normalizeOtlp(null)).toThrow(/JSON object/i);
    expect(() => normalizeOtlp([1, 2])).toThrow(/JSON object/i);
  });

  it("throws 413 when payload exceeds 1MB", () => {
    const bigPayload = {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  name: "span",
                  traceId: "t1",
                  attributes: [{ key: "data", value: { stringValue: "x".repeat(1_100_000) } }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() => normalizeOtlp(bigPayload)).toThrow(/1MB/i);
  });

  it("surfaces error from span status code 2", () => {
    const result = normalizeOtlp({
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  name: "span",
                  traceId: "t1",
                  attributes: [],
                  status: { code: 2, message: "something failed" },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result[0].payload["gen_ai.error.message"]).toBe("something failed");
  });
});
