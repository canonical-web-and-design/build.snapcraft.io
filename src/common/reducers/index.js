import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';

import * as repositoryInput from '../reducers/repository-input';

const rootReducer = combineReducers({
  ...repositoryInput,
  routing: routerReducer
});

export default rootReducer;
