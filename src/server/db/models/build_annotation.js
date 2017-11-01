
export default function register(db) {
  /* Schema:
   *   build_id: Launchpad build ID (unique)
   *   reason: reason why the build was triggered.
   */
  db.model('BuildAnnotation', {
    tableName: 'build_annotation',
    idAttribute: 'build_id',
    hasTimestamps: true
  });
}
