import { createSelector } from 'reselect'

import { parseGitHubRepoUrl } from '../helpers/github-url.js';

const getSnaps = state => state.snaps;
const getNames = state => state.registerName;

export const hasNamedSnaps = createSelector(
  [getSnaps, getNames],
  (snaps, names) => {
    return snaps.snaps.some((snap) => {
      if (typeof(snap.store_name) === 'string') return true;

      const { fullName } = parseGitHubRepoUrl(snap.git_repository_url);
      const registerNameStatus = names[fullName] || {};

      return !!registerNameStatus.success;
    });
  }
);
