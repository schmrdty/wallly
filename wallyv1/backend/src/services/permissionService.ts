import redisClient from '../db/redisClient.js';

export type PermissionScope = 'read' | 'write' | 'admin' | 'transfer' | 'wallet' | 'contract' | 'user' | 'token' | string;

export interface PermissionData {
  userId: string;
  resource: string; // e.g. 'wallet:123', 'contract:abc', 'global'
  scopes: PermissionScope[]; // e.g. ['read', 'write']
  grantedBy?: string;
  grantedAt?: number;
  expiresAt?: number;
  isActive?: boolean;
  meta?: Record<string, any>;
}

// Key format: permission:{userId}:{resource}
const getPermissionKey = (userId: string, resource: string) => `permission:${userId}:${resource}`;

export const getPermission = async (userId: string, resource: string): Promise<PermissionData | null> => {
  const data = await redisClient.get(getPermissionKey(userId, resource));
  return data ? JSON.parse(data) : null;
};

export const setPermission = async (permission: PermissionData) => {
  await redisClient.set(getPermissionKey(permission.userId, permission.resource), JSON.stringify(permission));
};

export const revokePermission = async (userId: string, resource: string) => {
  await redisClient.del(getPermissionKey(userId, resource));
};

export const listPermissions = async (userId: string): Promise<PermissionData[]> => {
  const keys = await redisClient.keys(`permission:${userId}:*`);
  const permissions = await Promise.all(keys.map(key => redisClient.get(key)));
  return permissions
    .filter((p): p is string => p !== null)
    .map(p => JSON.parse(p));
};

export const hasScope = async (userId: string, resource: string, scope: PermissionScope): Promise<boolean> => {
  const permission = await getPermission(userId, resource);
  if (!permission || !permission.isActive) return false;
  if (permission.expiresAt && Date.now() > permission.expiresAt) return false;
  return permission.scopes.includes(scope);
};

// Utility for granting a new permission
export const grantPermission = async (
  userId: string,
  resource: string,
  scopes: PermissionScope[],
  grantedBy?: string,
  expiresAt?: number,
  meta?: Record<string, any>
) => {
  const permission: PermissionData = {
    userId,
    resource,
    scopes,
    grantedBy,
    grantedAt: Date.now(),
    expiresAt,
    isActive: true,
    meta,
  };
  await setPermission(permission);
};
