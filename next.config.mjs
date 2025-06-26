/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@walletconnect/ethereum-provider'],
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
      // --- THIS IS THE CHANGE ---
      // Add the hostname for the flag CDN
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;