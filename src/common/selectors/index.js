import { createSelector } from 'reselect';

import { parseGitHubRepoUrl } from '../helpers/github-url';

const getSnaps = state => state.snaps;
const getSnapBuilds = state => state.snapBuilds;
const getRepositoriesStatus = state => state.repositoriesStatus;

/**
 * @returns {Boolean} true if there are any snaps in state
 */
export const hasSnaps = createSelector(
  [getSnaps],
  (snaps) => snaps.snaps ? snaps.snaps.length > 0 : false
);

/**
 * @returns {Boolean} true if there are no snaps in state
 */
export const hasNoSnaps = createSelector(
  [getSnaps],
  (snaps) => snaps.snaps ? snaps.snaps.length === 0 : true
);

/**
 * @returns {Boolean} true if there are no snaps with registered names in state
 */
export const hasNoRegisteredNames = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? !snaps.snaps.some((snap) => {
      return snap.store_name;
    }) : true;
  }
);

/**
 * @returns {Boolean} true if there are no configured snaps
 */
export const hasNoConfiguredSnaps = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? !snaps.snaps.some((snap) => {
      return snap.snapcraft_data;
    }) : true;
  }
);

/**
 * @returns {Array} snaps that have both registered name and snapcraft data
 */
export const snapsWithRegisteredNameAndSnapcraftData = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? snaps.snaps.filter((snap) => {
      return snap.store_name && snap.snapcraft_data;
    }) : [];
  }
);

/**
 * @returns {Array} snaps that have registered name but no snapcraft data
 */
export const snapsWithRegisteredNameAndNoSnapcraftData = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? snaps.snaps.filter((snap) => {
      return snap.store_name && !snap.snapcraft_data;
    }) : [];
  }
);

/**
 * @returns {Array} snaps with registered name and snapcraft data, but no builds
 */
export const snapsWithNoBuilds = createSelector(
  [snapsWithRegisteredNameAndSnapcraftData, getSnapBuilds],
  (snaps, snapBuilds) => {
    return snaps && snaps.filter((snap) => {
      const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);
      const repoBuilds = snapBuilds[fullName];

      if (repoBuilds && repoBuilds.success) {
        // if builds for given repo were fetched but there aren't any builds yet
        return repoBuilds.builds.length === 0;
      }
      return false;
    });
  }
);

/**
 * @returns {Boolean} true if any snap create request is still fetching
 */
export const isAddingSnaps = createSelector(
  [getRepositoriesStatus],
  (repositoriesStatus) => {
    const ids = Object.keys(repositoriesStatus);
    return !!(ids.length && ids.some((id) => repositoriesStatus[id].isFetching));
  }
);
