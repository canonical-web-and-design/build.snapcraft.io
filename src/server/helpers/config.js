import { Map } from 'immutable';
import { argv } from 'yargs';
import dotenv from 'dotenv';

// Whitelist for client-side config
// Add settings to this list to use them in
// the client.
// ANY SETTINGS ADDED TO THIS LIST WILL BE
// VISIBLE TO THE WORLD.
//
const CLIENT_SIDE_WHITELIST = [
  'NODE_ENV',
  'BASE_URL',
  'GITHUB_API_ENDPOINT',
  'GITHUB_AUTH_CLIENT_ID',
  'UBUNTU_SSO_URL',
  'STORE_API_URL',
  'STORE_DEVPORTAL_URL',
  'STORE_ALLOWED_CHANNELS',
  'STORE_PACKAGE_UPLOAD_REQUEST_LIFETIME'
];

// Add envfile variables to environment
if (argv.env) {
  dotenv.config({ path: argv.env });
}

// Compile config from the following sources
// in order of precedence
global.__CONFIG__ = Object.assign(
  {},
  require('../../config/defaults').default,  // development site defaults
  process.env,                               // environment variables, including envfile
  argv                                       // CLI arguments
);

export const conf = Map(global.__CONFIG__);

export const getClientConfig = (config) => {
  let configForClient = {};
  CLIENT_SIDE_WHITELIST.forEach(item => {
    if (config.get(item)) {
      configForClient[item] = config.get(item);
    }
  });

  return configForClient;
};
