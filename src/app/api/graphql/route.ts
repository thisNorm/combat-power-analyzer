import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import type { NextRequest } from "next/server";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolvers";
import { singleAnalysisFieldRule } from "../../../graphql/validation";

// 1. Apollo Server 인스턴스 생성 (우리가 만든 스키마와 리졸버 결합)
const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [singleAnalysisFieldRule],
});

// 2. Next.js API Router 규격에 맞게 핸들러 생성
const handler = startServerAndCreateNextHandler<NextRequest>(server);

export async function GET(request: NextRequest): Promise<Response> {
  return handler(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handler(request);
}
