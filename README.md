# MCP Transactions Project

This project is a Node.js/TypeScript application that interacts with the Pawapay Model Context Protocol (MCP) API to manage mobile money transactions, specifically deposits, via various correspondents such as MPESA_KEN.

## Features
- Predict the correspondent for a given MSISDN (phone number)
- Create deposits for specified correspondents, amounts, and MSISDNs
- Check the status of deposit transactions

## Project Structure

- `src/index.ts` - Main entry point for the application logic
- `src/index-stdio.ts` - (If present) CLI or standard I/O interface
- `src/pawapay.ts` - Pawapay/MCP API interaction logic
- `package.json` - Project dependencies and scripts

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mcp-transactions
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Usage

#### Predict Correspondent
Use the provided API or CLI to predict which correspondent a phone number (MSISDN) belongs to.

#### Create a Deposit
Create a deposit by specifying the following:
- depositId (unique UUID)
- amount
- msisdn (recipient phone number)
- country (e.g., KEN)
- correspondent (e.g., MPESA_KEN)
- currency (e.g., KES)
- description (optional)

#### Check Deposit Status
Query the status of a deposit using its depositId (transactionId).

### Example
```typescript
// Example usage in TypeScript
import { createDeposit, getDepositStatus, predictCorrespondent } from './src/pawapay';

const depositId = 'your-uuid';
const msisdn = '2547XXXXXXXX';
const amount = '100';
const correspondent = 'MPESA_KEN';
const country = 'KEN';
const currency = 'KES';
const description = 'Test deposit';

await createDeposit({ depositId, msisdn, amount, correspondent, country, currency, description });
const status = await getDepositStatus(depositId);
console.log(status);
```

## Configuration
- MCP configuration is typically managed in `.codeium/windsurf/mcp_config.json`.
- Ensure you have the appropriate credentials and access to the Pawapay MCP API.

## License
MIT

## Support
For issues, please open a ticket in the repository or contact the maintainer.
