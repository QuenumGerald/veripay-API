/**
 * Configuration des chaînes de blocs supportées
 * Les URLs RPC sont chargées depuis les variables d'environnement
 */

module.exports = {
  // Réseaux principaux
  ethereum: {
    name: 'Ethereum Mainnet',
    rpc: process.env.ETH_RPC,
    chainId: 1,
    nativeDecimals: 18,
    explorer: 'https://etherscan.io',
    currency: 'ETH',
  },
  polygon: {
    name: 'Polygon',
    rpc: process.env.POLY_RPC,
    chainId: 137,
    nativeDecimals: 18,
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
  },
  bsc: {
    name: 'BNB Smart Chain',
    rpc: process.env.BSC_RPC,
    chainId: 56,
    nativeDecimals: 18,
    explorer: 'https://bscscan.com',
    currency: 'BNB',
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    rpc: process.env.AVAX_RPC,
    chainId: 43114,
    nativeDecimals: 18,
    explorer: 'https://snowtrace.io',
    currency: 'AVAX',
  },
  fantom: {
    name: 'Fantom Opera',
    rpc: process.env.FTM_RPC,
    chainId: 250,
    nativeDecimals: 18,
    explorer: 'https://ftmscan.com',
    currency: 'FTM',
  },
  arbitrum: {
    name: 'Arbitrum One',
    rpc: process.env.ARB_RPC,
    chainId: 42161,
    nativeDecimals: 18,
    explorer: 'https://arbiscan.io',
    currency: 'ETH',
  },
  optimism: {
    name: 'Optimism',
    rpc: process.env.OPT_RPC,
    chainId: 10,
    nativeDecimals: 18,
    explorer: 'https://optimistic.etherscan.io',
    currency: 'ETH',
  },
  // Réseaux de test
  sepolia: {
    name: 'Ethereum Sepolia',
    rpc: process.env.SEPOLIA_RPC,
    chainId: 11155111,
    nativeDecimals: 18,
    explorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    isTestnet: true,
  },
  mumbai: {
    name: 'Polygon Mumbai',
    rpc: process.env.MUMBAI_RPC,
    chainId: 80001,
    nativeDecimals: 18,
    explorer: 'https://mumbai.polygonscan.com',
    currency: 'MATIC',
    isTestnet: true,
  },
  bscTestnet: {
    name: 'BSC Testnet',
    rpc: process.env.BSCTEST_RPC,
    chainId: 97,
    nativeDecimals: 18,
    explorer: 'https://testnet.bscscan.com',
    currency: 'tBNB',
    isTestnet: true,
  },
  // Autres chaînes EVM
  moonriver: {
    name: 'Moonriver',
    rpc: process.env.MOONRIVER_RPC,
    chainId: 1285,
    nativeDecimals: 18,
    explorer: 'https://moonriver.moonscan.io',
    currency: 'MOVR',
  },
  astar: {
    name: 'Astar',
    rpc: process.env.ASTAR_RPC,
    chainId: 592,
    nativeDecimals: 18,
    explorer: 'https://astar.blockscout.com',
    currency: 'ASTR',
  },
  // Ajoutez d'autres chaînes selon les besoins
};
