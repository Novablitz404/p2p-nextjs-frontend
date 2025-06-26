/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is a more comprehensive list to ensure all dependencies are handled
  transpilePackages: [
    '@walletconnect/ethereum-provider',
    '@web3modal/standalone',
    'viem',
    '@wagmi/core',
    '@wagmi/connectors',
    '@tanstack/query-core',
    '@tanstack/react-query',
    '@coinbase/wallet-sdk',
    'eventemitter3'
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