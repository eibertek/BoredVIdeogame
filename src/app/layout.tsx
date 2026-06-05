import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BORED: The Video Game',
  description: 'Based on Viva La Dirt League\'s Bored web series',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a2e] text-white min-h-screen">{children}</body>
    </html>
  );
}
