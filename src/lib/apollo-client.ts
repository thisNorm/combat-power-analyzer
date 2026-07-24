import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// 'uri' 단축 속성 대신 HttpLink 객체를 명시적으로 생성하여 주입합니다. (타입 에러 완벽 해결)
export const client = new ApolloClient({
  link: new HttpLink({
    uri: '/api/graphql', // 백엔드 게이트웨이 주소
  }),
  cache: new InMemoryCache(),
});