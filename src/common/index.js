// import global stylesheets before app renders
import '../../node_modules/normalize.css/normalize.css';
import './style/base.css';

import { createNav } from '@canonical/global-nav';

import React from 'react';
import { render } from 'react-dom';

import Root from './root';

createNav({ maxWidth: '64.875rem', showLogins: false });
render(<Root />, document.getElementById('content'));
