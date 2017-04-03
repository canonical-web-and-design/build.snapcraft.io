import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import { browserHistory } from 'react-router';
import thunk from 'redux-thunk';

import rootReducer from '../reducers';
import { analytics } from '../middleware';
import callApi from '../middleware/call-api';
import { conf } from '../helpers/config';

export default function configureStore(preloadedState, csrfToken) {
  const store = createStore(
    rootReducer,
    preloadedState,
    compose(
      applyMiddleware(
        analytics,
        thunk,
        routerMiddleware(browserHistory),
        callApi({
          endpoint: conf.get('BASE_URL'),
          csrfToken: csrfToken
        })
      ),
      typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
    )
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers');
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
