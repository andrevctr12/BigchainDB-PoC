import { NextFunction, Request, Response } from 'express';

import { User } from '../../models/user.model';
import { BigchainDB } from '../../bigchaindb';
import { getBalance } from '../../utils/token';

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

// export const get = (req: Request, res: Response, next: NextFunction) => {
//     // AccessToken payload is in req.user.payload, especially its `id` field
//     // UserId is the param in /users/:userId
//     // We only allow user accessing herself, i.e. require payload.id==userId
//     if ((req as any).user.payload.id !== +req.params.userId) {
//         return res
//             .status(401)
//             .send({ error: 'You can only access yourself aaa' });
//     }
//     return User.findByPk(req.params.userId)
//         .then((user: User | null) => {
//             const ret = {
//                 ...user,
//                 tokenBalance: getBalance(user?.publicKey, process.env.TOKEN_ID),
//             }
//             return res.json(ret);
//         })
//         .catch(next);
// };

export const getTokenBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findByPk((req as any).user.payload.id);
        console.log(process.env.TOKEN_ID)
        const token = await getBalance(user?.publicKey, process.env.TOKEN_ID);
        return res.json(token?.amount);
    }
    catch (err: any) {
        next(err);
        return res.status(404).send(err.message);
    }
};

export const create = (req: Request, res: Response, next: NextFunction) => {
	const keypair = new BigchainDB.Ed25519Keypair();
    const body = {
        ...req.body,
		publicAddress: req.body.publicAddress.toLowerCase(),
		publicKey: keypair.publicKey,
		privateKey: keypair.privateKey,
    };
    User.create(body)
        .then((user: User) => res.json(user))
        .catch(next);
};

export const patch = (req: Request, res: Response, next: NextFunction) => {
    // Only allow to fetch current user
    if ((req as any).user.payload.id !== +req.params.userId) {
        return res
            .status(401)
            .send({ error: 'You can only access yourself' });
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
