exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('repository', function(table) {
      table.increments();
      table.text('owner').notNullable();
      table.text('name').notNullable();
      table.text('snapcraft_name');
      table.text('store_name');
      table.integer('registrant_id').references('github_user.id');
      table.timestamps();
      table.unique(['owner', 'name']);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('repository')
  ]);
};
