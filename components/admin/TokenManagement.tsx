// p2p-nextjs-frontend/components/admin/TokenManagement.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import Spinner from '../ui/Spinner';
import { Token } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import AddTokenModal from './AddTokenModal';
import AdminCard from '../ui/AdminCard';

// Wagmi and Viem Imports
import { useReadContracts, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi, zeroAddress } from 'viem';
import { config } from '@/lib/config';
import { CONTRACT_ADDRESSES } from '@/constants';

const TokenManagement = () => {
    const { address, chainId } = useWeb3();
    const { addNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? 84532];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    // Fetch the list of approved token addresses
    const { data: approvedTokenData, isLoading: isLoadingAddresses, refetch } = useReadContracts({
        contracts: [{ ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' }]
    });

    const approvedTokenAddresses = useMemo(() => 
        (approvedTokenData?.[0]?.result as `0x${string}`[] || []).filter(addr => addr !== zeroAddress),
        [approvedTokenData]
    );

    // Create a dynamic contract call array to fetch details for each token
    const tokenDetailContracts = useMemo(() =>
        approvedTokenAddresses.flatMap(addr => ([
            { address: addr, abi: erc20Abi, functionName: 'symbol' },
            { address: addr, abi: erc20Abi, functionName: 'decimals' },
        ])),
        [approvedTokenAddresses]
    );

    // Fetch all token details in a single batch
    const { data: tokenDetailsData, isLoading: isLoadingTokenDetails } = useReadContracts({
        contracts: tokenDetailContracts,
        query: { enabled: tokenDetailContracts.length > 0 },
    });
    
    // Process the results into a clean array
    const approvedTokens = useMemo(() => {
        if (!tokenDetailsData) return [];
        const tokens: Token[] = [];
        for (let i = 0; i < tokenDetailsData.length; i += 2) {
            const symbolResult = tokenDetailsData[i];
            const decimalsResult = tokenDetailsData[i+1];
            if (symbolResult.status === 'success' && decimalsResult.status === 'success') {
                tokens.push({
                    address: tokenDetailContracts[i].address,
                    symbol: symbolResult.result as string,
                    decimals: Number(decimalsResult.result),
                });
            }
        }
        return tokens;
    }, [tokenDetailsData, tokenDetailContracts]);


    const handleRemove = async (addressToRemove: string) => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'removeApprovedToken',
                args: [addressToRemove as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification({ type: 'success', message: 'Token removed successfully!' });
            refetch(); // Refresh the token list
        } catch (err: any) {
            addNotification({ type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    const addButton = (
        <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40">
            <Plus size={18} />
        </button>
    );

    const isLoading = isLoadingAddresses || isLoadingTokenDetails;

    return (
        <>
            <AdminCard title="Manage Approved Tokens" headerAction={addButton}>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Spinner text="Fetching tokens..." /></div>
                ) : approvedTokens.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No custom ERC20 tokens have been approved.</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {approvedTokens.map(token => (
                            <div key={token.address} className="flex justify-between items-center text-sm p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-white">{token.symbol}</p>
                                    <p className="font-mono text-gray-400 text-xs">{token.address}</p>
                                </div>
                                <button onClick={() => handleRemove(token.address)} disabled={isPending} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full disabled:opacity-50">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>
            
            <AddTokenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </>
    );
};

export default TokenManagement;