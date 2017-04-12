import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import * as betaNotification from './beta-notification';
import * as repository from './repository';
import * as repositories from './repositories';
import * as authError from './auth-error';
import * as snapBuilds from './snap-builds';
import * as snaps from './snaps';
import * as user from './user';
import * as auth from './auth';
import * as authStore from './auth-store';
import * as registerName from './register-name';
import { entities } from './entities';

const rootReducer = combineReducers({
  ...auth,
  ...authError,
  ...authStore,
  ...betaNotification,
  ...registerName,
  ...repositories,
  ...repository,
  ...snapBuilds,
  ...snaps,
  ...user,
  entities,
  routing: routerReducer
});

export default rootReducer;
