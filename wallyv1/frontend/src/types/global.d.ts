// filepath: c:\Users\DREAM\Projects\.wally\src\types\global.d.ts
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import type { ExternalProvider } from '@ethersproject/providers';

interface EthereumProvider extends ExternalProvider {
  request?: (args: { method: string; params?: Array<any> }) => Promise<any>;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};