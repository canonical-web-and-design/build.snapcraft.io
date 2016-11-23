const path = require('path');
const nconf = require('nconf');
const dotenv = require('dotenv');

nconf.argv();

let envFile = 'environments/development.env';

if (nconf.get('env')) {
  envFile = path.resolve('./', nconf.get('env'));
}

dotenv.config({ path: envFile });

nconf.env({
  separator: '__'
});

module.exports = nconf;
