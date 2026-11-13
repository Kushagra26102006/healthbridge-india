import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/providers';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'HealthBridge India — One Nation One Health Record | ABHA Integrated Platform',
  description:
    'Empowering 1.4 billion Indians with secure, patient-controlled health records. Connect with hospitals, clinics, doctors, and diagnostic labs under the Ayushman Bharat Digital Mission (ABDM).',
  keywords: [
    'HealthBridge India',
    'One Nation One Health Record',
    'ABHA',
    'ABDM',
    'Ayushman Bharat Digital Mission',
    'Electronic Health Records',
    'EHR India',
    'Patient Health Locker',
    'Consent-Based Health Exchange',
    'National Health Authority',
  ],
  authors: [{ name: 'HealthBridge India Digital Architecture Team' }],
  creator: 'HealthBridge India',
  publisher: 'HealthBridge India Platform',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://healthbridge.gov.in',
    title: 'HealthBridge India — One Nation One Health Record',
    description:
      'Connect your health records across hospitals, doctors, and diagnostic labs with seamless ABHA integration and consent-driven security.',
    siteName: 'HealthBridge India',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealthBridge India — One Nation One Health Record',
    description:
      'Unified, consent-driven healthcare platform with ABHA identity integration for 1.4B Indian citizens.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('healthbridge-theme');
                  var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-teal-600 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
