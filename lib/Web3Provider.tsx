'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
  useReadContracts,
  Connector,
} from 'wagmi';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { P2PEscrowABI } from '@/abis/P2PEscrow'; // Make sure you have this ABI file
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { UserProfile } from '@/types';

interface Web3ContextType {
  address: `0x${string}` | undefined;
  userProfile: UserProfile | null;
  isInitializing: boolean;
  isAuthenticating: boolean;
  chainId: number | undefined;
  isOwner: boolean;
  isManager: boolean;
  isArbitrator: boolean;
  connectWallet: (connector: Connector, chainId?: number) => void; // updated
  disconnectWallet: () => void;
  switchChain: ((args: { chainId: number; }) => void) | undefined;
  error: string | null;
  connectors: readonly Connector[];
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // 1. Get the raw, checksummed address from wagmi
  const { address: rawAddress, chainId, isConnecting, connector: activeConnector } = useAccount();
  
  // 2. FIX: Always use a lowercase address when providing it to the rest of the app
  const address = rawAddress ? (rawAddress.toLowerCase() as `0x${string}`) : undefined;

  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();

  const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
  const p2pEscrowContract = {
    address: contractAddress as `0x${string}`,
    abi: P2PEscrowABI,
  };

  const { data: roleData, isLoading: isLoadingRoles } = useReadContracts({
    contracts: [
      { ...p2pEscrowContract, functionName: 'owner' },
      { ...p2pEscrowContract, functionName: 'isManager', args: [address!] },
      { ...p2pEscrowContract, functionName: 'isArbitrator', args: [address!] },
    ],
    query: { enabled: !!address },
  });

  const [ownerResult, isManagerResult, isArbitratorResult] = roleData || [];
  const isOwner = !!(address && ownerResult?.result && String(ownerResult.result).toLowerCase() === address);
  const isManager = isOwner || !!isManagerResult?.result;
  const isArbitrator = isOwner || !!isArbitratorResult?.result;

  const firebaseLogin = useCallback(async (walletAddress: `0x${string}`) => {
    // --- DEBUGGING STEP ---
    // This will tell us exactly what wagmi thinks the connector is.
    console.log("Attempting Firebase login. Active Connector:", activeConnector);

    try {
        const isSmartWallet = activeConnector?.id === 'coinbaseWallet';
        let signature;
        
        if (!isSmartWallet) {
            const message = "Please sign this message to log in to the P2P DEX Ramp.";
            signature = await signMessageAsync({ message });
        }

        // The body now exactly mirrors your original ethers.js version's logic
        const apiBody = {
            address: walletAddress,
            ...(isSmartWallet && { isSmartWallet: true }),
            ...(!isSmartWallet && { signature: signature })
        };

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiBody),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Firebase login failed.');
        
        await signInWithCustomToken(auth, data.token);

    } catch (err: any) {
        console.error("Firebase login error:", err);
        setError(err.message);
        disconnect();
    }
}, [signMessageAsync, disconnect, activeConnector]);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setIsAuthenticating(true);
      if (user && user.uid === address) {
          const profileUnsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
              setUserProfile(doc.exists() ? doc.data() as UserProfile : null);
          });
          setIsAuthenticating(false);
          return () => profileUnsubscribe();
      } else if (address && !user) {
          await firebaseLogin(address);
          setIsAuthenticating(false);
      } else {
          setUserProfile(null);
          setIsAuthenticating(false);
      }
  });
  return () => unsubscribe();
}, [address, firebaseLogin]);

const disconnectWallet = useCallback(() => {
  signOut(auth);
  disconnect();
}, [disconnect]);

const value: Web3ContextType = {
  address,
  userProfile,
  isInitializing: isConnecting,
  isAuthenticating,
  chainId,
  isOwner,
  isManager,
  isArbitrator,
  connectWallet: (connector, chainId) => connect(chainId ? { connector, chainId } : { connector }), // updated
  disconnectWallet,
  switchChain,
  error,
  connectors,
};

return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
const context = useContext(Web3Context);
if (context === undefined) throw new Error('useWeb3 must be used within a Web3Provider');
return context;
};