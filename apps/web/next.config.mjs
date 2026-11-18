/** @type {import('next').NextConfig} */
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1').origin;
  } catch {
    return 'http://localhost:5001';
  }
})();

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src 'self' ${apiOrigin}`,
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@healthbridge/shared-types', '@healthbridge/validation', '@healthbridge/config'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    // Enable any Turbopack features if needed
  },
};

export default nextConfig;

