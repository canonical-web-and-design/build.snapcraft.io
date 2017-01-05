import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import * as repositoryInput from './repository-input';
import * as authError from './auth-error';
import * as snapBuilds from '../reducers/snap-builds';
import * as requestSnapBuilds from '../reducers/request-snap-builds';
import * as auth from './auth';
import * as webhook from './webhook';

const rootReducer = combineReducers({
  ...repositoryInput,
  ...authError,
  ...snapBuilds,
  ...requestSnapBuilds,
  ...auth,
  ...webhook,
  routing: routerReducer
});

export default rootReducer;
