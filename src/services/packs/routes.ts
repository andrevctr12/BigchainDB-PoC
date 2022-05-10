import express from 'express';
import jwt from 'express-jwt';

import { config } from '../../config';
import * as controller from './controller';

export const packRouter = express.Router();

/** GET /api/packs */
packRouter.route('/').get(controller.find);

/** GET /api/packs/price */
/** Authenticated route */
packRouter.route('/price').get(jwt(config), controller.getPrice);

/** GET /api/packs/ */
/** Authenticated route */
packRouter.route('/sold').get(jwt(config), controller.getSoldCount);

/** POST /api/packs */
packRouter.route('/').post(jwt(config), controller.openPack);

/** PATCH /api/packs/:userId */
/** Authenticated route */
packRouter.route('/:userId').patch(jwt(config), controller.patch);
