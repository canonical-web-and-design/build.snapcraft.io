import expect from 'expect';
import enzymify from 'expect-enzyme';

import './helpers';

expect.extend(enzymify());

// Stub out loading of CSS dependencies
require.extensions['.css'] = () => {};
require.extensions['.svg'] = () => 'example.svg';
require.extensions['.png'] = () => 'example.png';
require.extensions['.gif'] = () => 'example.gif';
require.extensions['.jpg', '.jpeg'] = () => 'example.jpg';

import { conf, getClientConfig } from '../src/server/helpers/config';

global.__CONFIG__ = getClientConfig(conf);
