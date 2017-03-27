import db from '../db';
import updateGitHubUsersTotal from './github-users';
import updateDeveloperUptake from './developer-uptake';

let existingInterval = null;

function updateAllMetrics() {
  return db.transaction(async (trx) => {
    await updateGitHubUsersTotal(trx);
    await updateDeveloperUptake(trx);
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
