import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Math Sprint V4',
  description: 'A polished daily math practice site for Grade 4 and Grade 7 learners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
