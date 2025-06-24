import { JsonRpcProvider, Contract } from 'ethers';
import redisClient from '../../db/redisClient.ts';
import { WallyService } from '../../services/wallyService.ts';

// Mock dependencies
/**
 * Mocks the ethers library for testing purposes.
 *
 * @remarks
 * This mock is used to provide test doubles for the ethers library functions and
 * properties used in the WallyService tests.
 *
 * @returns - An object containing the mocked ethers library functions and properties.
 */
jest.mock('ethers', () => {
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockImplementation(() => ({
        getAddress: jest.fn().mockResolvedValue('0x123'),
        connect: jest.fn(),
      }))
    })),
    Contract: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      off: jest.fn(),
      connect: jest.fn().mockReturnThis(),
      triggerTransfers: jest.fn(),
      getUserPermission: jest.fn(),
      grantOrUpdatePermission: jest.fn(),
      grantMiniAppSession: jest.fn(),
      revokeMiniAppSession: jest.fn(),
    })),
    formatUnits: jest.fn().mockReturnValue('1.0')
  };
});

jest.mock('../../db/redisClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    persist: jest.fn(),
    lPush: jest.fn(),
    lRange: jest.fn(),
  },
}));

jest.mock('../../utils/helpers', () => ({
  fuzzyFindTokenByAddress: jest.fn(),
}));

describe('WallyService', () => {
  let wallyService: WallyService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RPC_URL = 'https://example.com/rpc';
    process.env.WALLY_CONTRACT_ADDRESS = '0xContractAddress';
    wallyService = new WallyService();
  });

  test('should initialize provider and contract in constructor', () => {
    expect(JsonRpcProvider).toHaveBeenCalledWith(process.env.RPC_URL);
    expect(Contract).toHaveBeenCalledWith(
      process.env.WALLY_CONTRACT_ADDRESS,
      expect.any(Object), // wallyv1Abi
      expect.any(Object)  // provider
    );
  });
  test.skip('should set up event listeners when calling listenForEvents', () => {
    // wallyService.listenForEvents();

    // Check that contract.on was called for each event type
    const contract = (wallyService as any).contract;
    expect(contract.on).toHaveBeenCalledWith('TransferPerformed', expect.any(Function));
    expect(contract.on).toHaveBeenCalledWith('MiniAppSessionGranted', expect.any(Function));
    expect(contract.on).toHaveBeenCalledWith('PermissionGranted', expect.any(Function));
    expect(contract.on).toHaveBeenCalledWith('PermissionRevoked', expect.any(Function));
  });

  test.skip('should handle user data on revoke correctly', async () => {
    // Mock the redis calls
    (redisClient.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'purgeMode:0xUser') return Promise.resolve('true');
      return Promise.resolve(null);
    });    // await wallyService.handleUserDataOnRevoke('0xUser');

    // Should call wipeUserDataExceptMetadata since purgeMode is true
    expect(redisClient.get).toHaveBeenCalledWith('purgeMode:0xUser');
    expect(redisClient.del).toHaveBeenCalled();
  });

  test.skip('should schedule cleanup if purge mode is not enabled', async () => {
    // Mock the redis calls - purge mode is false
    (redisClient.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'purgeMode:0xUser') return Promise.resolve('false');
      return Promise.resolve(null);
    });    // await wallyService.handleUserDataOnRevoke('0xUser');

    // Should set expiry for userEvents
    expect(redisClient.expire).toHaveBeenCalledWith('userEvents:0xUser', expect.any(Number));
    expect(redisClient.set).toHaveBeenCalledWith(
      'scheduledCleanup:0xUser',
      expect.any(Number)
    );
  });

  test.skip('should handle user data on renew correctly', async () => {
    // await wallyService.handleUserDataOnRenew('0xUser');

    // Should remove scheduled cleanup and make userEvents persistent
    expect(redisClient.del).toHaveBeenCalledWith('scheduledCleanup:0xUser');
    expect(redisClient.persist).toHaveBeenCalledWith('userEvents:0xUser');
  });
});

afterAll(() => {
  jest.clearAllTimers();
});
