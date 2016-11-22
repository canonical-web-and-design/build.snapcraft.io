function clearRequireCache(test, cache) {
  Object.keys(cache).forEach(function(id) {
    if (test.test(id)) {
      delete require.cache[id];
    }
  });
}

export { clearRequireCache };
