export interface NeynarWebhookEvent {
    type: string;
    payload: any;
}

export interface ERC20EventPayload {
    from: string;
    to: string;
    amount: string;
    tokenAddress: string;
}

export interface NativeEventPayload {
    from: string;
    to: string;
    amount: string;
}

export interface ContractInteractionPayload {
    eventDescription: string;
    contractAddress: string;
}

export interface WalletAlertPayload {
    alertMessage: string;
    walletAddress: string;
}

export interface AutoForwardingPayload {
    amount: string;
    destination: string;
    tokenAddress?: string;
}
