export function hasRepository(arr, repository) {
  return arr.some((item) => item.fullName === repository.fullName);
}
