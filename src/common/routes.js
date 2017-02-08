import React from 'react';
import { Route } from 'react-router';
import App from './containers/app.js';
import Builds from './containers/builds.js';
import BuildDetails from './containers/build-details.js';
import Dashboard from './containers/dashboard.js';
import Landing from './containers/landing.js';
import LoginFailed from './containers/login-failed.js';
import RepositorySetup from './containers/repository-setup.js';

export default (
  <Route component={App}>
    <Route path="/" component={Landing}/>
    <Route path="/dashboard" component={Dashboard}/>
    <Route path="/:owner/:name/setup" component={RepositorySetup}/>
    <Route path="/:owner/:name/builds" component={Builds}/>
    <Route path="/:owner/:name/builds/:buildId" component={BuildDetails}/>
    <Route path="/login/failed" component={LoginFailed}/>
  </Route>
);
