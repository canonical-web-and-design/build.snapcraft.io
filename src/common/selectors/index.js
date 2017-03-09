import { createSelector } from 'reselect'

const getSnaps = state => state.snaps;
const getNames = state => state.registerName;

export const hasNoRegisteredNames = createSelector(
  [getSnaps, getNames],
  (snaps, names) => {
    return !snaps.snaps.some((snap) => {
      return snap.store_name;
    });
  }
);
