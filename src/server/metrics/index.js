import db from '../db';
import updateBuildAnnotationTotal from './build-annotation';
import updateDeveloperUptake from './developer-uptake';
import updateGitHubUsersTotal from './github-users';

let existingInterval = null;

function updateAllMetrics() {
  return db.transaction(async (trx) => {
    await updateGitHubUsersTotal(trx);
    await updateDeveloperUptake(trx);
    await updateBuildAnnotationTotal(trx);
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
