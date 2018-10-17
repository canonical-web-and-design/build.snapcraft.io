import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { RepositoriesHomeRaw as RepositoriesHome } from '../../../../../../src/common/components/repositories-home';

let clock;

describe('The RepositoriesHome component', () => {
  let props;

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  });

  context('when user has no snaps', () => {
    let wrapper;

    beforeEach(() => {
      props = {
        auth: {
          authenticated: true
        },
        user: {},
        entities: {
          snaps: {}
        },
        snaps: {
          isFetching: true
        },
        snapBuilds: {},
        fetchBuilds: () => {},
        updateSnaps: () => {},
        router: {}
      };

      wrapper = shallow(
        <RepositoriesHome { ...props } />, { disableLifecycleMethods: true }
      );
    });

    it('should render repositories list view message', () => {
      expect(wrapper.find('Connect(RepositoriesListView)').length).toBe(1);
    });
  });

  context('when there is an error', () => {
    let wrapper;

    beforeEach(() => {
      props = {
        auth: {
          authenticated: true
        },
        user: {},
        entities: {
          snaps: {}
        },
        snaps: {
          error: {
            json: {
              payload: {
                message: 'Test error'
              }
            }
          }
        },
        snapBuilds: {},
        updateSnaps: expect.createSpy(),
        router: {}
      };

      wrapper = shallow(
        <RepositoriesHome { ...props } />, { disableLifecycleMethods: true }
      );
    });

    it('should render error message', () => {
      expect(wrapper.find('Notification').html()).toContain('Test error');
    });
  });

  context('when user is logged in', () => {
    let wrapper;

    beforeEach(() => {
      props = {
        auth: {
          authenticated: true
        },
        user: {},
        entities: {
          snaps: {}
        },
        snaps: {},
        snapBuilds: {},
        updateSnaps: expect.createSpy(),
        router: {}
      };

      // mock document for global DOM do work in tests
      global.document = {
        visibilityState: 'visible',
        addEventListener: expect.createSpy(),
        removeEventListener: expect.createSpy()
      };

      wrapper = shallow(<RepositoriesHome { ...props } />);
    });

    afterEach(() => {
      delete global.document;
    });

    context('and component mounts', () => {
      beforeEach(() => {
        wrapper.instance().componentDidMount();
      });

      afterEach(() => {
        wrapper.instance().componentWillUnmount();
      });

      it('should call updateSnaps callback immediately', () => {
        expect(props.updateSnaps).toHaveBeenCalled();
      });

      context('and after thirty seconds', () => {
        beforeEach(() => {
          props.updateSnaps.reset();
          clock.tick(30000);
        });

        it('should dispatch updateSnaps callback again', () => {
          expect(props.updateSnaps).toHaveBeenCalled();
        });
      });
    });

    context('and component mounts, then unmounts', () => {
      beforeEach(() => {
        wrapper.instance().componentDidMount();
        clock.tick(60000);
        wrapper.instance().componentWillUnmount();
        props.updateSnaps.reset();
      });

      it('should not updateSnaps callback again', () => {
        clock.tick(60000);
        expect(props.updateSnaps).toNotHaveBeenCalled();
      });
    });
  });
});
