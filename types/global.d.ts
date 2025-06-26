// We will define our own interface for the provider to be more accurate.

interface MetaMaskProvider {
    isMetaMask?: boolean;
    request(args: { method: string; params?: Array<any>; }): Promise<any>;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  }
  
  declare global {
    interface Window {
      ethereum?: MetaMaskProvider;
    }
  }
  
  // We add an empty export statement to make this a module, which is good practice.
  export {};