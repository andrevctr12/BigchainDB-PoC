import { NextFunction, Request, Response } from 'express';
import { BigNumber, ethers, utils } from 'ethers';

import { User } from '../../models/user.model';
import {
    conn,
    createDatabaseTransaction,
    db,
    updateMetadata,
} from '../../bigchaindb';
import { Transaction } from 'sequelize/types';
import { randomizeFamon } from '../../utils/randomize';
import getNextSequence from '../../utils/getNextSequence';
import packContract from '../../utils/packContract';
import provider from '../../utils/provider';
import { EventFragment } from 'ethers/lib/utils';

export const find = (req: Request, res: Response, next: NextFunction) => {
    // If a query string ?publicAddress=... is given, then filter results
    const publicAddress = req.query.publicAddress;
    const whereClause =
        req.query && req.query.publicAddress
            ? {
                  where: {
                      publicAddress: publicAddress?.toString().toLowerCase(),
                  },
              }
            : undefined;

    return User.findAll(whereClause)
        .then((users: User[]) => res.json(users))
        .catch(next);
};

export const getSoldCount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const count = await db
            .collection('assets')
            .countDocuments({ 'data.ns': 'PRISMA' });
        res.status(200).send({ count });
    } catch (err) {
        next(err);
    }
};

export const getPrice = (req: Request, res: Response, next: NextFunction) => {
    return User.findByPk((req as any).user.payload.id)
        .then((user: User | null) => {
            if (user) {
                res.status(200).send({ price: '0.002' });
            }
        })
        .catch(next);
};

export const openPack = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const transaction = req.body.transaction;
    
    try {
        const user = await User.findByPk((req as any).user.payload.id);
        let quantity = req.body.quantity;

        if (!quantity) {
            quantity = '1';
        }

        const qtd = parseInt(quantity?.toString(), 10);
        
        if (user) {
            const tx = await provider.getTransaction(transaction);
            const keypair = {
                privateKey: user.privateKey,
                publicKey: user.publicKey,
            };
            const txTransaction = await createDatabaseTransaction(
                keypair,
                { ns: 'TRANSACTION', transaction, quantity: qtd },
                { status: 'pending' }
            );

            const price: BigNumber = await packContract.price();
            const priceQtd = price.mul(qtd);
            if (tx.value.eq(priceQtd)) {
                const rec = await tx.wait();
                let firstId = parseInt(rec.logs[0].data, 16);
                if (rec && rec.status === 1) {
                    for (let i = 0; i < qtd; i++) {
                        console.log('Minting Prisma [', firstId,']:', user.publicAddress);
                        const rFamon = randomizeFamon();
                        console.log(rFamon);
                        const datetime_created = Date.now();
                        const prisma = {
                            ns: 'PRISMA',
                            id: firstId,
                            rarity: 1,
                            datetime_created,
                        };
                        const metadata = {
                            ns: 'FAMON',
                            id: firstId,
                            energy: 10,
                            ...rFamon,
                        };
                        await createDatabaseTransaction(keypair, prisma, metadata);
                        firstId++;
                    }
                    res.status(200).send({ msg: 'Check your inventary' });
                    await updateMetadata(txTransaction.id, keypair, { status: 'successful' });
                }
            } else {
                await updateMetadata(txTransaction.id, keypair, { status: 'insufficient funds' });
            }
        } else {
            res.status(401).send({
                error: `User is not able to perform this action`,
            });
        }
    } catch (e) {
        console.log('[ERROR]:', e);
        next(e);
    }

    // return User.findByPk((req as any).user.payload.id)
    //     .then((user: User | null) => {
    //         if (user) {
    //             provider.getTransaction(transaction).then((tx) => {
    //                 const keypair = {
    //                     privateKey: user.privateKey,
    //                     publicKey: user.publicKey,
    //                 };
    //                 createDatabaseTransaction(
    //                     keypair,
    //                     { ns: 'TRANSACTION', transaction },
    //                     { }
    //                 ).catch((error: any) => {
    //                     console.log('[ERROR]:', error);
    //                 });
    //                 if (tx.value.eq(utils.parseEther('0.002'))) {
    //                     tx.wait()
    //                         .then((rec) => {
    //                             if (rec && rec.status === 1) {
    //                                 console.log(
    //                                     'Minting Prisma:',
    //                                     user.publicAddress
    //                                 );
    //                                 const rFamon = randomizeFamon();
    //                                 console.log(rFamon);
    //                                 const datetime_created = Date.now();
    //                                 const prisma = {
    //                                     ns: 'PRISMA',
    //                                     id: getNextSequence('prisma_id'),
    //                                     rarity: 1,
    //                                     datetime_created,
    //                                 };
    //                                 const metadata = { ns: 'FAMON', id: getNextSequence('famon_id'), energy: 10, ...rFamon };
    //                                 createDatabaseTransaction(
    //                                     keypair,
    //                                     prisma,
    //                                     metadata
    //                                 )
    //                                     .then(() => {
    //                                         res.status(200).send({ msg: 'Check your inventary' });
    //                                     })
    //                                     .catch((error: any) => {
    //                                         console.log('[ERROR]:', error);
    //                                     });
    //                             }
    //                         })
    //                         .catch((error: any) => {
    //                             console.log('[ERROR]:', error);
    //                         });
    //                 }
    //             });
};

export const patch = (req: Request, res: Response, next: NextFunction) => {
    // Only allow to fetch current user
    if ((req as any).user.payload.id !== +req.params.userId) {
        return res.status(401).send({ error: 'You can only access yourself' });
    }
    return User.findByPk(req.params.userId)
        .then((user: User | null) => {
            if (!user) {
                return user;
            }

            Object.assign(user, req.body);
            return user.save();
        })
        .then((user: User | null) => {
            return user
                ? res.json(user)
                : res.status(401).send({
                      error: `User with publicAddress ${req.params.userId} is not found in database`,
                  });
        })
        .catch(next);
};
