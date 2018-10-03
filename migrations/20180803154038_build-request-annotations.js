exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('build_request_annotation', function(table) {
      table.integer('request_id').notNullable();
      table.text('reason');
      table.timestamps();
      table.primary('request_id');
    }).table('build_annotation', function(table) {
      table.integer('request_id')
        .references('build_request_annotation.request_id');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('build_annotation', function(table) {
      table.dropColumn('request_id');
    }).dropTable('build_request_annotation')
  ]);
};
