import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence workspace root inference warning for Turbopack
  turbopack: {
    root: __dirname,
  },
  // Do not fail production builds on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
