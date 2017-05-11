import registerGitHubUser from './github-user';
import registerRepository from './repository';

export default function register(db) {
  registerGitHubUser(db);
  registerRepository(db);
}
