import { FordefiWeb3Provider, EvmChainId, FordefiProviderConfig } from '@fordefi/web3-provider';
import { ProviderRpcError }from 'viem/errors/rpc'
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// 1. Configure the Fordefi provider
const config: FordefiProviderConfig = {
  chainId: EvmChainId.NUMBER_8453, // Base in this example
  address: '0x8BFCF9e2764BC84DE4BBd0a0f5AAF19F47027A73', // The Fordefi EVM Vault that will sign the message
  apiUserToken: process.env.FORDEFI_API_USER_TOKEN ?? (() => { throw new Error('FORDEFI_API_USER_TOKEN is not set'); })(), 
  apiPayloadSignKey: fs.readFileSync('./fordefi_secret/private.pem', 'utf8') ?? (() => { throw new Error('PEM_PRIVATE_KEY is not set'); })(),
  rpcUrl: 'https://base.llamarpc.com',
  skipPrediction: false 
};

// 2. Define your EIP-712 domain
//    Adjust these fields to match your project’s requirements.
const domain = {
  name: 'HelloDapp',                                                // Human-readable name of your domain
  version: '1',                                                     // Version of your domain
  chainId: config.chainId,                                          // EVM chain ID (1 for Ethereum Mainnet)
  verifyingContract: '0x28A2b192810484C19Dd3c8884f0F30AfE4796ad7',  // Contract that will verify the signature
};

// 3. Define your typed data structure
//    Example struct: MyStruct with two fields.
const eip712Types = {
  MyStruct: [
    { name: 'someValue', type: 'uint256' },
    { name: 'someString', type: 'string' },
  ],
};

// 4. Create a function to prepare the typed data payload
function prepareTypedData(data: any) {
  return {
    domain,
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...eip712Types,
    },
    primaryType: 'MyStruct',
    message: data,
  };
}

let provider = new FordefiWeb3Provider(config);

async function main() {
  // Wait for Fordefi provider to connect
  const result = await provider.waitForEmittedEvent('connect');
  console.log(`Connected to chain ${result.chainId}`);

  // Handle provider disconnection
  provider.on('disconnect', async (error: ProviderRpcError) => {
    console.log('Provider disconnected:', error.message);
    
    // Create a new provider instance
    provider = new FordefiWeb3Provider(config);
    
    // Wait for the new provider to connect
    try {
      const reconnectResult = await provider.waitForEmittedEvent('connect');
      console.log(`Reconnected to chain ${reconnectResult.chainId}`);
    } catch (reconnectError) {
      console.error('Failed to reconnect provider:', reconnectError);
    }
  });

  // The data you want to sign
  const myData = {
    someValue: '12345',
    someString: 'Go go Fordefi!',
  };

  // Prepare the data for EIP-712 signing
  const typedData = prepareTypedData(myData);

  // Sign the typed data using the `eth_signTypedData_v4` method
  const signerAddress = config.address; // Your Fordefi EVM Vault
  const signature = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [signerAddress, JSON.stringify(typedData)],
  });

  console.log('Signature:', signature);

}

main().catch(console.error);