export function hasRepository(arr, repository) {
  return arr.filter((item) => {
    return (item.fullName === repository.fullName);
  }).length > 0;
}
