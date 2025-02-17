import { FordefiWeb3Provider, EvmChainId, FordefiProviderConfig } from '@fordefi/web3-provider';
import dotenv from 'dotenv';
import fs from 'fs';

// Load Fordefi secrets
dotenv.config();
const FORDEFI_API_USER_TOKEN = process.env.FORDEFI_API_USER_TOKEN ?? 
  (() => { throw new Error('FORDEFI_API_USER_TOKEN is not set'); })();
const privateKeyFilePath = './fordefi_secret/private.pem';
const PEM_PRIVATE_KEY = fs.readFileSync(privateKeyFilePath, 'utf8') ??
  (() => { throw new Error('PEM_PRIVATE_KEY is not set'); })();

// 1. Configure the Fordefi provider
const config: FordefiProviderConfig = {
  chainId: EvmChainId.NUMBER_8453, // Base in this example
  address: '0x8BFCF9e2764BC84DE4BBd0a0f5AAF19F47027A73', // The Fordefi EVM Vault that will sign the message
  apiUserToken: FORDEFI_API_USER_TOKEN,
  apiPayloadSignKey: PEM_PRIVATE_KEY,
  rpcUrl: 'https://base.llamarpc.com',
  skipPrediction: false 
};
const provider = new FordefiWeb3Provider(config);

// 2. Define your EIP-712 domain
//    Adjust these fields to match your project’s requirements.
const domain = {
  name: 'HelloDapp',                 // Human-readable name of your domain
  version: '1',                   // Version of your domain
  chainId: config.chainId,                     // EVM chain ID (1 for Ethereum Mainnet)
  verifyingContract: '0x1fF1Da912b679b6fddF8900ddB8E7A10111762f2',  // Contract that will verify the signature
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
    // EIP712Domain is a standard type used in EIP-712, so we must include it.
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

// 5. Example usage
async function main() {
  // Wait for Fordefi provider to connect
  const result = await provider.waitForEmittedEvent('connect');
  console.log(`Connected to chain ${result.chainId}`);

  // The data you want to sign
  const myData = {
    someValue: '12345',
    someString: 'Hello EIP-712!',
  };

  // Prepare the data for EIP-712 signing
  const typedData = prepareTypedData(myData);

  // Sign the typed data using `eth_signTypedData_v4`
  const signerAddress = config.address; // Your Fordefi EVM Vault
  const signature = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [signerAddress, JSON.stringify(typedData)],
  });

  console.log('Signature:', signature);

}

main().catch(console.error);