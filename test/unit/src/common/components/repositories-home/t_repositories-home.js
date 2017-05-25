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

      wrapper = shallow(<RepositoriesHome { ...props } />);
    });

    it('should render repositories list view message', () => {
      expect(wrapper.find('Connect(RepositoriesListView)').length).toBe(1);
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

      wrapper = shallow(<RepositoriesHome { ...props } />);
    });

    context('and component mounts', () => {
      beforeEach(() => {
        wrapper.instance().componentWillMount();
      });

      afterEach(() => {
        wrapper.instance().componentWillUnmount();
      });

      it('should call updateSnaps callback immediately', () => {
        expect(props.updateSnaps).toHaveBeenCalled();
      });

      context('and after fifteen seconds', () => {
        beforeEach(() => {
          props.updateSnaps.reset();
          clock.tick(15000);
        });

        it('should dispatch updateSnaps callback again', () => {
          expect(props.updateSnaps).toHaveBeenCalled();
        });
      });
    });

    context('and component mounts, then unmounts', () => {
      beforeEach(() => {
        wrapper.instance().componentWillMount();
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
