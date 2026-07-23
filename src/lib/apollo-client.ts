import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
    uri: '/api/graphql', // 우리가 Commit 4에서 열어둔 백엔드 단일 통로
    cache: new InMemoryCache(),
});