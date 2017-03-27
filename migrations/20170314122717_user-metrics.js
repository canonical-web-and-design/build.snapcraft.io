exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.index(['login']);
      table.integer('snaps_added');
      table.integer('snaps_removed');
      table.integer('names_registered');
      table.integer('builds_requested');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.dropIndex(['login']);
      // Should use `table.dropColumns`, but see:
      //   https://github.com/tgriesser/knex/issues/1979
      table.dropColumn('builds_requested');
      table.dropColumn('names_registered');
      table.dropColumn('snaps_removed');
      table.dropColumn('snaps_added');
    })
  ]);
};
