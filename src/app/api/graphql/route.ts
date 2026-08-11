import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import type { NextRequest } from "next/server";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolvers";
import { singleAnalysisFieldRule } from "../../../graphql/validation";

export const MAX_GRAPHQL_GET_URL_LENGTH = 8_192;
export const MAX_GRAPHQL_POST_BODY_BYTES = 64 * 1024;

function requestTooLargeResponse(message: string): Response {
  return Response.json(
    { error: message },
    {
      status: 413,
      headers: { "cache-control": "no-store" },
    },
  );
}

function methodNotAllowedResponse(): Response {
  return Response.json(
    { error: "Method Not Allowed" },
    {
      status: 405,
      headers: {
        allow: "GET, POST",
        "cache-control": "no-store",
      },
    },
  );
}

/**
 * Applies the public transport limits before Apollo parses or executes a
 * request. Cloning the body keeps the original stream available to Apollo.
 */
export async function enforceGraphqlTransportLimits(request: NextRequest): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "POST") {
    return methodNotAllowedResponse();
  }

  if (request.method === "GET" && request.url.length > MAX_GRAPHQL_GET_URL_LENGTH) {
    return requestTooLargeResponse(
      `GraphQL request URL exceeds the ${MAX_GRAPHQL_GET_URL_LENGTH} character limit.`,
    );
  }

  if (request.method !== "POST") return null;

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_GRAPHQL_POST_BODY_BYTES) {
      return requestTooLargeResponse(
        `GraphQL request body exceeds the ${MAX_GRAPHQL_POST_BODY_BYTES} byte limit.`,
      );
    }
  }

  const body = request.clone().body;
  if (!body) return null;

  const reader = body.getReader();
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_GRAPHQL_POST_BODY_BYTES) {
        return requestTooLargeResponse(
          `GraphQL request body exceeds the ${MAX_GRAPHQL_POST_BODY_BYTES} byte limit.`,
        );
      }
    }
  } finally {
    // The cloned branch is only a bounded inspection stream. Releasing the
    // lock avoids waiting on the original request's tee branch when a body is
    // rejected before Apollo consumes it.
    reader.releaseLock();
  }

  return null;
}

// 1. Apollo Server 인스턴스 생성 (우리가 만든 스키마와 리졸버 결합)
const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [singleAnalysisFieldRule],
});

// 2. Next.js API Router 규격에 맞게 핸들러 생성
const handler = startServerAndCreateNextHandler<NextRequest>(server);

export async function GET(request: NextRequest): Promise<Response> {
  const rejection = await enforceGraphqlTransportLimits(request);
  if (rejection) return rejection;
  return handler(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  const rejection = await enforceGraphqlTransportLimits(request);
  if (rejection) return rejection;
  return handler(request);
}
