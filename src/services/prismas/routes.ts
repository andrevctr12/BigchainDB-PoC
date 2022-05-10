import express from 'express';
import jwt from 'express-jwt';

import { config } from '../../config';
import * as controller from './controller';

export const prismaRouter = express.Router();

/** GET /api/packs/ */
/** Authenticated route */
prismaRouter.route('/').get(jwt(config), controller.get);
