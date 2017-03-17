import db from '../db';
import updateGitHubUsersTotal from './github-users';

let existingInterval = null;

function updateAllMetrics() {
  return db.transaction(async (trx) => {
    await updateGitHubUsersTotal(trx);
  });
}

export default async function startAllMetrics() {
  if (existingInterval !== null) {
    clearInterval(existingInterval);
  }

  await updateAllMetrics();
  existingInterval = setInterval(updateAllMetrics, 10000);
  return existingInterval;
}
