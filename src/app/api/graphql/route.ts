import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs } from "../../../graphql/schema";
import { resolvers } from "../../../graphql/resolvers";

// 1. Apollo Server 인스턴스 생성 (우리가 만든 스키마와 리졸버 결합)
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// 2. Next.js API Router 규격에 맞게 핸들러 생성
const handler = startServerAndCreateNextHandler<NextRequest>(server);

// 3. GET과 POST 요청 모두 이 핸들러가 처리하도록 개방
export { handler as GET, handler as POST };