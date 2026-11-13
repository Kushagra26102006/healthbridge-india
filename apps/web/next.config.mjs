/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@healthbridge/shared-types', '@healthbridge/validation', '@healthbridge/config'],
  experimental: {
    // Enable any Turbopack features if needed
  },
};

export default nextConfig;

