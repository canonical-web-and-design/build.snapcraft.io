import expect from 'expect';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const MemcachedStoreStub = () => {};
const stubDependencies = {
  'connect-memcached': () => (MemcachedStoreStub)
};
const sessionStorageConfig = proxyquire(
  '../../../../../src/server/helpers/session',
  stubDependencies
).default;

describe('The session helper', () => {
  context('when session secret config is set', () => {
    let config;
    let mockConfig = {};

    beforeEach(() => {
      mockConfig.get = sinon.stub();
      mockConfig.get.withArgs('SESSION_SECRET').returns('TEST');
      config = sessionStorageConfig(mockConfig);
    });

    it('should not return a session store', () => {
      expect(config.secret).toEqual('TEST');
    });

    context('and memcached config is set', () => {
      let config;

      beforeEach(() => {
        mockConfig.get.withArgs('SESSION_MEMCACHED_HOST').returns('127.0.0.1:8000');
        mockConfig.get.withArgs('SESSION_MEMCACHED_SECRET').returns('secret');
        config = sessionStorageConfig(mockConfig);
      });

      it('should return a Memcached session store', () => {
        expect(config.store).toBeA(MemcachedStoreStub);
      });
    });

    context('and memcached config is not set', () => {
      let config;

      beforeEach(() => {
        mockConfig.get.withArgs('SESSION_MEMCACHED_HOST').returns(null);
        mockConfig.get.withArgs('SESSION_MEMCACHED_SECRET').returns(null);
        config = sessionStorageConfig(mockConfig);
      });

      it('should not return a session store', () => {
        expect(config.store).toNotExist();
      });
    });
  });

  context('when NODE_ENV is production', () => {
    let mockConfig = {};
    let env = process.env.NODE_ENV;
    mockConfig.get = sinon.stub();

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = env;
    });

    context('when session secret config is not set', () => {
      beforeEach(() => {
        mockConfig.get.withArgs('SESSION_MEMCACHED_HOST').returns(null);
        mockConfig.get.withArgs('SESSION_MEMCACHED_SECRET').returns(null);
        mockConfig.get.withArgs('SESSION_SECRET').returns(null);
      });

      it('should throw an error', () => {
        expect(sessionStorageConfig.bind(undefined, mockConfig)).toThrow();
      });
    });
  });
});
