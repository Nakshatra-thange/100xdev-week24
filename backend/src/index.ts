//This code creates a backend server that automatically generates a unique 
// crypto wallet (address + private key) for every new user when they sign up.

//Big Picture 
// A user signs up (/signup)

// The server:
// Creates a database record
// Generates a unique Ethereum wallet for that user
// Stores the wallet address + private key

// That wallet becomes the user’s deposit address
import express from "express";
//Used to generate hierarchical deterministic (HD) wallets
import { HDNodeWallet } from "ethers6";
//Converts a 12/24-word mnemonic into a cryptographic seed
import { mnemonicToSeedSync } from "bip39";
//Your master recovery phrase (very sensitive!)
import { MNUENOMICS } from "./config";
//frontend apps to call this backend
import cors from "cors";
//Connects to PostgreSQL database
import { Client } from "pg";
//This connects to a database where user data is stored.
const client = new Client("postgres://postgres:mysecretpassword@localhost:5432/mynewdb");
client.connect();

//Take ONE secret phrase and turn it into a master seed 
// that can generate unlimited wallets.
const seed = mnemonicToSeedSync(MNUENOMICS);

const app = express();
app.use(express.json());

app.use(cors());

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    // Get user input
    const result = await client.query('INSERT INTO binanceUsers (username, password, depositAddress, privateKey, balance) VALUES ($1, $2, $3, $4, $5) RETURNING id', [username, password, "", "", 0]);
    // Insert user into DB
    //Get user ID
    const userId = result.rows[0].id;
    //Creates a master wallet.
    const hdNode = HDNodeWallet.fromSeed(seed);
    const derivationPath = `m/44'/60'/${userId}'/0`;
    // Part	Meaning
    // 44'	BIP-44 standard
    // 60'	Ethereum
    // ${userId}'	One wallet per user
    // // 0	First address
    //  User 1 → m/44'/60'/1'/0


    const child = hdNode.derivePath(derivationPath);
    console.log(derivationPath);
    // generate wallet
    await client.query('UPDATE binanceUsers SET depositAddress=$1, privateKey=$2 WHERE id=$3', [child.address, child.privateKey, userId]);
    // Store wallet in DB
    console.log(child.address);
    console.log(child.privateKey);
    console.log(child);
    //frontend user now lnows that account is created 
    res.json({
        userId
    })
})

app.get("/depositAddress/:userId", (req, res) => {
    
})

app.listen(3000);
