import React from 'react';
import { Route } from 'react-router';
import App from './containers/app.js';
import Home from './containers/home.js';

export default (
  <Route component={App}>
    <Route path="/" component={Home}/>
  </Route>
);
