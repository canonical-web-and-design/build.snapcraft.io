import React from 'react';
import { Route } from 'react-router';
import App from './containers/app.js';
import HelloWorld from './components/hello-world';

export default (
  <Route component={App}>
    <Route path="/" component={HelloWorld}/>
  </Route>
);
