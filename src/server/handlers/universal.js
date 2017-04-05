import React from 'react';
import { match, RouterContext } from 'react-router';
import { renderToString } from 'react-dom/server';

import Html from '../helpers/html';
import { getClientConfig, conf } from '../helpers/config';
import configureStore from '../../common/store/configureStore';
import assets from '../../../webpack-assets.json';

let routes = require('../../common/routes').default;

export const universal = (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    // Hot-reload application files when changes
    // made when running as a development site
    routes = require('../../common/routes').default;
  }

  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    handleMatch(req, res, error, redirectLocation, renderProps);
  });
};

export const handleMatch = (req, res, error, redirectLocation, renderProps) => {
  const teams = JSON.parse(conf.get('OPENID_TEAMS') || 'null');

  if (error) {
    res.status(500).send(error.message);
  } else if (redirectLocation) {
    res.redirect(302, redirectLocation.pathname + redirectLocation.search);
  } else if (!req.session && teams && teams.length) {
    res.redirect(302, '/login/authenticate');
  } else if (renderProps) {

    const initialState = {
      auth: { authenticated: false },
      authStore: {}
    };

    if (req.session.githubAuthenticated) {
      initialState.auth.authenticated = true;
      initialState.user = req.session.user;
    }

    const csrfToken = req.session.csrfTokens
      ? req.session.csrfTokens[req.session.csrfTokens.length - 1]
      : null;

    if (req.session.error) {
      initialState['authError'] = { message: req.session.error };
      delete req.session.error;
    } else if (!req.session.authenticated && teams && teams.length) {
      res.redirect(302, '/login/authenticate');
      return;
    }

    if (req.session.nickname) {
      initialState.authStore.userName = req.session.nickname;
    }

    if (req.session.ssoDischarge) {
      // Tell the client that it can pick up a discharge macaroon from the
      // session and move it to local storage.
      initialState.authStore.hasDischarge = true;
    }

    const store = configureStore(initialState);

    // You can also check renderProps.components or renderProps.routes for
    // your "not found" component or route respectively, and send a 404 as
    // below, if you're using a catch-all route.
    const component = <RouterContext {...renderProps} />;

    /**
     * IMPORTANT:
     * Config data MUST pass through getClientConfig
     * whitelist in order to be exposed to the client side
     */
    res.status(200);
    res.send('<!doctype html>\n' +
      renderToString(
        <Html
          store={ store }
          component={ component }
          config={ getClientConfig(conf) }
          assets={ assets }
          csrfToken={ csrfToken }
        />
      ));
  } else {
    res.status(404).send('Not found');
  }
};
