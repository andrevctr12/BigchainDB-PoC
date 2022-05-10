import Orm from 'bigchaindb-orm';
import { MongoClient } from 'mongodb';
import * as BigchainDB from 'bigchaindb-driver';
const bip39 = require('bip39');
import tokenLaunch from './utils/tokenLaunch';

const API_PATH = 'http://localhost:9984/api/v1/';
const conn = new BigchainDB.Connection(API_PATH);

export class DID extends Orm {
    constructor(entity: any) {
        super(API_PATH);
        this.entity = entity;
    }
}

export interface KeyPair {
	privateKey: string;
	publicKey: string;
}

export enum TransactionOperations {
    CREATE = 'CREATE',
    TRANSFER = 'TRANSFER',
}

export async function createDatabaseTransaction(keypair: KeyPair, asset: any, metadata: any) {
    // Construct a transaction payload
    const tx = BigchainDB.Transaction.makeCreateTransaction(
        asset,
        metadata,
        // A transaction needs an output
        [BigchainDB.Transaction.makeOutput(
            BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey))
        ],
        keypair.publicKey
    );

    // Sign the transaction with private keys
    const txSigned = BigchainDB.Transaction.signTransaction(tx, keypair.privateKey);
    return (await conn.postTransactionCommit(txSigned));
}

export async function createNewToken(keypair: KeyPair, asset: any, metadata: any, amount: string) {
    // Construct a transaction payload
    const tx = BigchainDB.Transaction.makeCreateTransaction(
        asset,
        metadata,
        // A transaction needs an output
        [BigchainDB.Transaction.makeOutput(
            BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey),
            amount)
        ],
        keypair.publicKey
    );

    // Sign the transaction with private keys
    const txSigned = BigchainDB.Transaction.signTransaction(tx, keypair.privateKey);
    return (await conn.postTransactionCommit(txSigned));
}

export function transferOwnership(
    txCreatedID: string,
    oldOwner: KeyPair,
    newOwner: string,
    metadata: any,
) {
    // Get transaction payload by ID
    conn.getTransaction(txCreatedID)
        .then((txCreated) => {
            const createTranfer =
                BigchainDB.Transaction.makeTransferTransaction(
                    // The output index 0 is the one that is being spent
                    [
                        {
                            tx: txCreated,
                            output_index: 0,
                        },
                    ],
                    [
                        BigchainDB.Transaction.makeOutput(
                            BigchainDB.Transaction.makeEd25519Condition(
                                newOwner
                            )
                        ),
                    ],
                    {
                        ...txCreated.metadata,
                        ...metadata
                    }
                );

            const signedTransfer = BigchainDB.Transaction.signTransaction(
                createTranfer,
                oldOwner.privateKey
            );
            return conn.postTransactionCommit(signedTransfer);
        })
        .then((res) => {
            console.log(res);
        });
}

// generate a mnemonic from bip39
export function createNewPassphrase() {
    return bip39.generateMnemonic()
}

// generate a ED25519 keypair using a bip39 mnemonic
export function getKeypairFromPassphrase(passphrase: string) {
    return new BigchainDB.Ed25519Keypair(bip39.mnemonicToSeedSync(passphrase).slice(0, 32));
}

// get a transaction from BigchainDB
export async function getTransaction(assetId: string) {
    return await conn.getTransaction(assetId)
}

// get all transfers for an asset from BigchainDB
export async function getTransferTransactionsForAsset(assetId: string) {
    return conn.listTransactions(assetId, TransactionOperations.TRANSFER)
}

// get all outputs for a public key
export async function getOutputs(publicKey: string, spent = false) {
    return await conn.listOutputs(publicKey, spent)
}

// search assets based on a text term
export async function searchAssets(text: string) {
    return await conn.searchAssets(text)
}

// create a new divisible asset to act as a token
// the maxAmount is defaulted to 21M (just because Satoshi decided there will be a max of 21M BTC only)
export async function createToken(keypair: KeyPair, asset: any, metadata: any, amount = 21000000) {
    let condition = BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey, true)
    let output = BigchainDB.Transaction.makeOutput(condition, amount.toString())
    output.public_keys = [keypair.publicKey]

    const transaction = BigchainDB.Transaction.makeCreateTransaction(
        asset,
        metadata, [output],
        keypair.publicKey
    )

    const txSigned = BigchainDB.Transaction.signTransaction(transaction, keypair.privateKey)
    return await conn.postTransactionCommit(txSigned)
}

// create an asset in BigchainDB
export async function createNewAsset(keypair: KeyPair, asset: any, metadata: any) {
    let condition = BigchainDB.Transaction.makeEd25519Condition(keypair.publicKey, true)
    let output = BigchainDB.Transaction.makeOutput(condition)
    output.public_keys = [keypair.publicKey]

    const transaction = BigchainDB.Transaction.makeCreateTransaction(
        asset,
        metadata,
        [output],
        keypair.publicKey
    )

    const txSigned = BigchainDB.Transaction.signTransaction(transaction, keypair.privateKey)
    return await conn.postTransactionCommit(txSigned)
}

// transfer assets in BigchainDB
export async function transferMultipleAssets(unspentTxs: any[], keypair: KeyPair, outputs: any[], metadata: any) {
    const transferOutputs = []
    const privateKeys = []
    if (outputs.length > 0) {
        for (const output of outputs) {
            let condition = BigchainDB.Transaction.makeEd25519Condition(output.publicKey)
            let transferOutput
            if (output.amount > 0) {
                transferOutput = BigchainDB.Transaction.makeOutput(condition, output.amount.toString())
            } else {
                transferOutput = BigchainDB.Transaction.makeOutput(condition)
            }

            transferOutput.public_keys = [output.publicKey]
            transferOutputs.push(transferOutput);
            privateKeys.push(keypair.privateKey);
        }
    }

    const txTransfer = BigchainDB.Transaction.makeTransferTransaction(
        unspentTxs,
        transferOutputs,
        metadata
    )

    

    const txSigned = BigchainDB.Transaction.signTransaction(txTransfer, ...privateKeys)
    return await conn.postTransactionCommit(txSigned)
}

// transfer a single asset in BigchainDB
// user transfer multiple internally
export async function transferAsset(transaction: any, keypair: KeyPair, toPublicKey: string, metadata: any) {
    const transferTxs = [{
        tx: transaction,
        output_index: 0
    }]
    const outputs = [{
        publicKey: toPublicKey,
        amount: 0
    }]

    return await transferMultipleAssets(transferTxs, keypair, outputs, metadata)
}

export async function updateMetadata(txCreatedID: string, owner: KeyPair, metadata: any) {
    return transferOwnership(txCreatedID, owner, owner.publicKey, metadata);
}

const client = new MongoClient('mongodb://localhost');
client.connect();

const db = client.db('bigchain');

export { BigchainDB, conn, db };

// ssh -i ./BigchainDB.cer -fNL 27017:localhost:27017 ubuntu@ec2-34-224-93-130.compute-1.amazonaws.com