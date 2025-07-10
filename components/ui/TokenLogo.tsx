import React from 'react';

interface TokenLogoProps {
  symbol: string;
  address?: string;
  className?: string;
  size?: number;
}

const symbolToSrc: Record<string, string> = {
  ETH: '/eth.svg',
  USDC: '/usdc.svg',
  IDRX: '/idrx.svg',
  CORE: '/core.svg',
  tCORE: '/core.svg',
};

export const TokenLogo: React.FC<TokenLogoProps> = ({ symbol, address, className = '', size = 32 }) => {
  let src = symbolToSrc[symbol];
  if (!src && address) {
    src = `https://effigy.im/a/${address}.svg`;
  } else if (!src) {
    // fallback: generic token icon or blank
    src = '/file.svg';
  }
  return (
    <img
      src={src}
      alt={`${symbol} logo`}
      className={className}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
};

export default TokenLogo; 