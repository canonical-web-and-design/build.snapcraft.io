import registerBuildAnnotation from './build_annotation';
import registerBuildRequestAnnotation from './build_request_annotation';
import registerGitHubUser from './github-user';
import registerRepository from './repository';

export default function register(db) {
  registerBuildAnnotation(db);
  registerBuildRequestAnnotation(db);
  registerGitHubUser(db);
  registerRepository(db);
}
