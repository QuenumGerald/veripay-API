# VeriPay API

A Node.js/Express microservice for building and broadcasting blockchain transactions, designed for seamless integration with Varisense and WalletConnect.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Blockchains](#supported-blockchains)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

VeriPay API provides a simple interface to prepare and submit blockchain transactions. It's designed to work with WalletConnect for client-side transaction signing, ensuring private keys never leave the user's device.

## Features

- Prepare unsigned transactions for multiple EVM-compatible blockchains
- Submit signed transactions to the network
- Support for native token and ERC-20 token transfers
- Comprehensive error handling and validation
- Health check and provider information endpoints

## Supported Blockchains

The API supports the following blockchains (configured in `chains.js`):

| Chain ID | Name        | Native Token | Testnet |
| -------- | ----------- | ------------ | ------- |
| 1        | Ethereum    | ETH          | No      |
| 5        | Goerli      | ETH          | Yes     |
| 56       | BSC         | BNB          | No      |
| 97       | BSC Test    | BNB          | Yes     |
| 137      | Polygon     | MATIC        | No      |
| 80001    | Mumbai      | MATIC        | Yes     |
| 43114    | Avalanche   | AVAX         | No      |
| 43113    | Fuji        | AVAX         | Yes     |
| 250      | Fantom      | FTM          | No      |
| 4002     | Fantom Test | FTM          | Yes     |

## API Endpoints

### 1. Get Provider Information

```http
GET /api/v1/provider
```

**Response:**

```json
{
  "success": true,
  "provider": {
    "id": "veripay",
    "name": "VeriPay",
    "version": "1.0.0",
    "description": "VeriPay Payment Gateway",
    "features": ["payments", "token-transfers"],
    "supportedChains": ["ethereum", "polygon", "bsc", "avalanche", "fantom"]
  },
  "timestamp": "2025-07-27T07:11:39.000Z"
}
```

### 2. Prepare Transaction

```http
POST /api/v1/transactions/prepare
Content-Type: application/json

{
  "chain": "ethereum",
  "to": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "amount": "0.1",
  "tokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7"
}
```

**Parameters:**

- `chain`: Blockchain network (e.g., "ethereum", "polygon", "bsc")
- `to`: Recipient address (0x...)
- `amount`: Amount to send (in native token or token units)
- `tokenAddress`: (Optional) ERC-20 token contract address. If not provided, native token transfer is assumed

**Response (Success):**

```json
{
  "success": true,
  "transaction": {
    "chain": "ethereum",
    "chainId": 1,
    "to": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "value": "100000000000000000",
    "data": "0xa9059cbb...",
    "gasLimit": "21000",
    "gasPrice": "20000000000",
    "nonce": "0x0"
  },
  "metadata": {
    "estimatedFee": "0.00042",
    "feeCurrency": "ETH",
    "tokenInfo": {
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6
    }
  }
}
```

### 3. Submit Signed Transaction

```http
POST /api/v1/transactions/submit
Content-Type: application/json

{
  "chain": "ethereum",
  "signedTx": "0x02f8b2018207c08459682f008507af2c9b008303d09094dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e000000000000000000000000000000000000000000000000016345785d8a0000c080a0..."
}
```

**Parameters:**

- `chain`: Blockchain network
- `signedTx`: Signed transaction data (0x...)

**Response (Success):**

```json
{
  "success": true,
  "status": "broadcasted",
  "transactionHash": "0x123...",
  "receipt": {
    "blockHash": "0x...",
    "blockNumber": 12345678,
    "confirmations": 1,
    "from": "0x...",
    "to": "0x...",
    "transactionHash": "0x..."
  },
  "timestamp": "2025-07-27T07:11:39.000Z"
}
```

### 4. Health Check

```http
GET /api/v1/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-07-27T07:11:39.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## Examples

### Using cURL

**1. Prepare a transaction:**

```bash
curl -X POST http://localhost:3000/api/v1/transactions/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "ethereum",
    "to": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "amount": "0.1",
    "tokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7"
  }'
```

**2. Submit a signed transaction:**

```bash
curl -X POST http://localhost:3000/api/v1/transactions/submit \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "ethereum",
    "signedTx": "0x02f8b2018207c08459682f008507af2c9b008303d09094dac17f958d2ee523a2206206994597c13d831ec780b844a9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e000000000000000000000000000000000000000000000000016345785d8a0000c080a0..."
  }'
```

### Using Postman

1. **Setup:**
   - Create a new request
   - Set method to `POST`
   - Enter URL: `http://localhost:3000/api/v1/transactions/prepare`
   - Go to Headers tab and add:
     - `Content-Type: application/json`
   - Go to Body tab, select `raw` and `JSON`

2. **Example Request Body:**

```json
{
  "chain": "ethereum",
  "to": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "amount": "0.1",
  "tokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7"
}
```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (in development mode)",
  "code": "ERROR_CODE"
}
```

Common error codes:

- `INVALID_INPUT`: Invalid request parameters
- `CHAIN_NOT_SUPPORTED`: Unsupported blockchain
- `INVALID_ADDRESS`: Invalid Ethereum address
- `INSUFFICIENT_FUNDS`: Not enough balance
- `RPC_ERROR`: Error from blockchain node

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/veripay-API.git
cd veripay-API
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

4. Start the server:

```bash
npm start
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# RPC URLs (required for each chain)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
FANTOM_RPC_URL=https://rpc.ftm.tools/

# Testnet RPCs (optional)
GOERLI_RPC_URL=
BSC_TESTNET_RPC_URL=
MUMBAI_RPC_URL=
FUJI_RPC_URL=
FANTOM_TESTNET_RPC_URL=
```

## Testing

Run unit tests:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
