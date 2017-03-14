import { createSelector } from 'reselect';

import { parseGitHubRepoUrl } from '../helpers/github-url';

const getSnaps = state => state.snaps;
const getSnapBuilds = state => state.snapBuilds;

// returns bool - true if there are any snaps in state
export const hasSnaps = createSelector(
  [getSnaps],
  (snaps) => snaps.snaps ? snaps.snaps.length > 0 : false
);

// returns bool - true if there are no snaps in state
export const hasNoSnaps = createSelector(
  [getSnaps],
  (snaps) => snaps.snaps ? snaps.snaps.length === 0 : true
);

// returns bool - true if there are no snaps with registered name in state
export const hasNoRegisteredNames = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? !snaps.snaps.some((snap) => {
      return snap.store_name;
    }) : true;
  }
);

// returns array - snaps that have both registered name and snapcraft data
export const snapsWithRegisteredNameAndSnapcraftData = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? snaps.snaps.filter((snap) => {
      return snap.store_name && snap.snapcraft_data;
    }) : [];
  }
);

// returns array - snaps that have registered name but no snapcraft data
export const snapsWithRegisteredNameAndNoSnapcraftData = createSelector(
  [getSnaps],
  (snaps) => {
    return snaps.snaps ? snaps.snaps.filter((snap) => {
      return snap.store_name && !snap.snapcraft_data;
    }) : [];
  }
);

// returns array - snaps with registered name and snapcraft data, but no builds
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
