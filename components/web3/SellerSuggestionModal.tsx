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
    console.log('SellerSuggestionModal render:', { isOpen, tradePlan, sellerProfiles });
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

    if (!tradePlan) return null;

    const { tokenSymbol, fiatCurrency } = tradePlan.matches[0];

    const isBundledMode = sellerSuggestions.length === 1 && sellerSuggestions[0]?.sellerId === 'BUNDLED_SELLERS';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isBundledMode ? "Choose Your Seller Bundle" : "Choose Your Seller"}>
            <div className="text-center mb-4">
                <p className="text-gray-300 mb-1">You want to buy</p>
                <p className="text-2xl font-bold text-white mb-1">{(tradePlan.totalCrypto || 0)} {tokenSymbol}</p>
                <p className="text-xs text-gray-400">
                    {isBundledMode 
                        ? "Your request will be fulfilled by combining multiple sellers"
                        : "Select your preferred seller from our top recommendations"
                    }
                </p>
            </div>

            {/* Seller Suggestions */}
            <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                {sellerSuggestions.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-lg">
                        <p className="text-gray-400 mb-1">No sellers found that can fulfill your request</p>
                        <p className="text-xs text-gray-500">Try reducing your amount or check back later for more liquidity</p>
                    </div>
                ) : (
                    sellerSuggestions.map((seller, index) => {
                        const isSelected = selectedSeller?.sellerId === seller.sellerId;
                        const isBundledSeller = seller.sellerId === 'BUNDLED_SELLERS';
                        return (
                            <div
                                key={seller.sellerId}
                                className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                    isSelected 
                                        ? 'border-emerald-500 bg-emerald-500/10' 
                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                }`}
                                onClick={() => handleSellerSelect(seller)}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    {/* Left: Seller Info (no badge) */}
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 min-w-0">
                                            <span className="font-semibold text-white truncate text-sm">
                                                {isBundledSeller 
                                                    ? 'Multiple Sellers (Bundled)'
                                                    : `${seller.sellerId.substring(0, 6)}...${seller.sellerId.substring(seller.sellerId.length - 4)}`
                                                }
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400" />
                                                <span className="text-xs text-white">{(seller.rating || 0).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        {/* Metrics Row: Inline, compact */}
                                        <div className="flex flex-row flex-wrap gap-x-4 gap-y-0.5 text-xs mt-0.5">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                                <span className="text-gray-300 whitespace-nowrap">{seller.tradeCount || 0} trades</span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Shield className="w-3 h-3 text-blue-400" />
                                                <span className="text-gray-300 whitespace-nowrap">{(seller.cancellationRate || 0).toFixed(1)}% cancel</span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Clock className="w-3 h-3 text-emerald-400" />
                                                <span className="text-gray-300 whitespace-nowrap">
                                                    {seller.averageReleaseTime
                                                        ? `${Math.round(seller.averageReleaseTime / 60)}m avg. release`
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Show bundled seller info */}
                                        {isBundledSeller && (
                                            <div className="mt-1 p-1 bg-slate-800/50 rounded border border-slate-600">
                                                <p className="text-xs text-emerald-400 font-medium mb-0.5">🔗 Bundled from multiple sellers</p>
                                                <p className="text-xs text-gray-400">
                                                    Your request will be fulfilled by combining orders from {seller.matchedOrders.length} different sellers
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Right: Selection Indicator */}
                                    {isSelected && (
                                        <div className="flex items-center justify-center ml-2">
                                            <Check className="w-5 h-5 text-emerald-500" />
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
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 mb-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Trade Summary</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-gray-300 text-xs">
                            <span>Total Amount</span>
                            <span className="font-semibold text-white">
                                {(selectedSellerWithLivePrices.totalAmount || 0).toFixed(6)} {tokenSymbol}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-300 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span>Estimated Cost</span>
                                <Tooltip text="Final price will be locked when you confirm">
                                    <Clock className="h-3 w-3 text-gray-500 cursor-help" />
                                </Tooltip>
                            </div>
                            <span className="font-semibold text-white h-5 flex items-center">
                                {isPriceLoading ? <Spinner /> : `~ ${formatCurrency(selectedSellerWithLivePrices.totalFiatCost || 0)}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-300 text-xs">
                            <span>Average Markup</span>
                            <span className="font-semibold text-white">
                                +{(selectedSellerWithLivePrices.averageMarkup || 0).toFixed(2)}%
                            </span>
                        </div>
                        {/* Show bundled seller details */}
                        {selectedSellerWithLivePrices.sellerId === 'BUNDLED_SELLERS' && (
                            <>
                                <div className="border-t border-slate-700 pt-2 mt-2">
                                    <div className="flex justify-between items-center text-gray-300 text-xs mb-1">
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

            <div className="flex justify-between gap-2 mt-2">
                <button onClick={onClose} className="w-1/2 py-2 rounded-lg bg-slate-700 text-white font-semibold text-sm hover:bg-slate-600 transition-all">Cancel</button>
                <button onClick={handleConfirm} disabled={!selectedSellerWithLivePrices} className="w-1/2 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Confirm & Lock Price</button>
            </div>
        </Modal>
    );
};

export default SellerSuggestionModal; 