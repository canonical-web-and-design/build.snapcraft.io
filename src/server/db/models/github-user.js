export default function register(db) {
  /* Schema:
   *   id: automatic serial number
   *   github_id: ID from GitHub
   *   name: display name from GitHub
   *   login: login name from GitHub
   *   created_at: creation date
   *   updated_at: update date
   *   last_login_at: last login date
   *   snaps_added: number of snaps added
   *   snaps_removed: number of snaps removed
   *   names_registered: number of snap names registered
   *   builds_requested: number of snap builds requested
   *   builds_released: number of snap builds released to a store channel
   *   repositories: all repositories created by this user
   */
  db.model('GitHubUser', {
    tableName: 'github_user',
    repositories: function() {
      return this.hasMany('Repository', 'registrant_id');
    },
    hasTimestamps: true
  }, {
    // Increment a metric for a user.  Where possible, this should be called
    // at the *start* of a transaction spanning any external API calls that
    // are tracked by the metric in question: this means that either a
    // failure to increment the metric or a failure in the external API call
    // will cause both to be rolled back.
    incrementMetric: async (query, metricName, delta, options) => {
      let row;
      if (query instanceof db.Model) {
        row = query;
      } else {
        row = await db.model('GitHubUser').where(query).fetch(options);
      }
      if (row) {
        const value = row.get(metricName);
        // Metrics may often require non-trivial initialization, for example
        // when a metric is introduced to the site after the feature that
        // it's measuring.  To cope with this, only increment a metric if it
        // has already been initialized.
        if (value !== undefined && value !== null) {
          await row.save({ [metricName]: value + delta }, options);
        }
      }
      return row;
    }
  });
}
