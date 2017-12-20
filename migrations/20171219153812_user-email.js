exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.text('email');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('github_user', function(table) {
      table.dropColumn('email');
    })
  ]);
};
