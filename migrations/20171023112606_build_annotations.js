
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('build_annotation', function(table) {
      table.integer('build_id').notNullable();
      table.text('reason');
      table.timestamps();
      table.primary('build_id');
    })
  ]);  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('build_annotation')
  ]);
};
