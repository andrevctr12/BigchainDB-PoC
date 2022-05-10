import { NextFunction, Request, Response } from 'express';
import { ethers, utils } from 'ethers';

import { User } from '../../models/user.model';
import { conn, createDatabaseTransaction, db } from '../../bigchaindb';
import { Transaction } from 'sequelize/types';
import { randomizeFamon } from '../../utils/randomize';

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
            .countDocuments({ 'data.ns': 'fevian.prisma' });
        res.status(200).send({ count });
    } catch (err) {
        next(err);
    }
};

// export const get = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const user = await User.findByPk((req as any).user.payload.id);
//         if (user) {
//             db.collection('transactions').aggregate([
//                 {
//                     '$match': {
//                         'operation': 'CREATE',
//                         'outputs.public_keys': user.publicKey
//                     }
//                 }, {
//                     '$lookup': {
//                         'from': 'assets',
//                         'localField': 'id',
//                         'foreignField': 'id',
//                         'as': 'asset'
//                     }
//                 }, {
//                     '$match': {
//                         'asset.data.ns': 'fevian.prisma'
//                     }
//                 }, {
//                     '$lookup': {
//                         'from': 'metadata',
//                         'localField': 'id',
//                         'foreignField': 'id',
//                         'as': 'metadata'
//                     }
//                 }, {
//                     '$lookup': {
//                       'from': 'metadata',
//                       'localField': 'metadata.metadata.famon_id',
//                       'foreignField': 'id',
//                       'as': 'famon'
//                     }
//                 },
//             ]).toArray().then(prismas => {
//                 let p:any = [];
//                 prismas?.map(prisma => p.push(prisma?.famon?.[0]?.metadata))
//                 res.status(200).send({ prismas: p })
//             });
//         } else {
//             res.status(401);
//         }
//     } catch (err) {
//         next(err);
//     }
// };

export const get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findByPk((req as any).user.payload.id);
        if (user) {
            const outputs = await conn.listOutputs(
                user.publicKey,
                false
            );
            const transaction_ids = outputs.map(
                (output) => output.transaction_id
            );
            const prismas = await db
                .collection('transactions')
                .aggregate([
                    {
                        $match: {
                            id: {
                                $in: transaction_ids,
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'assets',
                            let: {
                                asset_id: '$asset.id',
                                id: '$id',
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $or: [
                                            {
                                                $expr: {
                                                    $eq: ['$id', '$$id'],
                                                },
                                            },
                                            {
                                                $expr: {
                                                    $eq: ['$id', '$$asset_id'],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                            as: 'asset',
                        },
                    },
                    {
                        $match: {
                            'asset.data.ns': 'PRISMA',
                        },
                    },
                    {
                        $unwind: {
                            path: '$asset',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: 'metadata',
                            localField: 'id',
                            foreignField: 'id',
                            as: 'metadata',
                        },
                    },
                    {
                        $unwind: {
                            path: '$metadata',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $addFields: {
                            asset: '$asset.data',
                        },
                    },
                    {
                        $addFields: {
                            'asset.famon': '$metadata.metadata',
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: '$asset',
                        },
                    },
                ])
                .toArray();

            res.status(200).send({ prismas });
        } else {
            res.status(401);
        }
    } catch (err) {
        next(err);
    }
};

export const getAlgo = (req: Request, res: Response, next: NextFunction) => {
    return User.findByPk((req as any).user.payload.id)
        .then((user: User | null) => {
            if (user) {
                res.status(200).send({ price: '0.002' });
            }
        })
        .catch(next);
};
