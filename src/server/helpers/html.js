import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import { Provider } from 'react-redux';

import { conf } from '../helpers/config';

const GAID = conf.get('GOOGLE_ANALYTICS_ID');

const googleTagManager = GAID ?
  <script
    dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', '${GAID}')` }}
  /> : null;

const googleTagManagerNoScript = GAID ?
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id=${GAID}"
      height="0"
      width="0"
      style={{
        display: 'none',
        visibility: 'hidden'
      }}
    />
  </noscript>
  : null;

export default class Html extends Component {
  render() {
    const { assets, store, component, config, csrfToken } = this.props;
    const preloadedState = store.getState();
    const content = component ? this.renderComponent(component, store) : '';

    // read Helmet props after component is rendered
    const head = Helmet.rewind();
    const attrs = head.htmlAttributes.toComponent();

    return (
      <html {...attrs}>
        <head>
          { googleTagManager }
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          {head.script.toComponent()}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu:300,400" />
          <link rel="stylesheet" href={ assets.main.css } />
          {
           /*
            Insert third party scripts (e.g. Stripe) here.
            Trying to load them with Helmet will make them
            load twice.
           */
          }
        </head>
        <body>
          { googleTagManagerNoScript }
          <div id="content" dangerouslySetInnerHTML={{ __html: content }}/>
          <script
            dangerouslySetInnerHTML={{ __html: `window.__CONFIG__ = ${JSON.stringify(config)}` }}
          />
          <script
            dangerouslySetInnerHTML={{ __html: `window.__CSRF_TOKEN__ = ${JSON.stringify(csrfToken)}` }}
          />
          <script
            dangerouslySetInnerHTML={{ __html: `window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState)}` }}
          />
          <script src={ assets.main.js } />
        </body>
      </html>
    );
  }

  renderComponent(component, store) {
    return ReactDOM.renderToString(
      <Provider store={store} key="provider">
        { component }
      </Provider>
    );
  }
}

Html.propTypes = {
  config: PropTypes.object,
  component: PropTypes.node,
  store: PropTypes.object,
  csrfToken: PropTypes.string,
  assets: PropTypes.shape({
    main: PropTypes.shape({
      js: PropTypes.string,
      css: PropTypes.string
    })
  })
};
