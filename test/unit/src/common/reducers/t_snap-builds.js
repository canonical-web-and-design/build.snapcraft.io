import expect from 'expect';

import {
  getAnnotatedBuilds,
  snapBuilds,
  snapBuildsInitialStatus
} from '../../../../../src/common/reducers/snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/snap-builds';

const SNAP_BUILDS = [{
  'can_be_rescored': false,
  'builder_link': 'https://api.launchpad.net/devel/builders/lgw01-11',
  'datebuilt': '2016-11-09T17:08:36.317805+00:00',
  'distro_arch_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial/amd64',
  'snap_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
  'duration': '0:02:36.314039',
  'can_be_cancelled': false,
  'title': 'amd64 build of godd-test-2 snap package in ubuntu xenial-updates',
  'buildstate': 'Currently building',
  'requester_link': 'https://api.launchpad.net/devel/~cjwatson',
  'http_etag': '\'d4a5173d51d6525b6d07709306bcfd65dbb68c5c-303718749dd6021eaf21d1a9eb4ae538de800de2\'',
  'score': null,
  'self_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build/9590',
  'date_started': '2016-11-09T17:06:00.003766+00:00',
  'resource_type_link': 'https://api.launchpad.net/devel/#snap_build',
  'build_log_url': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/9590/+files/buildlog_snap_ubuntu_xenial_amd64_godd-test-2_BUILDING.txt.gz',
  'pocket': 'Updates',
  'dependencies': null,
  'date_first_dispatched': '2016-11-09T17:06:00.003766+00:00',
  'distribution_link': 'https://api.launchpad.net/devel/ubuntu',
  'distro_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial',
  'web_link': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/9590',
  'datecreated': '2016-11-09T17:05:52.436792+00:00',
  'archive_link': 'https://api.launchpad.net/devel/ubuntu/+archive/primary',
  'upload_log_url': null
}, {
  'can_be_rescored': false,
  'builder_link': 'https://api.launchpad.net/devel/builders/lgw01-06',
  'datebuilt': '2016-06-06T16:44:15.404592+00:00',
  'distro_arch_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial/amd64',
  'snap_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
  'duration': '0:03:21.345313',
  'can_be_cancelled': false,
  'title': 'amd64 build of godd-test-2 snap package in ubuntu xenial-updates',
  'buildstate': 'Failed to build',
  'requester_link': 'https://api.launchpad.net/devel/~cjwatson',
  'http_etag': '\'8e0a4c14356c8028f2b9ccb77312222ad045b388-b02297890f0ad92c486cfc11f279f452cb8f7dcc\'',
  'score': null,
  'self_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build/1149',
  'date_started': '2016-06-06T16:40:54.059279+00:00',
  'resource_type_link': 'https://api.launchpad.net/devel/#snap_build',
  'build_log_url': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1149/+files/buildlog_snap_ubuntu_xenial_amd64_godd-test-2_BUILDING.txt.gz',
  'pocket': 'Updates',
  'dependencies': null,
  'date_first_dispatched': '2016-06-06T16:40:54.059279+00:00',
  'distribution_link': 'https://api.launchpad.net/devel/ubuntu',
  'distro_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial',
  'web_link': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1149',
  'datecreated': '2016-06-06T16:40:51.698805+00:00',
  'archive_link': 'https://api.launchpad.net/devel/ubuntu/+archive/primary',
  'upload_log_url': null
}];

const SNAP_BUILD_REQUEST = {
  builds_collection_link: 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build-request/10/builds',
  date_requested: '2016-11-09T17:05:52.436792+00:00',
  error_message: null,
  resource_type_link: 'https://api.launchpad.net/devel/#snap_build_request',
  self_link: 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build-request/10',
  snap_link: 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
  status: 'Pending',
  web_link: 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build-request/10',
};

describe('getAnnotatedBuilds', () => {
  const id = 'dummy/repo';

  it('should return builds with annotations', () => {
    const action = {
      type: ActionTypes.FETCH_BUILDS_SUCCESS,
      payload: {
        id,
        response: {
          payload: {
            builds: SNAP_BUILDS,
            build_annotations: {
              '9590': { reason: 'test-annotation-1' },
              '1149': { reason: 'test-annotation-2' }
            }
          }
        }
      }
    };

    expect(getAnnotatedBuilds(action)[0]).toInclude({ reason: 'test-annotation-1' });
    expect(getAnnotatedBuilds(action)[1]).toInclude({ reason: 'test-annotation-2' });
  });

  it('should return build requests with annotations', () => {
    const action = {
      type: ActionTypes.FETCH_BUILDS_SUCCESS,
      payload: {
        id,
        response: {
          payload: {
            builds: [SNAP_BUILD_REQUEST],
            build_request_annotations: {
              '10': { reason: 'test-annotation-1' }
            }
          }
        }
      }
    };

    expect(getAnnotatedBuilds(action)[0])
      .toInclude({ reason: 'test-annotation-1' });
  });
});

