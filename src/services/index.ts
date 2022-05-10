import express from 'express';

import { authRouter } from './auth';
import { packRouter } from './packs';
import { userRouter } from './users';
import { prismaRouter } from './prismas';

export const services = express.Router();

services.use('/auth', authRouter);
services.use('/users', userRouter);
services.use('/packs', packRouter);
services.use('/prismas', prismaRouter);