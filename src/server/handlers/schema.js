import { schema } from 'normalizr';

export const owner = new schema.Entity('owners');
// XXX repository or repo?
export const repo = new schema.Entity('repos', {
  owner: owner
});
export const repoList = new schema.Array(repo);

export const snap = new schema.Entity('snaps', {}, {
  idAttribute: 'name'
});
export const snapList = new schema.Array(snap);
