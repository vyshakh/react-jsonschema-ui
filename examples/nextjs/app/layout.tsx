import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './Providers';

export const metadata: Metadata = {
  title: 'react-jsonschema-ui · Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
