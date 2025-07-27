require('dotenv').config();
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const axios = require('axios');
const { ethers } = require('ethers');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY is not defined in .env file');
  console.log('Please create a .env file with your private key:');
  console.log('PRIVATE_KEY=your_private_key_here');
  console.log('API_URL=http://your-api-url (optional)');
  process.exit(1);
}

// Initialize wallet
const wallet = new ethers.Wallet(PRIVATE_KEY);
console.log(`🔑 Using wallet: ${wallet.address}`);

async function testHealthCheck() {
  try {
    console.log('\n🔍 Testing health check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Charger la configuration des chaînes
const chains = require('../chains');

async function prepareTransaction(chainName = 'sepolia') {
  try {
    console.log(`\n💸 Preparing transaction for chain: ${chainName}...`);

    // Vérifier que la chaîne est supportée
    let chainConfig = chains[chainName];

    // Si pas trouvé par clé, chercher par nom ou chainId
    if (!chainConfig) {
      chainConfig = Object.values(chains).find(
        chain =>
          chain.name.toLowerCase() === chainName.toLowerCase() ||
          (chain.chainId && chain.chainId.toString() === chainName)
      );
    }

    if (!chainConfig) {
      throw new Error(
        `Unsupported chain: ${chainName}. Available chains: ${Object.keys(chains).join(', ')}`
      );
    }

    const transactionData = {
      chain: chainName,
      to: '0xEc76081eE119656e4814E4EF3B707F59412A2Fb9',
      amount: '0.000001',
      // tokenAddress est optionnel pour les transactions ETH natives
    };

    console.log('Sending transaction data:', JSON.stringify(transactionData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/transactions/prepare`,
      transactionData
    );

    console.log('✅ Transaction prepared successfully!');
    console.log('Transaction details:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('❌ Failed to prepare transaction:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

async function signTransaction(transaction) {
  try {
    console.log('\n🔐 Signing transaction...');

    // Convertir les valeurs en format approprié pour ethers
    const tx = {
      to: transaction.to,
      value: BigInt(transaction.value), // transaction.value est déjà en wei
      gasLimit: transaction.gasLimit || 21000,
      gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,
      maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
        ? BigInt(transaction.maxPriorityFeePerGas)
        : undefined,
      nonce: transaction.nonce ? parseInt(transaction.nonce) : undefined,
      data: transaction.data || '0x',
      chainId: parseInt(transaction.chainId || '11155111'), // 11155111 pour Sepolia par défaut
      type: transaction.type || 2, // EIP-1559
    };

    console.log(
      'Transaction to sign:',
      JSON.stringify(tx, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
    );

    // Signer la transaction
    const signedTx = await wallet.signTransaction(tx);
    console.log('✅ Transaction signed successfully');

    return signedTx;
  } catch (error) {
    console.error('❌ Failed to sign transaction:', error);
    return null;
  }
}

async function submitTransaction(signedTx) {
  if (!signedTx) {
    console.log('\n⚠️  No signed transaction provided. Skipping submission.');
    return;
  }

  readline.question('\n🚀 Do you want to submit the transaction? (y/n): ', async answer => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Transaction submission cancelled.');
      readline.close();
      return;
    }

    try {
      console.log('\n🚀 Submitting transaction...');
      const response = await axios.post(`${API_BASE_URL}/api/v1/transactions/submit`, {
        chain: 'sepolia',
        signedTx: signedTx,
      });

      console.log('✅ Transaction submitted successfully!');
      console.log('Transaction hash:', response.data.txHash);
      console.log('View on Etherscan:', `https://etherscan.io/tx/${response.data.txHash}`);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ Failed to submit transaction:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    } finally {
      readline.close();
    }
  });
}

async function runTests(chainName = 'sepolia') {
  console.log(`🚀 Starting API tests for chain: ${chainName}...`);

  // Test health check
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('❌ Exiting due to health check failure');
    process.exit(1);
  }

  // Test transaction preparation with specified chain
  const preparedTx = await prepareTransaction(chainName);

  if (preparedTx && preparedTx.transaction) {
    console.log('\n📝 Prepared transaction details:');
    console.log(JSON.stringify(preparedTx.transaction, null, 2));

    // Sign the transaction with the private key
    const signedTx = await signTransaction(preparedTx.transaction);

    if (signedTx) {
      console.log('\n🔏 Signed transaction:');
      console.log(signedTx);

      // Submit the signed transaction
      await submitTransaction(signedTx);
    } else {
      console.log('❌ Failed to sign transaction');
      readline.close();
    }
  } else {
    console.log('❌ No transaction to sign');
    readline.close();
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Exiting...');
  readline.close();
  process.exit(0);
});

// Get chain from command line arguments or use default
const args = process.argv.slice(2);
const chainArg = args[0];

// List available chains if --help or -h is passed
if (chainArg === '--help' || chainArg === '-h') {
  console.log('\nUsage: node scripts/test-api.js [chain_name]');
  console.log('\nAvailable chains:');
  Object.entries(chains).forEach(([key, chain]) => {
    console.log(`- ${key.padEnd(15)} (${chain.name}, chainId: ${chain.chainId})`);
  });
  process.exit(0);
}

// Run the tests with the specified chain or default to 'sepolia'
runTests(chainArg);
