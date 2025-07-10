'use client';

import { Copy, Star, X, LogOut, TrendingUp, XCircle, Check, Settings, Eye, EyeOff, Plus, Minus, DollarSign } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useReadContracts, useBalance } from 'wagmi';
import { formatUnits, zeroAddress } from 'viem';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi } from 'viem';
import Spinner from '../ui/Spinner';
import TokenLogo from '../ui/TokenLogo';
import { CONTRACT_ADDRESSES, SUPPORTED_NETWORKS } from '@/constants';
import { useWeb3 } from '@/lib/Web3Provider';

interface WalletSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TokenBalance {
    symbol: string;
    balance: string;
    address: string;
    balanceNumber: number;
    priceUSD?: number;
}

interface TokenPrice {
    [symbol: string]: number;
}

const SUPPORTED_CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
];

const WalletSidebar = ({ isOpen, onClose }: WalletSidebarProps) => {
    const { address, userProfile, disconnectWallet, isAuthenticating, chainId } = useWeb3();
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? 84532];
    const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === chainId) ?? SUPPORTED_NETWORKS[0];
    const nativeToken = currentNetwork.nativeCurrency;
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [isCopied, setIsCopied] = useState(false);
    const [showTokenSelector, setShowTokenSelector] = useState(false);
    const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
    const [showZeroBalances, setShowZeroBalances] = useState(false);
    const [showPrices, setShowPrices] = useState(true);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [tokenPrices, setTokenPrices] = useState<TokenPrice>({});
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);

    // 1. Fetch native ETH balance using wagmi's dedicated hook
    const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({ 
        address,
        query: { enabled: isOpen && !!address && !isAuthenticating } 
    });

    // 2. Fetch the list of approved ERC20 token addresses from your contract
    const { data: approvedTokenData, isLoading: isLoadingAddresses } = useReadContracts({
        contracts: [{ ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' }],
        query: { enabled: isOpen && !!address && !isAuthenticating }
    });
    
    // 3. Prepare a dynamic list of contract calls to get details for each ERC20 token
    const erc20TokenAddresses = useMemo(() => 
        (approvedTokenData?.[0]?.result as `0x${string}`[] || []).filter(addr => addr !== zeroAddress),
        [approvedTokenData]
    );

    const erc20Contracts = useMemo(() =>
        erc20TokenAddresses.flatMap(addr => ([
            { address: addr, abi: erc20Abi, functionName: 'balanceOf', args: [address!] },
            { address: addr, abi: erc20Abi, functionName: 'symbol' },
            { address: addr, abi: erc20Abi, functionName: 'decimals' },
        ])),
        [erc20TokenAddresses, address]
    );

    // 4. Fetch all ERC20 details in a single, efficient batch request
    const { data: erc20Results, isLoading: isLoadingErc20 } = useReadContracts({
        contracts: erc20Contracts,
        query: { enabled: erc20Contracts.length > 0 },
    });

    // 5. Process all results into the final balances state
    useEffect(() => {
        const allBalances: TokenBalance[] = [];
        if (nativeBalance) {
            const balanceNumber = parseFloat(nativeBalance.formatted);
            allBalances.push({
                symbol: nativeBalance.symbol,
                balance: balanceNumber.toFixed(4),
                address: zeroAddress,
                balanceNumber
            });
        }

        if (erc20Results) {
            for (let i = 0; i < erc20Results.length; i += 3) {
                const balanceResult = erc20Results[i];
                const symbolResult = erc20Results[i + 1];
                const decimalsResult = erc20Results[i + 2];

                if (balanceResult.status === 'success' && symbolResult.status === 'success' && decimalsResult.status === 'success') {
                    const balanceNumber = parseFloat(formatUnits(balanceResult.result as bigint, decimalsResult.result as number));
                    allBalances.push({
                        symbol: symbolResult.result as string,
                        balance: balanceNumber.toFixed(4),
                        address: erc20Contracts[i].address,
                        balanceNumber
                    });
                }
            }
        }
        setBalances(allBalances);
    }, [nativeBalance, erc20Results, erc20Contracts]);

    // Fetch token prices
    useEffect(() => {
        const fetchTokenPrices = async () => {
            if (balances.length === 0) return;
            
            setIsLoadingPrices(true);
            const prices: TokenPrice = {};
            
            try {
                const uniqueSymbols = [...new Set(balances.map(token => token.symbol))];
                
                for (const symbol of uniqueSymbols) {
                    try {
                        const response = await fetch(`/api/getTokenPrice?symbol=${symbol}&currency=${selectedCurrency.toLowerCase()}`);
                        if (response.ok) {
                            const data = await response.json();
                            prices[symbol] = data.price;
                        }
                    } catch (error) {
                        console.error(`Failed to fetch price for ${symbol}:`, error);
                    }
                }
                
                setTokenPrices(prices);
            } catch (error) {
                console.error('Failed to fetch token prices:', error);
            } finally {
                setIsLoadingPrices(false);
            }
        };

        fetchTokenPrices();
    }, [balances, selectedCurrency]);

    // Filter balances based on user preferences
    const filteredBalances = useMemo(() => {
        let filtered = balances;
        
        // Filter by balance amount - this is the fix for hide/unhide
        if (!showZeroBalances) {
            filtered = filtered.filter(token => token.balanceNumber > 0);
        }
        
        // Filter by selected tokens
        if (selectedTokens.size > 0) {
            filtered = filtered.filter(token => selectedTokens.has(token.address));
        }
        
        return filtered;
    }, [balances, showZeroBalances, selectedTokens]);

    // Initialize selected tokens when balances change
    useEffect(() => {
        if (balances.length > 0 && selectedTokens.size === 0) {
            const tokensWithBalance = balances
                .filter(token => token.balanceNumber > 0)
                .map(token => token.address);
            setSelectedTokens(new Set(tokensWithBalance));
        }
    }, [balances, selectedTokens.size]);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        onClose();
    };

    const toggleTokenSelection = (tokenAddress: string) => {
        const newSelected = new Set(selectedTokens);
        if (newSelected.has(tokenAddress)) {
            newSelected.delete(tokenAddress);
        } else {
            newSelected.add(tokenAddress);
        }
        setSelectedTokens(newSelected);
    };

    const selectAllTokens = () => {
        setSelectedTokens(new Set(balances.map(token => token.address)));
    };

    const deselectAllTokens = () => {
        setSelectedTokens(new Set());
    };

    // Calculate total portfolio value in selected currency
    const totalPortfolioValue = useMemo(() => {
        return filteredBalances.reduce((sum, token) => {
            const price = tokenPrices[token.symbol] || 0;
            return sum + (token.balanceNumber * price);
        }, 0);
    }, [filteredBalances, tokenPrices]);

    const formatCurrency = (value: number, currency: string) => {
        const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
        const symbol = currencyInfo?.symbol || '$';
        
        if (currency === 'JPY') {
            return `${symbol}${Math.round(value).toLocaleString()}`;
        }
        
        return `${symbol}${value.toFixed(2)}`;
    };
    
    const tradeCount = userProfile?.tradeCount || 0;
    const cancellationCount = userProfile?.cancellationCount || 0;
    const averageRating = userProfile?.averageRating || 0;
    const ratingCount = userProfile?.ratingCount || 0;
    const cancellationRate = tradeCount > 0 ? (cancellationCount / tradeCount) * 100 : 0;
    const isLoading = isLoadingNative || isLoadingAddresses || isLoadingErc20;

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-40 transition-opacity ease-in-out duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl z-50 transform transition-transform ease-in-out duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 sm:p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                            My Wallet
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-slate-700/50 hover:text-white transition-colors">
                            <X size={20}/>
                        </button>
                    </div>

                    {/* Address Section */}
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs sm:text-sm text-gray-300">{address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}</span>
                            <button onClick={handleCopy} className="text-gray-400 hover:text-emerald-400 transition-colors">
                                {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Portfolio Section */}
                    <div className="mt-4 sm:mt-6 flex-1">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-300 uppercase tracking-wider">Portfolio</h3>
                            <div className="flex gap-1 sm:gap-2">
                                <button 
                                    onClick={() => setShowTokenSelector(!showTokenSelector)}
                                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
                                    title="Token Settings"
                                >
                                    <Settings size={16} />
                                </button>
                                <button 
                                    onClick={() => setShowPrices(!showPrices)}
                                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${showPrices ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white'}`}
                                    title={showPrices ? "Hide Prices" : "Show Prices"}
                                >
                                    {showPrices ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Token Selector */}
                        {showTokenSelector && (
                            <div className="mb-4 p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-600/30">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs sm:text-sm font-medium text-gray-300">Select Tokens</span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={selectAllTokens}
                                            className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                        >
                                            All
                                        </button>
                                        <button 
                                            onClick={deselectAllTokens}
                                            className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                        >
                                            None
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                                    {balances.map(token => (
                                        <div key={token.address} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <TokenLogo symbol={token.symbol} address={token.address} className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" size={24} />
                                                <span className="text-xs sm:text-sm font-medium text-gray-300">{token.symbol}</span>
                                            </div>
                                            <button 
                                                onClick={() => toggleTokenSelection(token.address)}
                                                className={`p-1 rounded ${selectedTokens.has(token.address) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-gray-400'}`}
                                            >
                                                {selectedTokens.has(token.address) ? <Check size={12} /> : <Plus size={12} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Portfolio Summary */}
                        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs sm:text-sm text-gray-400">Total Value</span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <DollarSign size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                                    <select 
                                        value={selectedCurrency}
                                        onChange={(e) => setSelectedCurrency(e.target.value)}
                                        className="bg-slate-800/50 border border-slate-600/30 rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                    >
                                        {SUPPORTED_CURRENCIES.map(currency => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg sm:text-2xl font-bold text-white">
                                    {isLoadingPrices ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Loading...
                                        </div>
                                    ) : showPrices ? (
                                        formatCurrency(totalPortfolioValue, selectedCurrency)
                                    ) : (
                                        "******"
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {filteredBalances.length} token{filteredBalances.length !== 1 ? 's' : ''} • {showZeroBalances ? 'All tokens' : 'With balance'}
                                </div>
                            </div>
                        </div>

                        {/* Token Balances */}
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Spinner text="Loading balances..." />
                                </div>
                            ) : filteredBalances.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    {showZeroBalances ? "No tokens available" : "No tokens with balance"}
                                </div>
                            ) : (
                                filteredBalances.map(token => {
                                    const tokenValue = (tokenPrices[token.symbol] || 0) * token.balanceNumber;
                                    return (
                                        <div key={token.address} className="group flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 hover:border-emerald-500/30 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="relative">
                                                    <TokenLogo symbol={token.symbol} address={token.address} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-700 ring-2 ring-slate-600 group-hover:ring-emerald-500/50 transition-all" size={40} />
                                                    {token.balanceNumber > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm sm:text-base">{token.symbol}</div>
                                                    <div className="text-xs text-gray-400">Token</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-white text-sm sm:text-lg">
                                                    {showPrices ? (parseFloat(token.balance) > 0 ? token.balance : '0.0000') : '******'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {showPrices ? (tokenValue > 0 ? formatCurrency(tokenValue, selectedCurrency) : 'No price data') : '******'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    
                    {/* Reputation Section */}
                    <div className="mt-4 sm:mt-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-300 uppercase tracking-wider mb-3">Reputation</h3>
                        <div className="space-y-3 p-3 sm:p-4 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-xl border border-slate-600/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                        <Star size={14} className="text-yellow-400 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="text-slate-300">Rating</span>
                                </div>
                                <span className="font-bold text-white">{averageRating.toFixed(1)} ({ratingCount})</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <TrendingUp size={14} className="text-green-400 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="text-slate-300">Trades</span>
                                </div>
                                <span className="font-bold text-white">{tradeCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                        <XCircle size={14} className="text-red-400 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="text-slate-300">Cancel Rate</span>
                                </div>
                                <span className="font-bold text-white">{cancellationRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Disconnect Button */}
                    <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-700/50">
                        <button onClick={handleDisconnect} className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-semibold bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 rounded-xl hover:from-red-500/20 hover:to-red-600/20 transition-all duration-300 border border-red-500/20 hover:border-red-500/40">
                           <LogOut size={16}/> Disconnect
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WalletSidebar;