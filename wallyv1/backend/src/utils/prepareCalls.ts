import axios from 'axios';
import logger from '../infra/mon/logger.js';

class UserOpBuilderApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'UserOpBuilderApiError';
  }
}

export async function prepareCalls(args: any) {
  const projectId = process.env["SERVER_PROJECT_ID"];
  if (!projectId) {
    throw new Error("SERVER_PROJECT_ID is not set");
  }
  const url = `https://rpc.walletconnect.org/v1/wallet?projectId=${projectId}`;
  return jsonRpcRequest("wallet_prepareCalls", [args], url);
}

export async function sendPreparedCalls(args: any) {
  const projectId = process.env["SERVER_PROJECT_ID"];
  if (!projectId) {
    throw new Error("SERVER_PROJECT_ID is not set");
  }
  const url = `https://rpc.walletconnect.org/v1/wallet?projectId=${projectId}`;
  return jsonRpcRequest("wallet_sendPreparedCalls", [args], url);
}

export async function handleFetchReceipt(userOpHash: string, options: any = {}) {
  const { timeout = 30000, interval = 3000 } = options;
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    const response = await getCallsStatus(userOpHash);
    if (response.status === "CONFIRMED") {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(
    `Timeout: Transaction not confirmed after ${timeout / 1000} seconds. Last status: unknown`
  );
}

export async function getCallsStatus(args: any, options: any = {}) {
  const projectId = process.env["SERVER_PROJECT_ID"];
  if (!projectId) {
    throw new Error("SERVER_PROJECT_ID is not set");
  }
  const url = `https://rpc.walletconnect.org/v1/wallet?projectId=${projectId}`;

  const { timeout = 60000, interval = 2000 } = options;
  const endTime = Date.now() + timeout;
  let lastResponse: any = null;

  while (Date.now() < endTime) {
    try {
      const response = await jsonRpcRequest("wallet_getCallsStatus", [args], url);
      lastResponse = response;
      if (response.status === "CONFIRMED") {
        return response;
      } else if (response.status === "FAILED") {
        throw new Error(`Transaction failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      if (
        error.message.includes("SERVER_PROJECT_ID") ||
        error.message.includes("Invalid response")
      ) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(
    `Timeout: Transaction not confirmed after ${timeout / 1000} seconds. Last status: ${lastResponse?.status || 'unknown'}`
  );
}

function bigIntReplacer(_key: string, value: any) {
  if (typeof value === "bigint") {
    return `0x${value.toString(16)}`;
  }
  return value;
}

async function jsonRpcRequest(method: string, params: any[], url: string) {
  const response = await axios.post(url, {
    jsonrpc: "2.0",
    id: "1",
    method,
    params,
  }, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200) {
    throw new UserOpBuilderApiError(response.status, response.statusText);
  }

  const data = response.data as { result?: any; error?: any };

  if ("error" in data) {
    throw new UserOpBuilderApiError(500, JSON.stringify(data.error));
  }

  return data.result;
}
