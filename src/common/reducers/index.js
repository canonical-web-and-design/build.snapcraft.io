import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import * as repositoryInput from '../reducers/repository-input';
import * as authError from '../reducers/auth-error';

const rootReducer = combineReducers({
  ...repositoryInput,
  ...authError,
  routing: routerReducer
});

export default rootReducer;
