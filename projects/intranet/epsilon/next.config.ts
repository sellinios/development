/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    // New recommended approach in Next 13+ instead of 'domains'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'epsilonhellas.com',
        port: '',          // optional, leave empty if none
        pathname: '/**'    // allow all paths
      },
      {
        protocol: 'https',
        hostname: 'site.epsilonhellas.com',
        port: '',
        pathname: '/**'
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*'
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  },
  experimental: {
    allowedDevOrigins: ['127.0.0.1', 'localhost']
  },
};

module.exports = nextConfig;