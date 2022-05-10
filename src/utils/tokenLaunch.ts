import { BigchainDB, conn, createToken } from '../bigchaindb';
const bip39 = require('bip39');

const nTokens = 1000000000000000; // gwei

export default function tokenLaunch() {
    const seed = bip39.mnemonicToSeedSync('viadinho safado').slice(0, 32);
    const tokenCreator = new BigchainDB.Ed25519Keypair(seed);

    console.log('Please, save both keys in a safe place:');
    console.log('Public Key: ', tokenCreator.publicKey);
    console.log('Private Key: ', tokenCreator.privateKey);

    const tokenAsset = {
        namespace: 'test',
        symbol: 'TEST',
        number_tokens: nTokens, // gwei
        type: 'token',
        timestamp: Date.now(),
    };

    const metadata = {
        date: new Date(),
    };

    createToken(tokenCreator, tokenAsset, metadata, nTokens).then((res) => {
        console.log('token launched: ', res.id);
    });
}
