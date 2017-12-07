import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';

import { syncHistoryWithStore } from 'react-router-redux';

import routes from './routes';
import store from './store';

const history = syncHistoryWithStore(browserHistory, store);


export default class Root extends Component {

  componentDidMount() {
    /*
     Create Google Analytics Events when the page in this SPA has changed.
    */
    history.listen((location) => {
      if (window.ga) {
        window.ga('set', 'location', window.location.href);
        window.ga('set', 'page', location.pathname);
        window.ga('send', 'pageview');
      }
    });
  }

  render() {
    return (
      <Provider store={store}>
        <Router routes={routes} history={history} />
      </Provider>
    );
  }
}
