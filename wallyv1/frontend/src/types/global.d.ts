// filepath: c:\Users\DREAM\Projects\.wally\src\types\global.d.ts
import type { ExternalProvider } from '@ethersproject/providers';

interface EthereumProvider extends ExternalProvider {
  request?: (args: { method: string; params?: Array<any> }) => Promise<any>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}