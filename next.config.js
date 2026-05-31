/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 외부 이미지 URL을 폭넓게 허용 (Supabase Storage 등)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "*.vercel.app"] },
  },
};

module.exports = nextConfig;
