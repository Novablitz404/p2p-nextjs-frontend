/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'effigy.im',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  // Add this configuration to solve the build error
  transpilePackages: ['@coinbase/wallet-sdk'],
};

export default nextConfig;