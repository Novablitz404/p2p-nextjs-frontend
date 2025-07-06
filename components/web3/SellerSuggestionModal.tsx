'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { TradePlan, MatchedOrder, UserProfile } from '@/types/index';
import { Star, TrendingUp, Shield, Clock, Check, X } from 'lucide-react';
import Spinner from '../ui/Spinner';
import Tooltip from '../ui/Tooltip';

interface SellerSuggestion {
    sellerId: string;
    sellerProfile: UserProfile;
    matchedOrders: MatchedOrder[];
    totalAmount: number;
    totalFiatCost: number;
    averageMarkup: number;
    rating: number;
    tradeCount: number;
    cancellationRate: number;
    averageReleaseTime: number;
}

interface SellerSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedSeller: SellerSuggestion) => void;
    tradePlan: TradePlan | null;
    sellerProfiles: { [key: string]: UserProfile };
}

const SellerSuggestionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    tradePlan, 
    sellerProfiles 
}: SellerSuggestionModalProps) => {
    const [selectedSeller, setSelectedSeller] = useState<SellerSuggestion | null>(null);
    const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    // Group matches by seller and create seller suggestions
    const sellerSuggestions = useMemo(() => {
        if (!tradePlan) return [];

        const sellerGroups: { [key: string]: MatchedOrder[] } = {};
        
        // Group matches by seller
        tradePlan.matches.forEach(match => {
            if (!sellerGroups[match.seller]) {
                sellerGroups[match.seller] = [];
            }
            sellerGroups[match.seller].push(match);
        });

        // Create seller suggestions with rankings
        const suggestions: SellerSuggestion[] = Object.entries(sellerGroups).map(([sellerId, matches]) => {
            const profile = sellerProfiles[sellerId] || {
                averageRating: 3,
                ratingCount: 0,
                tradeCount: 0,
                cancellationCount: 0
            };

            const totalAmount = matches.reduce((sum, match) => sum + match.amountToTake, 0);
            const totalFiatCost = matches.reduce((sum, match) => sum + (match.fiatCost || 0), 0);
            const averageMarkup = matches.reduce((sum, match) => sum + match.markupPercentage, 0) / matches.length;
            const tradeCount = profile.tradeCount || 0;
            const cancellationCount = profile.cancellationCount || 0;
            const cancellationRate = tradeCount > 0 ? (cancellationCount / tradeCount) * 100 : 0;
            const averageReleaseTime = profile.averageReleaseTime || 0;

            return {
                sellerId,
                sellerProfile: profile,
                matchedOrders: matches,
                totalAmount,
                totalFiatCost,
                averageMarkup,
                rating: profile.averageRating,
                tradeCount,
                cancellationRate,
                averageReleaseTime,
            };
        });

        // Check if any single seller can fulfill the complete request
        const buyerRequestedAmount = tradePlan.totalCrypto;
        const completeSellers = suggestions.filter(seller => {
            // Use a more flexible tolerance based on the token decimals
            const tolerance = Math.pow(10, -6); // 0.000001 tolerance
            const sellerCanFulfill = Math.abs(seller.totalAmount - buyerRequestedAmount) < tolerance;
            return sellerCanFulfill;
        });

        // If we have complete sellers, use them (existing behavior)
        if (completeSellers.length > 0) {
            console.log('Seller Suggestions Debug - Complete Sellers:', {
                buyerRequested: tradePlan.totalCrypto,
                totalSellers: suggestions.length,
                completeSellers: completeSellers.length,
                sellers: completeSellers.map(s => ({
                    sellerId: s.sellerId,
                    totalAmount: s.totalAmount,
                    canFulfill: Math.abs(s.totalAmount - tradePlan.totalCrypto) < Math.pow(10, -6)
                }))
            });

            // Sort by rating, trade count, and cancellation rate
            return completeSellers.sort((a, b) => {
                // Primary: Rating (higher is better)
                if (a.rating !== b.rating) return b.rating - a.rating;
                
                // Secondary: Trade count (higher is better)
                if (a.tradeCount !== b.tradeCount) return b.tradeCount - a.tradeCount;
                
                // Tertiary: Cancellation rate (lower is better)
                if (a.cancellationRate !== b.cancellationRate) return a.cancellationRate - b.cancellationRate;
                
                // Quaternary: Release time (lower is better)
                return a.averageReleaseTime - b.averageReleaseTime;
            }).slice(0, 3); // Take top 3
        }

        // NEW: If no single seller can fulfill, create bundled seller suggestions
        console.log('Seller Suggestions Debug - Bundled Sellers:', {
            buyerRequested: tradePlan.totalCrypto,
            totalSellers: suggestions.length,
            totalAmountAvailable: suggestions.reduce((sum, s) => sum + s.totalAmount, 0)
        });

        // Create a bundled seller that represents the combination of all sellers
        // Use the exact amount from the trade plan to avoid floating-point errors
        const totalBundledAmount = tradePlan.totalCrypto; // Use the exact requested amount
        const totalBundledFiatCost = suggestions.reduce((sum, seller) => {
            return sum + seller.totalFiatCost;
        }, 0);
        const averageBundledMarkup = suggestions.reduce((sum, seller) => sum + seller.averageMarkup, 0) / suggestions.length;
        
        // Calculate weighted average rating and other metrics
        const totalTradeCount = suggestions.reduce((sum, seller) => sum + seller.tradeCount, 0);
        const totalCancellationCount = suggestions.reduce((sum, seller) => sum + (seller.cancellationRate * seller.tradeCount / 100), 0);
        const averageRating = suggestions.reduce((sum, seller) => sum + seller.rating, 0) / suggestions.length;
        const averageCancellationRate = totalTradeCount > 0 ? (totalCancellationCount / totalTradeCount) * 100 : 0;
        const averageReleaseTime = suggestions.reduce((sum, seller) => sum + seller.averageReleaseTime, 0) / suggestions.length;

        // Create a bundled seller suggestion
        const bundledSeller: SellerSuggestion = {
            sellerId: 'BUNDLED_SELLERS',
            sellerProfile: {
                averageRating,
                ratingCount: totalTradeCount,
                tradeCount: totalTradeCount,
                cancellationCount: totalCancellationCount,
                averageReleaseTime
            },
            matchedOrders: tradePlan.matches, // All matched orders from all sellers
            totalAmount: totalBundledAmount,
            totalFiatCost: totalBundledFiatCost,
            averageMarkup: averageBundledMarkup,
            rating: averageRating,
            tradeCount: totalTradeCount,
            cancellationRate: averageCancellationRate,
            averageReleaseTime,
        };

        return [bundledSeller];
    }, [tradePlan, sellerProfiles]);

    // Fetch live market price
    useEffect(() => {
        if (!isOpen || !tradePlan || tradePlan.matches.length === 0) {
            return;
        }

        const { tokenSymbol, fiatCurrency } = tradePlan.matches[0];

        const fetchPrice = async () => {
            setIsPriceLoading(true);
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=${tokenSymbol}&currency=${fiatCurrency}`);
                const data = await response.json();
                setLiveMarketPrice(data.price);
            } catch (error) {
                console.error("Failed to fetch live price:", error);
                setLiveMarketPrice(null);
            } finally {
                setIsPriceLoading(false);
            }
        };
        
        fetchPrice();
        const intervalId = setInterval(fetchPrice, 60000);
        return () => clearInterval(intervalId);
    }, [isOpen, tradePlan]);

    // Calculate live prices for selected seller
    const selectedSellerWithLivePrices = useMemo(() => {
        if (!selectedSeller || !liveMarketPrice) return selectedSeller;

        const updatedOrders = selectedSeller.matchedOrders.map(match => {
            const finalRate = liveMarketPrice * (1 + match.markupPercentage / 100);
            const fiatCost = match.amountToTake * finalRate;
            return { ...match, price: finalRate, fiatCost };
        });

        const totalFiatCost = updatedOrders.reduce((sum, match) => sum + match.fiatCost, 0);

        return {
            ...selectedSeller,
            matchedOrders: updatedOrders,
            totalFiatCost
        };
    }, [selectedSeller, liveMarketPrice]);

    const handleSellerSelect = (seller: SellerSuggestion) => {
        setSelectedSeller(seller);
    };

    const handleConfirm = () => {
        if (selectedSellerWithLivePrices) {
            onConfirm(selectedSellerWithLivePrices);
        }
    };

    const formatCurrency = (value: number) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '...';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: tradePlan?.matches[0]?.fiatCurrency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getRankingBadge = (index: number) => {
        const badges = [
            { bg: 'bg-yellow-500', text: 'text-yellow-900', icon: '🥇' },
            { bg: 'bg-gray-400', text: 'text-gray-900', icon: '🥈' },
            { bg: 'bg-orange-500', text: 'text-orange-900', icon: '🥉' }
        ];
        return badges[index] || { bg: 'bg-slate-500', text: 'text-slate-900', icon: '#' };
    };

    if (!tradePlan) return null;

    const { tokenSymbol, fiatCurrency } = tradePlan.matches[0];

    const isBundledMode = sellerSuggestions.length === 1 && sellerSuggestions[0]?.sellerId === 'BUNDLED_SELLERS';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isBundledMode ? "Choose Your Seller Bundle" : "Choose Your Seller"}>
            <div className="text-center mb-6">
                <p className="text-gray-300 mb-2">You want to buy</p>
                <p className="text-3xl font-bold text-white mb-2">{(tradePlan.totalCrypto || 0)} {tokenSymbol}</p>
                <p className="text-sm text-gray-400">
                    {isBundledMode 
                        ? "Your request will be fulfilled by combining multiple sellers"
                        : "Select your preferred seller from our top recommendations"
                    }
                </p>
            </div>

            {/* Seller Suggestions */}
            <div className="space-y-4 mb-6">
                {sellerSuggestions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                        <p className="text-gray-400 mb-2">No sellers found that can fulfill your request</p>
                        <p className="text-sm text-gray-500">Try reducing your amount or check back later for more liquidity</p>
                    </div>
                ) : (
                    sellerSuggestions.map((seller, index) => {
                        const badge = getRankingBadge(index);
                        const isSelected = selectedSeller?.sellerId === seller.sellerId;
                        const isBundledSeller = seller.sellerId === 'BUNDLED_SELLERS';
                        
                        return (
                            <div
                                key={seller.sellerId}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                    isSelected 
                                        ? 'border-emerald-500 bg-emerald-500/10' 
                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                }`}
                                onClick={() => handleSellerSelect(seller)}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    {/* Left: Badge + Seller Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Ranking Badge */}
                                        <div className={`w-8 h-8 ${badge.bg} rounded-full flex items-center justify-center text-sm font-bold ${badge.text}`}>
                                            {isBundledSeller ? '🔗' : badge.icon}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 mb-1 min-w-0">
                                                <span className="font-semibold text-white truncate">
                                                    {isBundledSeller 
                                                        ? 'Multiple Sellers (Bundled)'
                                                        : `${seller.sellerId.substring(0, 6)}...${seller.sellerId.substring(seller.sellerId.length - 4)}`
                                                    }
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-sm text-white">{(seller.rating || 0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            {/* Metrics Row: Flex, not grid */}
                                            <div className="flex flex-row gap-6 text-sm mt-1">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-gray-300 whitespace-nowrap">{seller.tradeCount || 0} trades</span>
                                                </div>
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Shield className="w-4 h-4 text-blue-400" />
                                                    <span className="text-gray-300 whitespace-nowrap">{(seller.cancellationRate || 0).toFixed(1)}% cancel</span>
                                                </div>
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Clock className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-gray-300 whitespace-nowrap">
                                                        {seller.averageReleaseTime
                                                            ? `${Math.floor(seller.averageReleaseTime / 60)}m ${seller.averageReleaseTime % 60}s avg. release`
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Show bundled seller info */}
                                            {isBundledSeller && (
                                                <div className="mt-2 p-2 bg-slate-800/50 rounded-lg border border-slate-600">
                                                    <p className="text-xs text-emerald-400 font-medium mb-1">🔗 Bundled from multiple sellers</p>
                                                    <p className="text-xs text-gray-400">
                                                        Your request will be fulfilled by combining orders from {seller.matchedOrders.length} different sellers
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Right: Selection Indicator */}
                                    {isSelected && (
                                        <div className="flex items-center justify-center ml-2">
                                            <Check className="w-6 h-6 text-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Selected Seller Details */}
            {selectedSellerWithLivePrices && (
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Trade Summary</h4>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-gray-300">
                            <span>Total Amount</span>
                            <span className="font-semibold text-white">
                                {(selectedSellerWithLivePrices.totalAmount || 0).toFixed(6)} {tokenSymbol}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-gray-300">
                            <div className="flex items-center gap-1.5">
                                <span>Estimated Cost</span>
                                <Tooltip text="Final price will be locked when you confirm">
                                    <Clock className="h-4 w-4 text-gray-500 cursor-help" />
                                </Tooltip>
                            </div>
                            <span className="font-semibold text-white h-6 flex items-center">
                                {isPriceLoading ? <Spinner /> : `~ ${formatCurrency(selectedSellerWithLivePrices.totalFiatCost || 0)}`}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-gray-300">
                            <span>Average Markup</span>
                            <span className="font-semibold text-white">
                                +{(selectedSellerWithLivePrices.averageMarkup || 0).toFixed(2)}%
                            </span>
                        </div>

                        {/* Show bundled seller details */}
                        {selectedSellerWithLivePrices.sellerId === 'BUNDLED_SELLERS' && (
                            <>
                                <div className="border-t border-slate-700 pt-3 mt-3">
                                    <div className="flex justify-between items-center text-gray-300 mb-2">
                                        <span>Number of Sellers</span>
                                        <span className="font-semibold text-white">
                                            {selectedSellerWithLivePrices.matchedOrders.length}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Your order will be split across multiple sellers to fulfill your complete request
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
                <button 
                    onClick={onClose} 
                    className="px-6 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleConfirm} 
                    disabled={!selectedSeller || isPriceLoading || !liveMarketPrice || sellerSuggestions.length === 0}
                    className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sellerSuggestions.length === 0 
                        ? 'No Sellers Available' 
                        : selectedSeller 
                            ? (selectedSeller.sellerId === 'BUNDLED_SELLERS' ? 'Confirm Bundle & Lock Price' : 'Confirm & Lock Price')
                            : 'Select a Seller'
                    }
                </button>
            </div>
        </Modal>
    );
};

export default SellerSuggestionModal; 