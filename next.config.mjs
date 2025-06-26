/** @type {import('next').NextConfig} */
const nextConfig = {
  // Broader list to catch all related dependencies
  transpilePackages: [
    '@walletconnect/ethereum-provider',
    '@web3modal/standalone',
    'viem',
    '@wagmi/core',
    '@tanstack/query-core',
    '@tanstack/react-query',
  ],
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
};

export default nextConfig;