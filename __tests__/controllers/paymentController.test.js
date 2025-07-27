// Mock ethers before importing the controller
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  const mockUtils = {
    parseUnits: jest.fn().mockImplementation((value, unit) => {
      // Simple mock implementation
      if (unit === 'gwei') return value * 1e9;
      return value;
    }),
  };

  // Create a deep copy of the original module to avoid mutating it
  const result = {};

  // Copy all properties from originalModule to result
  Object.keys(originalModule).forEach(function (key) {
    result[key] = originalModule[key];
  });

  // Add our custom utils
  result.utils = mockUtils;

  // Create a copy of ethers with our custom providers
  result.ethers = {};
  Object.keys(originalModule.ethers || {}).forEach(function (key) {
    result.ethers[key] = originalModule.ethers[key];
  });

  // Add our custom providers
  result.ethers.providers = {
    JsonRpcProvider: jest.fn().mockImplementation(function () {
      return {
        getFeeData: jest.fn().mockResolvedValue({
          maxFeePerGas: '20000000000', // 20 gwei
          maxPriorityFeePerGas: '1500000000', // 1.5 gwei
          gasPrice: '20000000000', // 20 gwei
        }),
        getTransactionCount: jest.fn().mockResolvedValue(42),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 5 }),
        send: jest.fn().mockResolvedValue({
          hash: '0x123',
          wait: jest.fn().mockResolvedValue({
            blockHash: '0x456',
            blockNumber: 1234567,
            from: '0x123',
            to: '0x789',
            transactionHash: '0x123',
          }),
        }),
      };
    }),
  };

  return result;
});

const {
  buildPaymentPreview,
  broadcastSignedTransaction,
} = require('../../controllers/paymentController');
// ethers is mocked at the top of the file

// Mock the chains module
jest.mock('../../chains', () => ({
  getChainConfig: jest.fn(_chain => ({
    rpc: 'https://mock-rpc-url.com',
    chainId: 5, // Goerli testnet
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  })),
}));

describe('Payment Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('buildPaymentPreview', () => {
    it('should build a payment preview with correct gas estimation', async () => {
      const req = {
        body: {
          chain: 'ethereum',
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '0.01',
          data: '0x',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const next = jest.fn();
      await buildPaymentPreview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: expect.any(String),
          value: expect.any(String),
          gasPrice: expect.any(String),
          gasLimit: expect.any(String),
          maxFeePerGas: expect.any(String),
          maxPriorityFeePerGas: expect.any(String),
          estimatedGas: expect.any(String),
          totalCost: expect.any(String),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should build a native token transaction', async () => {
      const result = await buildPaymentPreview({
        chain: 'ethereum',
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: '0.1',
      });

      expect(result).toHaveProperty('success', true);
      expect(result.transaction).toHaveProperty('to', '0x742d35cc6634c0532925a3b844bc454e4438f44e'); // toLowerCase() is applied
      expect(result.transaction).toHaveProperty('value', '0.1');
      expect(result.transaction).toHaveProperty('data', '0x');
      expect(result.metadata).toHaveProperty('feeCurrency', 'ETHEREUM');
    });

    it('should build an ERC-20 token transaction', async () => {
      const result = await buildPaymentPreview({
        chain: 'ethereum',
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: '10',
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      });

      expect(result).toHaveProperty('success', true);
      expect(result.transaction).toHaveProperty('data');
      expect(result.metadata).toHaveProperty('feeCurrency', 'TOKEN');
      expect(result.metadata.tokenInfo).toEqual({
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
      });
    });
  });

  describe('broadcastSignedTransaction', () => {
    it('should broadcast a signed transaction', async () => {
      const result = await broadcastSignedTransaction('ethereum', '0xsignedtx');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('receipt');
      expect(result.receipt).toHaveProperty('status', 1);
    });

    it('should handle chain parameter', async () => {
      // Test that the chain parameter is properly passed through
      const chain = 'ethereum';
      const result = await broadcastSignedTransaction(chain, '0xsignedtx');
      expect(result).toHaveProperty('success', true);
      // Verify the chain parameter was used by checking if getChainConfig was called with it
      const { getChainConfig } = require('../../chains');
      expect(getChainConfig).toHaveBeenCalledWith(chain);
    });
  });
});
