import React from 'react';
import { match, RouterContext } from 'react-router';
import { renderToString } from 'react-dom/server';

import Html from '../helpers/html';
import { getClientConfig } from '../helpers/config';
import configureStore from '../../common/store/configureStore';

let routes = require('../../common/routes').default;

import assets from '../../../webpack-assets.json';

export const universal = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Hot-reload application files when changes
    // made when running as a development site
    routes = require('../../common/routes').default;
  }

  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    handleMatch(req, res, error, redirectLocation, renderProps);
  });

  next();
};

export const handleMatch = (req, res, error, redirectLocation, renderProps) => {
  if (error) {
    res.status(500).send(error.message);
  } else if (redirectLocation) {
    res.redirect(302, redirectLocation.pathname + redirectLocation.search);
  } else if (renderProps) {

    const initialState = {};

    if (req.session) {

      if (req.session.authenticated) {
        initialState['identity'] = {
          isAuthenticated: req.session.authenticated,
          name: req.session.name,
          email: req.session.email
        };
      }

      if (req.session.error) {
        initialState['oyez'] = [{
          'message': req.session.error,
          'status': 'error'
        }];

        delete req.session.error;
      }

    }

    const store = configureStore(initialState);

   /**
    * IMPORTANT:
    * Config data MUST pass through getClientConfig
    * whitelist in order to be exposed to the client side
    */
    const config = getClientConfig();

    // You can also check renderProps.components or renderProps.routes for
    // your "not found" component or route respectively, and send a 404 as
    // below, if you're using a catch-all route.
    const component = <RouterContext {...renderProps} />;

    res.status(200);
    res.send('<!doctype html>\n' +
      renderToString(
        <Html
          store={ store }
          component={ component }
          config={ config }
          assets={ assets }
        />
      ));
  } else {
    res.status(404).send('Not found');
  }
};
