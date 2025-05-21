import "express-session";

declare module "express-session" {
  interface SessionData {
    nonce?: string;
    siwe?: {
      fid: string;
      address: string;
    };
  }
}