'use client';

const ConnectWalletMessage = () => {
    return (
        <div className="flex items-center justify-center min-h-[60vh] w-full">
            <div className="mx-auto w-full max-w-lg bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/70 shadow-2xl px-8 py-16 flex flex-col items-center text-center">
                <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Welcome to the Future of P2P</h2>
                <p className="text-lg text-gray-400 font-medium">Please connect your MetaMask or Coinbase Wallet to log in.</p>
            </div>
        </div>
    );
};

export default ConnectWalletMessage;