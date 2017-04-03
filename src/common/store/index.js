import configureStore from './configureStore';

const preloadedState = window.__PRELOADED_STATE__;
const csrfToken = window.__CSRF_TOKEN__;
const store = configureStore(preloadedState, csrfToken);

export default store;
