import path from 'path';
import nconf from 'nconf';
import dotenv from 'dotenv';

/**
 * Whitelist config items that are safe to send
 * to the client.
 * DO NOT ADD SENSITIVE DATA TO THIS LIST
 */
const CLIENT_SIDE_WHITELIST = [
  'NODE_ENV',
  'BASE_URL'
];

let configForClient;

// Install an empty store for use (only!) by tests.  Values in this store
// override everything else.
nconf.add('test-overrides', { type: 'memory' });

// Load settings from CLI arguments
nconf.argv();

// Load settings from env file
let envFile = 'environments/development.env';
if (nconf.get('env')) {
  envFile = path.resolve('./', nconf.get('env'));
}

// Load settings from environment variables
dotenv.config({ path: envFile });
nconf.env({
  separator: '__'
});

export const conf = nconf;

export const getClientConfig = () => {
  // Return memoized config if it has been built
  if (configForClient) {
    return configForClient;
  }

  configForClient = {};
  CLIENT_SIDE_WHITELIST.forEach(item => {
    configForClient[item] = nconf.get(item);
  });

  return configForClient;
};
