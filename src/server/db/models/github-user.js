export default function register(db) {
  /* Schema:
   *   id: automatic serial number
   *   github_id: ID from GitHub
   *   name: display name from GitHub
   *   login: login name from GitHub
   *   created_at: creation date
   *   updated_at: update date
   *   last_login_at: last login date
   */
  db.model('GitHubUser', {
    tableName: 'github_user',
    hasTimestamps: true
  });
}
