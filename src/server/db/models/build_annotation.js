export default function register(db) {
  /* Schema:
   *   build_id: Launchpad build ID (unique)
   *   reason: reason why the build was triggered
   *   request: associated build request
   */
  db.model('BuildAnnotation', {
    tableName: 'build_annotation',
    idAttribute: 'build_id',
    request: function() {
      return this.belongsTo('BuildRequestAnnotation', 'request_id');
    },
    hasTimestamps: true
  });
}
