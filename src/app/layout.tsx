import type { Metadata } from 'next';
import "./globals.css";
import ApolloWrapper from '../components/ApolloWrapper';

export const metadata: Metadata = {
  title: 'Code Hunter | 개발 전투력 측정기',
  description: 'GitHub 공개 활동을 바탕으로 나만의 개발 전투력과 직업을 확인하세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
