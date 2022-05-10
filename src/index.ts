import './db';
import './bigchaindb';
import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { services } from './services';
import { buildSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import { randomizeFamon } from './utils/randomize';
import { conn, db, BigchainDB, createDatabaseTransaction } from './bigchaindb';
import { User } from './models';
import packContract from './utils/packContract';
import { ethers } from 'ethers';
import tokenLaunch from './utils/tokenLaunch';
import { combineTokens, getBalance, transfer } from './utils/token';
import winston from 'winston';
import expressWinston from 'express-winston';
import generateSignature from './utils/generateSignature';
const bip39 = require('bip39');

const app = express();

var schema = buildSchema(`
  type Query {
    ip: String
  }
`);

// const loggingMiddleware = (req, res, next) => {
//   console.log('ip:', req.ip);
//   next();
// }

// const root = {
//   ip: function (args, request) {
//     return request.ip;
//   }
// };

// app.use(loggingMiddleware);

// app.use(
//     '/graphql',
//     graphqlHTTP({
//         schema: schema,
//         rootValue: root,
//         graphiql: true,
//     })
// );

// transferOwnership('bd3184fff333cc17314abdcdeef8aa4a26f8b6d801d59dcf91e89ec29d0906a4',
// '53Wz7e6KzseeNfU3fYJi3LAiCBNJgmPenLJxJqxXEZwu', 'GdYXQgVfhYhfJujBaFos9dhS7gpwAVf2SYbqfrH7fUBf');

// tokenLaunch();

const seed = bip39.mnemonicToSeedSync('viadinho safado').slice(0, 32);
const tokenCreator = new BigchainDB.Ed25519Keypair(seed);

const keypair = {
    publicKey: '5mDUExnVFRGjBJLFGjWRaktNYF6jZeLnTSDk6Ce9EMhR',
    privateKey: '5iNDtnrLK81jo4HCgLdP852h3hqM7kBdT59Sw7KQvXGW',
};

// transfer(keypair,
//   '4eD7aqJJVLXAo4tpBriyRK5jQgn8Xucx2csFrHSGA1MW',
//   'ffa831ad0dbda42b00b1551b1e6c27d884a728728da4400dbfa726b927999e6d',
//   '3700000000').then(res => console.log(res)).catch(err => console.log(err));

// combineTokens(keypair, 'ffa831ad0dbda42b00b1551b1e6c27d884a728728da4400dbfa726b927999e6d').then(res => console.log(res)).catch(err => console.log(err));

getBalance('H3wwP7CEWtfNSG6b6mMPHKsy9kBPTCHBCk6zwKy9vmqV', 'ffa831ad0dbda42b00b1551b1e6c27d884a728728da4400dbfa726b927999e6d').then(res => console.log(res));
getBalance('4eD7aqJJVLXAo4tpBriyRK5jQgn8Xucx2csFrHSGA1MW', 'ffa831ad0dbda42b00b1551b1e6c27d884a728728da4400dbfa726b927999e6d').then(res => console.log(res));
getBalance('5mDUExnVFRGjBJLFGjWRaktNYF6jZeLnTSDk6Ce9EMhR', 'ffa831ad0dbda42b00b1551b1e6c27d884a728728da4400dbfa726b927999e6d').then(res => console.log('5mDUExnVFRGjBJLFGjWRaktNYF6jZeLnTSDk6Ce9EMhR', res));

// Middlewares
// app.use(
//     expressWinston.logger({
//         transports: [new winston.transports.Console()],
//         format: winston.format.combine(
//             winston.format.colorize(),
//             winston.format.json()
//         ),
//         meta: true, // optional: control whether you want to log the meta data about the request (default to true)
//         msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
//         expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
//         colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
//         ignoreRoute: function (req, res) {
//             return false;
//         }, // optional: allows to skip some log messages based on request and/or response
//     })
// );
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8000;

// Mount REST on /api
app.use('/api', services);

app.listen(port, () => {
    console.info(`Node.js app is listening at http://localhost:${port}`);
});

// generateSignature();
