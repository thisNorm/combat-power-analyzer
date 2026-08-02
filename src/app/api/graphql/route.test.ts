import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import {
  enforceGraphqlTransportLimits,
  MAX_GRAPHQL_GET_URL_LENGTH,
  MAX_GRAPHQL_POST_BODY_BYTES,
} from "./route";

function makeRequest(input: string, init?: RequestInit): NextRequest {
  return new Request(input, init) as unknown as NextRequest;
}

describe("GraphQL transport limits", () => {
  it("rejects an oversized GET URL before Apollo", async () => {
    const request = makeRequest(
      `https://example.test/api/graphql?query=${"x".repeat(MAX_GRAPHQL_GET_URL_LENGTH)}`,
    );

    const response = await enforceGraphqlTransportLimits(request);

    expect(response?.status).toBe(413);
    await expect(response?.json()).resolves.toEqual({
      error: `GraphQL request URL exceeds the ${MAX_GRAPHQL_GET_URL_LENGTH} character limit.`,
    });
  });

  it("rejects an oversized POST from Content-Length without reading the body", async () => {
    const request = makeRequest("https://example.test/api/graphql", {
      method: "POST",
      headers: { "content-length": String(MAX_GRAPHQL_POST_BODY_BYTES + 1) },
      body: "{}",
    });

    const response = await enforceGraphqlTransportLimits(request);

    expect(response?.status).toBe(413);
    await expect(response?.json()).resolves.toEqual({
      error: `GraphQL request body exceeds the ${MAX_GRAPHQL_POST_BODY_BYTES} byte limit.`,
    });
  });

  it("rejects a chunked POST after the body crosses the byte limit", async () => {
    const request = makeRequest("https://example.test/api/graphql", {
      method: "POST",
      body: "x".repeat(MAX_GRAPHQL_POST_BODY_BYTES + 1),
    });

    const response = await enforceGraphqlTransportLimits(request);

    expect(response?.status).toBe(413);
  });

  it("allows requests under the limits and returns no rejection", async () => {
    const getRequest = makeRequest("https://example.test/api/graphql?query=query%20Health%20%7B%20__typename%20%7D");
    const postRequest = makeRequest("https://example.test/api/graphql", {
      method: "POST",
      body: JSON.stringify({ query: "query Health { __typename }" }),
    });

    await expect(enforceGraphqlTransportLimits(getRequest)).resolves.toBeNull();
    await expect(enforceGraphqlTransportLimits(postRequest)).resolves.toBeNull();
  });

  it("returns a clear 405 response for unsupported methods", async () => {
    const request = makeRequest("https://example.test/api/graphql", { method: "PUT" });

    const response = await enforceGraphqlTransportLimits(request);

    expect(response?.status).toBe(405);
    expect(response?.headers.get("allow")).toBe("GET, POST");
    await expect(response?.json()).resolves.toEqual({ error: "Method Not Allowed" });
  });
});
