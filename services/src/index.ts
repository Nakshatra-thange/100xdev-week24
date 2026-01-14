//This code scans a specific Ethereum block, finds transactions that sent ETH to certain addresses, 
// fetches full transaction details, and prints them.

//Check the blockchain and see if anyone sent money to addresses we care about.

import { JsonRpcProvider } from "ethers"; //connect to eth , fetch txn , query blocks and decode data
import axios from "axios";
let CURRENT_BLOCK_NUMBER = 21695414;
//we are currently scanning block number ....

const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/e3fUoPqdyoLlCGWNHdY2lEOaovOsKddu')
//connection to Ethereum mainnet using Alchemy.

async function main() {
    // get the interested addresses from the DB

    const interestedAddress = ["0xb73664d81129150964b07c6447b2949cf5f11619", "0x0Ec5A4Ec916E241797dA89a66e25C231bb4150F8", "0x8407490c88667c1c5ca2910f95dd4027c84e1804"];
    // add that come from db 
    const transactions = await getTransactionReceipt(CURRENT_BLOCK_NUMBER.toString());
    // Give me all transactions that were executed in this block.
    const interestedTransactions = transactions?.result.filter(x => interestedAddress.includes(x.to))
    // Out of all transactions in this block, keep only those whose destination address is one of our addresses.
    const fullTxns = await Promise.all(interestedTransactions.map(async ({transactionHash}) => {
        const txn = await provider.getTransaction(transactionHash);
        return txn;
    }))

    console.log(fullTxns)

    // Bad approach => Update the balance in the database. 
//     Why is this bad?

// Because:

// ETH transactions can be reverted

// Blocks can be reorged

// Transactions may fail

// Value ≠ final balance

// Replaying blocks can double-credit users

// Correct approach:

// Track deposits by transaction hash

// Track confirmations

// Wait N blocks

// Use idempotent updates

}

interface TransactionReceipt {
    transactionHash: string;
    from: string;
    to: string;
}

interface TransactionReceiptResponse {
    result: TransactionReceipt[]
}

async function getTransactionReceipt(blockNumber: string): Promise<TransactionReceiptResponse> {
    let data = JSON.stringify({
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_getBlockReceipts",
        "params": [
          "0x14B0BB7" // TODO: add block number here
        ]
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://eth-mainnet.g.alchemy.com/v2/e3fUoPqdyoLlCGWNHdY2lEOaovOsKddu',
        headers: { 
          'accept': 'application/json', 
          'content-type': 'application/json', 
          'Cookie': '_cfuvid=Qn1QTPgL8vHUo0A_cayd0JmLEtgJy5VQKGI5IFuem44-1737735399258-0.0.1.1-604800000'
        },
        data : data
      };
      
      const response = await axios.request(config)
      return response.data;
}

main()