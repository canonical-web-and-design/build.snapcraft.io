import { createSelector } from 'reselect';

const getSnaps = state => state.snaps;

export const hasNoRegisteredNames = createSelector(
  [getSnaps],
  (snaps) => {
    return !snaps.snaps.some((snap) => {
      return snap.store_name;
    });
  }
);
