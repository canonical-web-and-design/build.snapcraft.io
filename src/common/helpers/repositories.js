export function hasRepository(arr, repository) {
  return arr.some((item) => item.fullName === repository.fullName);
}

export function hasSnapForRepository(snaps, repository) {
  return snaps.some((snap) => snap.git_repository_url === repository.url);
}
