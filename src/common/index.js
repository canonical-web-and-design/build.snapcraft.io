// import global stylesheets before app renders
import './style/normalize.css';
import './style/base.css';

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Root from './root';

render(
  <AppContainer>
    <Root />
  </AppContainer>,
  document.getElementById('content')
);

if (module.hot) {
  module.hot.accept('./root', () => {
    // If you use Webpack 2 in ES modules mode, you can
    // use <App /> here rather than require() a <NextApp />.
    const NextRoot = require('./root').default;
    render(
      <AppContainer>
        <NextRoot />
      </AppContainer>,
      document.getElementById('content')
    );
  });
}
