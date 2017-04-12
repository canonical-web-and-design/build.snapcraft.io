import { createSelector } from 'reselect';
import pick from 'lodash/pick';

import { parseGitHubRepoUrl } from '../helpers/github-url';

const getRepositoriesIndex = state => state.repositories.ids;
const getRepositories = state => state.entities.repos;
const getRepositoryOwners = state => state.entities.owners;
const getSnapsIndex = state => state.snaps.ids;
const getSnaps = state => state.entities.snaps;
const getSnapBuilds = state => state.snapBuilds;

/**
 * @returns {Boolean} true if there are any snaps in state
 */
export const hasSnaps = createSelector(
  [getSnapsIndex],
  (ids) => ids.length > 0
);

/**
 * @returns {Boolean} true if there are no snaps in state
 */
export const hasNoSnaps = createSelector(
  [getSnapsIndex],
  (ids) => ids.length === 0
);

/**
 * @returns {Boolean} true if there are no snaps with registered names in state
 */
export const hasNoRegisteredNames = createSelector(
  [getSnapsIndex, getSnaps],
  (ids, snaps) => {
    return !ids.some((id) => snaps[id].store_name);
  }
);

/**
 * @returns {Boolean} true if there are no configured snaps
 */
export const hasNoConfiguredSnaps = createSelector(
  [getSnapsIndex, getSnaps],
  (ids, snaps) => {
    return !ids.some((id) => snaps[id].snapcraft_data);
  }
);

/**
 * @returns {Boolean} true if snaps were successfully fetched
 *
 * TODO: don't rely on success? but if not on that then on what?
 */
export const hasLoadedSnaps = (state) => state.snaps.success;

/**
 * TODO merge with reposToAdd?
 * @returns {Array} get selected repositories
 */
export const getSelectedRepositories = createSelector(
  [getRepositoriesIndex, getRepositories],
  (repos, entities) => {
    return repos.filter((id) => {
      return entities[id].isSelected;
    });
  }
);

/**
 * @returns {Array} get repositories selected to build
 */
export const getReposToAdd = createSelector(
  [getSelectedRepositories, getRepositories, getRepositoryOwners],
  (index, repositories, owners) => {
    return index.map((id) => {
      // XXX structuredSelector here?
      const repository = repositories[id];
      return {
        id,
        name: repository.name,
        owner: owners[repository.owner].login,
        url: repository.url
      };
    });
  }
);

/**
 * @returns {Boolean} true if there github repositories in a failed state after
 * submitting for build to launchpad
 */
export const hasFailedRepositories = createSelector(
  [getSelectedRepositories, getRepositories],
  (index, repositories) => {
    return index.some((id) => {
      const repository = repositories[id];
      return repository.error;
    });
  }
);

/**
 * @returns {Array} get repositories already enabled as builds
 * @todo consider case for multiple snapcraft.yaml's per git_repository_url
 */
export const getEnabledRepositories = createSelector(
  [getRepositories, getRepositoriesIndex, getSnaps, getSnapsIndex],
  (repositories, repositoriesIndex, snaps, snapIndex) => {
    return pick(repositories, repositoriesIndex.filter((repositoryId) => {
      return snapIndex.some((snapId) => {
        return snapId === repositories[repositoryId].url;
      });
    }));
  }
);

/**
 * @returns {Array} snaps that have both registered name and snapcraft data
 */
export const snapsWithRegisteredNameAndSnapcraftData = createSelector(
  [getSnapsIndex, getSnaps],
  (ids, snaps) => {
    return ids.map((id) => snaps[id]).filter((snap) => {
      return snap.store_name && snap.snapcraft_data;
    });
  }
);

/**
 * @returns {Array} snaps that have registered name but no snapcraft data
 */
export const snapsWithRegisteredNameAndNoSnapcraftData = createSelector(
  [getSnapsIndex, getSnaps],
  (ids, snaps) => {
    return ids.map((id) => snaps[id]).filter((snap) => {
      return snap.store_name && !snap.snapcraft_data;
    });
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
  [getRepositoriesIndex, getRepositories],
  (repositoriesIndex, repositories) => {
    return !!(repositoriesIndex.length && repositoriesIndex.some((id) => repositories[id].isFetching));
  }
);
