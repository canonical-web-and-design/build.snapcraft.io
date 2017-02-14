import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom/server';
import Helmet from 'react-helmet';
import { Provider } from 'react-redux';

export default class Html extends Component {
  render() {
    const { assets, store, component, config } = this.props;
    const preloadedState = store.getState();
    const content = component ? this.renderComponent(component, store) : '';

    // read Helmet props after component is rendered
    const head = Helmet.rewind();
    const attrs = head.htmlAttributes.toComponent();

    return (
      <html {...attrs}>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          {head.script.toComponent()}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu" />
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
          <div id="content" dangerouslySetInnerHTML={{ __html: content }}/>
          <script
            dangerouslySetInnerHTML={{ __html: `window.__CONFIG__ = ${JSON.stringify(config)}` }}
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
  assets: PropTypes.shape({
    main: PropTypes.shape({
      js: PropTypes.string,
      css: PropTypes.string
    })
  })
};
