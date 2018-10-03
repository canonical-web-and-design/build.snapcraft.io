export default function register(db) {
  /* Schema:
   *   request_id: Launchpad build request ID (unique)
   *   reason: reason why the build request was issued
   *   builds: all builds triggered as a result of this build request
   */
  db.model('BuildRequestAnnotation', {
    tableName: 'build_request_annotation',
    idAttribute: 'request_id',
    builds: function() {
      return this.hasMany('BuildAnnotation', 'request_id');
    },
    hasTimestamps: true
  });
}
