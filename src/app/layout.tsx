import type { Metadata } from 'next';
import "./globals.css";
import ApolloWrapper from '../components/ApolloWrapper';

export const metadata: Metadata = {
  title: '개발 전투력 측정기',
  description: 'AI가 당신으 ㅣ깃허브 코드를 분석해 팩폭을 날려드립니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-900 text-white min-h-screen">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}