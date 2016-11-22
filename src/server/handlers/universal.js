import React from 'react';
import { match, RouterContext } from 'react-router';
import { renderToString } from 'react-dom/server';

import Html from '../helpers/html';
import conf from '../configure.js';
import configureStore from '../../common/store/configureStore';

let routes = require('../../common/routes').default;

import assets from '../../../webpack-assets.json';

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

    // config we share from server side to client side
    const config = {
      UNIVERSAL: conf.get('UNIVERSAL')
    };

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
