export const FETCH_BUILDS = 'FETCH_BUILDS';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_ERROR = 'FETCH_BUILDS_ERROR';

export function fetchBuildsSuccess(builds) {
  return {
    type: FETCH_BUILDS_SUCCESS,
    payload: builds
  };
}

export function fetchBuildsError(error) {
  return {
    type: FETCH_BUILDS_ERROR,
    payload: error,
    error: true
  };
}

export function fetchBuilds(repository) {
  return (dispatch) => {
    if (repository) {
      dispatch({
        type: FETCH_BUILDS,
        payload: repository
      });

      // TODO: real async call to load the builds
      // return fetch(...)
      //   .then(checkStatus)
      //   ...

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(SNAP_BUILDS_RESPONSE);
        }, 1000);
      }).then((json) => dispatch(fetchBuildsSuccess(json.entries)))
        .catch( error => dispatch(fetchBuildsError(error)));
    }
  };
}

// MOCKED BUILDS RESPONSE
// based on https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/builds
const SNAP_BUILDS_RESPONSE = {
  'total_size': 5,
  'start': 0,
  'entries': [{
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
    'arch_tag': 'amd64',
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
    'arch_tag': 'amd64',
    'upload_log_url': null
  }, {
    'can_be_rescored': false,
    'builder_link': 'https://api.launchpad.net/devel/builders/lgw01-08',
    'datebuilt': '2016-06-06T16:43:46.951477+00:00',
    'distro_arch_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial/i386',
    'snap_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
    'duration': '0:02:52.464213',
    'can_be_cancelled': false,
    'title': 'i386 build of godd-test-2 snap package in ubuntu xenial-updates',
    'buildstate': 'Successfully built',
    'requester_link': 'https://api.launchpad.net/devel/~cjwatson',
    'http_etag': '\'b4a80f0bb7035d4020aee06934da6d0722285052-60c8d24f5a0b7e8619bce064d9e64f09be1a2042\'',
    'score': null,
    'self_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build/1150',
    'date_started': '2016-06-06T16:40:54.487264+00:00',
    'resource_type_link': 'https://api.launchpad.net/devel/#snap_build',
    'build_log_url': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1150/+files/buildlog_snap_ubuntu_xenial_i386_godd-test-2_BUILDING.txt.gz',
    'pocket': 'Updates',
    'dependencies': null,
    'date_first_dispatched': '2016-06-06T16:40:54.487264+00:00',
    'distribution_link': 'https://api.launchpad.net/devel/ubuntu',
    'distro_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial',
    'web_link': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1150',
    'datecreated': '2016-06-06T16:40:51.698805+00:00',
    'archive_link': 'https://api.launchpad.net/devel/ubuntu/+archive/primary',
    'arch_tag': 'i386',
    'upload_log_url': null
  }, {
    'can_be_rescored': false,
    'builder_link': 'https://api.launchpad.net/devel/builders/lcy01-07',
    'datebuilt': '2016-06-02T07:56:07.834750+00:00',
    'distro_arch_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial/amd64',
    'snap_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
    'duration': '0:02:05.065412',
    'can_be_cancelled': false,
    'title': 'amd64 build of godd-test-2 snap package in ubuntu xenial-updates',
    'buildstate': 'Cancelled build',
    'requester_link': 'https://api.launchpad.net/devel/~cjwatson',
    'http_etag': '\'09eda0e0a7d977ea137e20f231c617a70709d100-72488fcf39f1485b3274027ae4a01cc52ca154a5\'',
    'score': null,
    'self_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build/1063',
    'date_started': '2016-06-02T07:54:02.769338+00:00',
    'resource_type_link': 'https://api.launchpad.net/devel/#snap_build',
    'build_log_url': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1063/+files/buildlog_snap_ubuntu_xenial_amd64_godd-test-2_BUILDING.txt.gz',
    'pocket': 'Updates',
    'dependencies': null,
    'date_first_dispatched': '2016-06-02T07:54:02.769338+00:00',
    'distribution_link': 'https://api.launchpad.net/devel/ubuntu',
    'distro_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial',
    'web_link': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1063',
    'datecreated': '2016-06-01T13:44:04.646067+00:00',
    'archive_link': 'https://api.launchpad.net/devel/ubuntu/+archive/primary',
    'arch_tag': 'amd64',
    'upload_log_url': null
  }, {
    'can_be_rescored': false,
    'builder_link': 'https://api.launchpad.net/devel/builders/lcy01-05',
    'datebuilt': '2016-06-02T07:56:07.748129+00:00',
    'distro_arch_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial/i386',
    'snap_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2',
    'duration': '0:01:50.046060',
    'can_be_cancelled': false,
    'title': 'i386 build of godd-test-2 snap package in ubuntu xenial-updates',
    'buildstate': 'Successfully built',
    'requester_link': 'https://api.launchpad.net/devel/~cjwatson',
    'http_etag': '\'c34118394abae39240e95f2bc620f6f96a379a68-264ca7acd85945668d342842b2039d75d7b673ff\'',
    'score': null,
    'self_link': 'https://api.launchpad.net/devel/~cjwatson/+snap/godd-test-2/+build/1064',
    'date_started': '2016-06-02T07:54:17.702069+00:00',
    'resource_type_link': 'https://api.launchpad.net/devel/#snap_build',
    'build_log_url': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1064/+files/buildlog_snap_ubuntu_xenial_i386_godd-test-2_BUILDING.txt.gz',
    'pocket': 'Updates',
    'dependencies': null,
    'date_first_dispatched': '2016-06-02T07:54:17.702069+00:00',
    'distribution_link': 'https://api.launchpad.net/devel/ubuntu',
    'distro_series_link': 'https://api.launchpad.net/devel/ubuntu/xenial',
    'web_link': 'https://launchpad.net/~cjwatson/+snap/godd-test-2/+build/1064',
    'datecreated': '2016-06-01T13:44:04.646067+00:00',
    'archive_link': 'https://api.launchpad.net/devel/ubuntu/+archive/primary',
    'arch_tag': 'i386',
    'upload_log_url': null
  }],
  'resource_type_link': 'https://api.launchpad.net/devel/#snap_build-page-resource'
};
