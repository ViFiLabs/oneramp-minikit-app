/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: only use this in development and remove it for production
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
