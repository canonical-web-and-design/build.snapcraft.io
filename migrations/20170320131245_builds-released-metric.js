exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.integer('builds_released');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.dropColumn('builds_released');
    })
  ]);
};
