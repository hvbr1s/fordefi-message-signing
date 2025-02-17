# CowSwap Token Swapper with Fordefi

A script to perform token swaps on CowSwap (CoW Protocol) using Fordefi as the signer.

## Overview

This script enables you to execute token swaps on CowSwap while using your Fordefi EVM vault as the signer. It leverages CowSwap's API to get quotes and create orders, with transaction signing handled by Fordefi.

## Prerequisites

- Fordefi organization and EVM vault
- Node.js and npm installed
- Fordefi credentials: API User token and API Signer set up ([documentation](https://docs.fordefi.com/developers/program-overview))

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory with your Fordefi API user token:
```bash
FORDEFI_API_USER_TOKEN=your_api_user_token_here
```

4. Create a directory `fordefi_secret` and place your API Signer's PEM private key in `fordefi_secret/private.pem`