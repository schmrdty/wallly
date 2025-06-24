import * as siweVerify from '../../utils/siweVerify.js';

jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({
    verify: jest.fn(() => Promise.resolve({
      success: true,
      data: { address: '0x123' },
    })),
    address: '0x123',
  })),
}));

describe('siweVerify', () => {
  it('should verify a SIWE message', async () => {
    const result = await siweVerify.verifySiweMessage({ message: 'msg', signature: 'sig' });
    expect(result.success).toBe(true);
    expect(result.address).toBe('0x123');
  });
});
