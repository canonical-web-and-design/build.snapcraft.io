// import global stylesheets before app renders
import '../../node_modules/normalize.css/normalize.css';
import './style/base.css';

import React from 'react';
import { render } from 'react-dom';

import Root from './root';

render(<Root />, document.getElementById('content'));
