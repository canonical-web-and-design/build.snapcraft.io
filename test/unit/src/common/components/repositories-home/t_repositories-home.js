import React from 'react';
import expect from 'expect';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const RepositoriesHome = proxyquire(
  '../../../../../../src/common/components/repositories-home',
  {
    '../../actions/snaps': {
      fetchUserSnaps: sinon.stub().returns({ type: 'FETCH_SNAP_REPOSITORIES' })
    }
  }
).RepositoriesHomeRaw;
let clock;

describe('The RepositoriesHome component', () => {
  let props;

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  });

  context('when user is logged in', () => {
    let wrapper;

    beforeEach(() => {
      props = {
        auth: {
          authenticated: true
        },
        user: {},
        snaps: {},
        snapBuilds: {},
        dispatch: sinon.spy(),
        router: {}
      };

      wrapper = shallow(<RepositoriesHome { ...props } />);
    });

    context('and component mounts', () => {
      beforeEach(() => {
        wrapper.instance().componentDidMount();
      });

      afterEach(() => {
        wrapper.instance().componentWillUnmount();
      });

      it('should dispatch fetchUserSnaps immediately', () => {
        expect(props.dispatch.calledWith({ type: 'FETCH_SNAP_REPOSITORIES' })).toBe(true);
      });

      context('and after fifteen seconds', () => {
        beforeEach(() => {
          props.dispatch.reset();
          clock.tick(15000);
        });

        it('should dispatch fetchUserSnaps again', () => {
          expect(props.dispatch.calledWith({ type: 'FETCH_SNAP_REPOSITORIES' })).toBe(true);
        });
      });
    });

    context('and component mounts, then unmounts', () => {
      beforeEach(() => {
        wrapper.instance().componentDidMount();
        clock.tick(60000);
        wrapper.instance().componentWillUnmount();
        props.dispatch.reset();
      });

      it('should not dispatch fetchSnaps again', () => {
        clock.tick(60000);
        expect(props.dispatch.calledWith({ type: 'FETCH_SNAP_REPOSITORIES' })).toBe(false);
      });
    });
  });
});
