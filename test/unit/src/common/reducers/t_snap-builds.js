import expect from 'expect';

import { snapBuilds } from '../../../../../src/common/reducers/snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/snap-builds';

import { snapBuildFromAPI } from '../../../../../src/common/helpers/snap-builds';

describe('snapBuilds reducers', () => {
  const initialState = {
    isFetching: false,
    builds: [],
    success: false,
    error: null
  };

  const SNAP_ENTRIES = [{
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

  it('should return the initial state', () => {
    expect(snapBuilds(undefined, {})).toEqual(initialState);
  });

  context('FETCH_BUILDS', () => {
    it('should store fetching status when fetching builds', () => {
      const action = {
        type: ActionTypes.FETCH_BUILDS,
        payload: 'test'
      };

      expect(snapBuilds(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('FETCH_BUILDS_SUCCESS', () => {

    it('should stop fetching', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload: SNAP_ENTRIES
      };

      expect(snapBuilds(state, action).isFetching).toBe(false);
    });

    it('should store builds on fetch success', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload: SNAP_ENTRIES
      };

      expect(snapBuilds(state, action).builds).toEqual(SNAP_ENTRIES.map(snapBuildFromAPI));
    });

    it('should store success state', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload: SNAP_ENTRIES
      };

      expect(snapBuilds(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      const state = {
        ...initialState,
        error: 'Previous error'
      };

      const action = {
        type: ActionTypes.FETCH_BUILDS_SUCCESS,
        payload: SNAP_ENTRIES
      };

      expect(snapBuilds(state, action).error).toBe(null);
    });
  });

  context('FETCH_BUILDS_ERROR', () => {
    it('should handle fetch builds failure', () => {
      const state = {
        ...initialState,
        success: true,
        builds: SNAP_ENTRIES,
        isFetching: true
      };

      const action = {
        type: ActionTypes.FETCH_BUILDS_ERROR,
        payload: 'Something went wrong!',
        error: true
      };

      expect(snapBuilds(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });
});
