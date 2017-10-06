import 'babel-polyfill';

import { pollRepositories } from '../server/scripts/poller';


// Hack around knex hanging on DB connection forever.
// See https://github.com/tgriesser/knex/issues/293
const exitWhenDone = async () => {
  try {
    await pollRepositories();
  } catch (e) {
    process.exit(1);
  }
  process.exit();
};
exitWhenDone();
