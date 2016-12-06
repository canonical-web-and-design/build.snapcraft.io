import React from 'react';
import { Route } from 'react-router';
import App from './containers/app.js';
import Home from './containers/home.js';
import LoginFailed from './containers/login-failed.js';

export default (
  <Route component={App}>
    <Route path="/" component={Home}/>
    <Route path="/login/failed" component={LoginFailed}/>
  </Route>
);
