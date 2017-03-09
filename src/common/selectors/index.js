import { createSelector } from 'reselect'

import { parseGitHubRepoUrl } from '../helpers/github-url.js';

const getSnaps = state => state.snaps;
const getNames = state => state.registerName;

export const hasNamedSnaps = createSelector(
  [getSnaps, getNames],
  (snaps, names) => {
    return snaps.snaps.some((snap) => {
      return typeof(snap.store_name) === 'string';
    });
  }
);
