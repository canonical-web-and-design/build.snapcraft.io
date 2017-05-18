import { schema } from 'normalizr';

export const owner = new schema.Entity('owners');

export const repo = new schema.Entity('repos', {
  owner: owner
}, {
  processStrategy: (entity) => {
    return {
      id: entity.id,
      fullName: entity.full_name,
      name: entity.name,
      owner: entity.owner,
      url: entity.html_url,
      isAdmin: entity.permissions && entity.permissions.admin
    };
  }
});
export const repoList = new schema.Array(repo);

export const snap = new schema.Entity('snaps', {}, {
  idAttribute: 'git_repository_url',
  processStrategy: (entity) => {
    return {
      id: entity.git_repository_url,
      gitRepoUrl: entity.git_repository_url,
      selfLink: entity.self_link,
      snapcraftData: entity.snapcraft_data,
      storeName: entity.store_name
    };
  }
});
export const snapList = new schema.Array(snap);
