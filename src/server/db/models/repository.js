// Ensure that GitHubUser model is registered; we do not need to import any
// bindings.
import './github-user';

export default function register(db) {
  /* Schema:
   *   id: automatic serial number
   *   owner: repository owner name
   *   name: repository name
   *   snapcraft_name: name in snapcraft.yaml
   *   store_name: registered store name corresponding to this repository
   *   registrant: GitHub user who registered this repository in BSI
   *   created_at: creation datetime
   *   updated_at: update datetime
   */
  db.model('Repository', {
    tableName: 'repository',
    registrant: function() {
      return this.belongsTo('GitHubUser', 'registrant_id');
    },
    hasTimestamps: true
  }, {
    // Add or update a repository row with the given information.
    // `query` must be either a Repository model instance or { owner, name }.
    addOrUpdate: async (query, columns, options) => {
      let row;
      if (query instanceof db.Model) {
        row = query;
      } else {
        row = await db.model('Repository').where(query).fetch(options);
      }
      if (row === null) {
        row = db.model('Repository').forge(query);
      }
      const setColumns = Object.assign({}, columns);
      if (setColumns.registrant) {
        setColumns.registrant_id = setColumns.registrant.get('id');
      }
      delete setColumns.registrant;
      row.set(setColumns);
      if (row.hasChanged()) {
        await row.save({}, options);
      }
      return row;
    }
  });
}
