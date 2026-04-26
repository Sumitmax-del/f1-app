/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow connecting to backend on different port
  async rewrites() {
    return [
      // Optionally proxy API calls through Next.js
      // {
      //   source: '/api/:path*',
      //   destination: 'http://localhost:4000/api/:path*',
      // },
    ];
  },
};

module.exports = nextConfig;
