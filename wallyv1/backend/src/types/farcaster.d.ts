export interface ParsedSignInURI {
  channelToken: string;
  params: {
    domain: string;
    uri: string;
    nonce: string;
    notBefore?: string;
    expirationTime?: string;
    requestId?: string;
  };
  isError: boolean;
  error?: Error;
}
