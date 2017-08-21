import 'babel-polyfill';

import { pollRepositories } from '../server/scripts/poller';

const p = pollRepositories();

// Hack around knex hanging on DB connection forever.
// See https://github.com/tgriesser/knex/issues/293
p.then((lock) => {
  const checkLock = () => {
    if (!lock.isBusy()) { process.exit(); }
    setTimeout(checkLock, 1000);
  };
  setTimeout(checkLock, 1000);
});