describe('snapBuilds reducers', () => {
  const initialState = {};
  const initialStatus = snapBuildsInitialStatus;

  const id = 'dummy/repo';

  it('should return the initial state', () => {
    expect(snapBuilds(undefined, {})).toEqual(initialState);
  });

  context('FETCH_BUILDS', () => {
    const action = {
      type: ActionTypes.FETCH_BUILDS,
      payload: { id }
    };

    it('should store fetching status when fetching builds', () => {
      expect(snapBuilds(initialState, action)[id]).toEqual({
        ...initialStatus,
        isFetching: true
      });
    });
  });

  context('FETCH_SNAP_SUCCESS', () => {
    const SNAP = {
      gitRepoUrl: 'https://github.com/anowner/aname',
      selfLink: 'https://api.launchpad.net/devel/~anowner/+snap/blahblah-xenial',
      storeName: 'test-snap-store-name'
    };

    const state = {
      ...initialState,
      [id]: {
        ...initialStatus,
        isFetching: true
      }
    };
    const action = {
      type: ActionTypes.FETCH_SNAP_SUCCESS,
      payload: {
        id,
        response: {
          payload: {
            snap: SNAP
          }
        }
      }
    };

    it('should stop fetching', () => {
      expect(snapBuilds(state, action)[id].isFetching).toBe(false);
    });
  });

  context('FETCH_BUILDS_SUCCESS', () => {
    const state = {
      ...initialState,
      [id]: {
        ...initialStatus,
        isFetching: true,
        error: 'Previous error'
      }
    };

    const action = {
      type: ActionTypes.FETCH_BUILDS_SUCCESS,
      payload: {
        id,
        response: {
          payload: {
            builds: [SNAP_BUILD_REQUEST, ...SNAP_BUILDS]
          }
        }
      }
    };

    it('should stop fetching', () => {
      expect(snapBuilds(state, action)[id].isFetching).toBe(false);
    });

    it('should store builds and build requests on fetch success', () => {
      expect(snapBuilds(state, action)[id].builds).toEqual(getAnnotatedBuilds(action));
    });

    it('should store success state', () => {
      expect(snapBuilds(state, action)[id].success).toBe(true);
    });

    it('should clean error', () => {
      expect(snapBuilds(state, action)[id].error).toBe(null);
    });
  });

  context('REQUEST_BUILDS_SUCCESS', () => {
    const state = {
      ...initialState,
      [id]: {
        ...initialStatus,
        isFetching: true,
        builds: ['test-build-request-1', 'test-build-request-2'],
        error: 'Previous error'
      }
    };

    const action = {
      type: ActionTypes.REQUEST_BUILDS_SUCCESS,
      payload: {
        id,
        response: {
          payload: {
            builds: [SNAP_BUILD_REQUEST],
            build_annotations: {
              '10': { reason: 'test-annotation-1' }
            }
          }
        }
      }
    };

    it('should stop fetching', () => {
      expect(snapBuilds(state, action)[id].isFetching).toBe(false);
    });

    it('should prepend requested builds on success', () => {
      const expected = getAnnotatedBuilds(action).concat(state[id].builds);
      expect(snapBuilds(state, action)[id].builds).toEqual(expected);
    });

    it('should store success state', () => {
      expect(snapBuilds(state, action)[id].success).toBe(true);
    });

    it('should clean error', () => {
      expect(snapBuilds(state, action)[id].error).toBe(null);
    });
  });

  context('FETCH_BUILDS_ERROR', () => {
    const state = {
      ...initialState,
      [id]: {
        ...initialStatus,
        success: true,
        builds: SNAP_BUILDS,
        isFetching: true
      }
    };

    const action = {
      type: ActionTypes.FETCH_BUILDS_ERROR,
      payload: {
        id,
        error: 'Something went wrong!'
      },
      error: true
    };

    it('should handle fetch builds failure', () => {
      expect(snapBuilds(state, action)[id]).toEqual({
        ...state[id],
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });
  });
});
