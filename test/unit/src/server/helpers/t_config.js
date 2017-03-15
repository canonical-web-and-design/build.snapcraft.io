import expect from 'expect';
import proxyquire from 'proxyquire';
import { Map } from 'immutable';

import { getClientConfig } from '../../../../../src/server/helpers/config';

const pq = proxyquire.bind(null, '../../../../../src/server/helpers/config');

describe('The config helper conf.get method', () => {
  context('when EXAMPLE_CONFIG_KEY is "http://defaults.com" in the defaults file', () => {
    let mocks = {};

    beforeEach(() => {
      mocks['../../config/defaults'] = {
        default: {
          EXAMPLE_CONFIG_KEY: 'http://defaults.com'
        },
        '@noCallThru': true
      };
    });

    it('should return "http://defaults.com"', () => {
      expect(pq(mocks).conf.get('EXAMPLE_CONFIG_KEY')).toEqual('http://defaults.com');
    });

    context('and EXAMPLE_CONFIG_KEY is "http://process.env.com" in process.env', () => {
      beforeEach(() => {
        process.env.EXAMPLE_CONFIG_KEY = 'http://process.env.com';
      });

      afterEach(() => {
        delete process.env.EXAMPLE_CONFIG_KEY;
      });

      it('should return "http://process.env.com"', () => {
        expect(pq(mocks).conf.get('EXAMPLE_CONFIG_KEY')).toEqual('http://process.env.com');
      });
    });
  });

  context('when EXAMPLE_CONFIG_KEY is "http://process.env.com" in process.env', () => {
    beforeEach(() => {
      process.env.EXAMPLE_CONFIG_KEY = 'http://process.env.com';
    });

    afterEach(() => {
      delete process.env.EXAMPLE_CONFIG_KEY;
    });

    it('should reuturn "http://process.env.com"', () => {
      expect(pq({}).conf.get('EXAMPLE_CONFIG_KEY')).toEqual('http://process.env.com');
    });

    context('and EXAMPLE_CONFIG_KEY is "http://argv.com" in argv', () => {
      let mocks = {};

      beforeEach(() => {
        mocks['yargs'] = {
          argv: {
            EXAMPLE_CONFIG_KEY: 'http://argv.com'
          },
          '@noCallThru': true
        };
      });

      it('should reuturn "http://argv.com"', () => {
        expect(pq(mocks).conf.get('EXAMPLE_CONFIG_KEY')).toEqual('http://argv.com');
      });
    });
  });

  context('when EXAMPLE_CONFIG_KEY is "http://argv.com" in argv', () => {
    let mocks = {};

    beforeEach(() => {
      mocks['yargs'] = {
        argv: {
          EXAMPLE_CONFIG_KEY: 'http://argv.com'
        },
        '@noCallThru': true
      };
    });

    it('should reuturn "http://argv.com"', () => {
      expect(pq(mocks).conf.get('EXAMPLE_CONFIG_KEY')).toEqual('http://argv.com');
    });
  });
});

describe('The getClientConfig helper', () => {
  context('when passed "BASE_URL"', () => {
    let conf;

    beforeEach(() => {
      conf = getClientConfig(Map({ BASE_URL: 'http://blah.com' }));
    });

    it('should not filter "BASE_URL"', () => {
      expect(conf.BASE_URL).toEqual('http://blah.com');
    });
  });

  context('when passed "NON_WHITELISTED_KEY"', () => {
    let conf;

    beforeEach(() => {
      conf = getClientConfig(Map({ NON_WHITELISTED_KEY: 'http://blah.com' }));
    });

    it('should filter "NON_WHITELISTED_KEY"', () => {
      expect(conf.NON_WHITELISTED_KEY).toEqual(undefined);
    });
  });
});
