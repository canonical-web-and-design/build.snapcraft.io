
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('repository', function(table) {
      table.dropColumn('polled_at');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('repository', function(table) {
      table.dateTime('polled_at');
    })
  ]);
};
