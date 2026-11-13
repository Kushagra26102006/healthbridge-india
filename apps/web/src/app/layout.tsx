import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers';

export const metadata: Metadata = {
  title: 'HealthBridge India — One Nation One Health Record',
  description:
    'ABHA-Integrated Unified Healthcare Platform connecting patients, hospitals, doctors, and diagnostic labs under Ayushman Bharat Digital Mission (ABDM).',
  keywords: ['ABHA', 'ABDM', 'HealthBridge', 'EHR', 'One Nation One Health Record', 'Healthcare India'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-teal-500 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

