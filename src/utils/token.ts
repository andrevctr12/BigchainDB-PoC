import { utils } from 'ethers';
import * as bdb from '../bigchaindb';

// transfers an specified amount of tokens to a public key
export async function transfer(
    keypair: bdb.KeyPair,
    toPublicKey: string,
    tokenId: string,
    amount: string,
    reason: any = {}
) {
    const balances = [];
    const outputs = [];
    let cummulativeAmount = 0;
    let sufficientFunds = false;

    const trAmount = parseInt(amount);
    const unspents = await bdb.getOutputs(keypair.publicKey, false);

    if (unspents && unspents.length > 0) {
        for (const unspent of unspents) {
            const tx = await bdb.getTransaction(unspent.transaction_id);
            let assetId;
            if (tx.operation === 'CREATE') {
                assetId = tx.id;
            } else if (tx.operation === 'TRANSFER') {
                // @ts-ignore
                assetId = tx.asset.id;
            }

            if (assetId === tokenId) {
                const txAmount = parseInt(
                    tx.outputs[unspent.output_index].amount
                );
                cummulativeAmount += txAmount;

                balances.push({
                    tx: tx,
                    output_index: unspent.output_index,
                });
            }

            if (cummulativeAmount >= trAmount) {
                sufficientFunds = true;
                break;
            }
        }

        if (!sufficientFunds) {
            throw new Error('Transfer failed. Not enough token balance!');
        }

        outputs.push({
            publicKey: toPublicKey,
            amount: trAmount,
        });

        if (cummulativeAmount - trAmount > 0) {
            outputs.push({
                publicKey: keypair.publicKey,
                amount: cummulativeAmount - trAmount,
            });
        }

        const metadata = {
            date: new Date(),
            ...reason,
        };

        return await bdb.transferMultipleAssets(
            balances,
            keypair,
            outputs,
            metadata
        );
    }

    throw new Error('Token transfer failed.');
}

// gets the token balance for a particular token (asset)
export async function getBalance(publicKey: string | undefined, tokenId: string | undefined) {
    if (publicKey) {
        const unspents = await bdb.getOutputs(publicKey, false);
        let cummulativeAmount = 0;
        let ownsTokens = false;
        if (unspents && unspents.length > 0) {
            for (const unspent of unspents) {
                const tx = await bdb.getTransaction(unspent.transaction_id);
                let assetId;
                if (tx.operation === 'CREATE') {
                    assetId = tx.id;
                } else if (tx.operation === 'TRANSFER') {
                    // @ts-ignore
                    assetId = tx.asset.id;
                }

                if (assetId === tokenId) {
                    ownsTokens = true;
                    const txAmount = parseInt(
                        tx.outputs[unspent.output_index].amount
                    );
                    cummulativeAmount += txAmount;
                }
            }

            if (ownsTokens) {
                return {
                    token: tokenId,
                    amount: utils.parseUnits(cummulativeAmount.toString(), 'gwei'),
                };
            } else {
                throw new Error('Token not found in user wallet');
            }
        }
    }
    else {
        throw new Error('User wallet not valid');
    }
}

export async function combineTokens(keypair: bdb.KeyPair, tokenId: string) {
    const balances = [];
    let cummulativeAmount = 0;
    const unspents = await bdb.getOutputs(keypair.publicKey, false);

    if (unspents && unspents.length > 0) {
        for (const unspent of unspents) {
            const tx = await bdb.getTransaction(unspent.transaction_id);
            let assetId;

            if (tx.operation === 'CREATE') {
                assetId = tx.id;
            } else if (tx.operation === 'TRANSFER') {
                // @ts-ignore
                assetId = tx.asset.id;
            }

            if (assetId === tokenId) {
                const txAmount = parseInt(
                    tx.outputs[unspent.output_index].amount
                );
                cummulativeAmount += txAmount;

                balances.push({
                    tx: tx,
                    output_index: unspent.output_index,
                });
            }
        }
    }

    const outputs = [
        {
            publicKey: keypair.publicKey,
            amount: cummulativeAmount,
        },
    ];

    return await bdb.transferMultipleAssets(balances, keypair, outputs, {
        date: new Date(),
        timestamp: Date.now(),
    });
}
