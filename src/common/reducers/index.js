import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import * as repositoryInput from '../reducers/repository-input';
import * as authError from '../reducers/auth-error';
import * as snapBuilds from '../reducers/snap-builds';

const rootReducer = combineReducers({
  ...repositoryInput,
  ...authError,
  ...snapBuilds,
  routing: routerReducer
});

export default rootReducer;
