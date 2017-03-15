exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('github_user', function(table) {
      // The GitHub ID would do as a primary key, but this approach works
      // better with Bookshelf's `Model.isNew` method.
      table.increments();
      table.integer('github_id').notNullable();
      table.text('name');
      table.text('login').notNullable();
      table.timestamps();
      table.timestamp('last_login_at').notNullable();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('github_user')
  ]);
};
