import registerBuildAnnotation from './build_annotation';
import registerGitHubUser from './github-user';
import registerRepository from './repository';

export default function register(db) {
  registerBuildAnnotation(db);
  registerGitHubUser(db);
  registerRepository(db);
}
