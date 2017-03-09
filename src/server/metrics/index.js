import updateGitHubUsersTotal from './github-users';

let existingInterval = null;

async function updateAllMetrics() {
  await updateGitHubUsersTotal();
}

export default async function startAllMetrics() {
  if (existingInterval !== null) {
    clearInterval(existingInterval);
  }

  await updateAllMetrics();
  existingInterval = setInterval(updateAllMetrics, 10000);
  return existingInterval;
}
