import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HVDC Control Tower',
  description: 'HVDC Logistics Dashboard Replica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
