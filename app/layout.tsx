// p2p-nextjs-frontend/app/layout.tsx

import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Providers } from '@/lib/Providers'; // Import the new Providers
import ClientOnly from '@/components/ui/ClientOnly';

export const metadata: Metadata = {
  title: 'Rampz: P2P DEX',
  description: 'A decentralized peer-to-peer on/off ramp',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} bg-slate-900`}>
      <ClientOnly>
          <Providers>{children}</Providers>
      </ClientOnly>
      </body>
    </html>
  );
}