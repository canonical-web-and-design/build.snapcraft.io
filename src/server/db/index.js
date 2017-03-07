import path from 'path';
import knex from 'knex';
import Bookshelf from 'bookshelf';

import { conf } from '../helpers/config';
import logging from '../logging';

let knexConfigPath = conf.get('KNEX_CONFIG_PATH');
if (!path.isAbsolute(knexConfigPath)) {
  knexConfigPath = path.join('../../..', knexConfigPath);
}
const knexConfig = require(knexConfigPath);

const logger = logging.getLogger('express');

let environment = process.env.NODE_ENV;
if (!environment) {
  environment = 'development';
}
const config = knexConfig[environment];
if (!config) {
  logger.error(`Unable to find knex config for ${environment}`);
  process.exit(1);
}

const connection = knex(config);
const db = new Bookshelf(connection);

export default db;
