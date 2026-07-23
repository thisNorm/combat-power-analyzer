'use client';

import { ApolloProvider } from '@apollo/client';
import { client } from '../lib/apollo-client';

// Next.js App Router 환경에서 Apollo Provider를 안전하게 감싸기 위한 클라이언트 컴포넌트입니다.
export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}