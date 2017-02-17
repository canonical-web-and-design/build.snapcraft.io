// Snap Build data
//
// Parsed from API response in format:
// https://launchpad.net/+apidoc/devel.html#snap_build
// {
//   buildId: '1232', // last part of 'self_link'
//
//   buildLogUrl: '', // 'build_log_url'
//
//   // TODO: commit info (once available)
//   // username: 'John Doe',
//   // commitId:  'f1d6edb',
//   // commitMessage:  'Failed commit',
//
//   architecture: 'i386', //'arch_tag'
//
//   // https://git.launchpad.net/launchpad/tree/lib/lp/buildmaster/enums.py#n22
//   status:  'error', // parsed based on 'buildstate' -> success, error, pending
//   statusMessage: 'Failed to build', // 'buildstate'
//
//   dateCreated: '2016-12-01T17:08:36.317805+00:00', // 'datecreated'
//   dateStarted: '2016-12-01T17:08:36.317805+00:00', // 'date_started'
//   dateCompleted: '2016-12-01T17:10:36.317805+00:00', // 'datebuilt'
//   duration: '0:02:00.124039' // 'duration'
// };

export const BuildStatusConstants = {
  SUCCESS: 'success', // for builds successfully finished
  PENDING: 'pending', // for build currently running or in any way in progress
  ERROR: 'error'      // for builds failed for any reason
};

// Based on BuildStatusConstants from LP API
// https://git.launchpad.net/launchpad/tree/lib/lp/buildmaster/enums.py#n22
//
// mapping between build status from LP and pending/success/error internal status
const BuildStatusMapping = {
  'Needs building': BuildStatusConstants.PENDING,
  'Successfully built': BuildStatusConstants.SUCCESS,
  'Failed to build': BuildStatusConstants.ERROR,
  'Dependency wait': BuildStatusConstants.ERROR,
  'Chroot problem': BuildStatusConstants.ERROR,
  'Build for superseded Source': BuildStatusConstants.ERROR,
  'Currently building': BuildStatusConstants.PENDING,
  'Failed to upload': BuildStatusConstants.ERROR,
  'Uploading build': BuildStatusConstants.PENDING,
  'Cancelling build': BuildStatusConstants.ERROR,
  'Cancelled build': BuildStatusConstants.ERROR
};

function getLastPartOfUrl(url) {
  return url ? url.substr(url.lastIndexOf('/') + 1) : null;
}

export function snapBuildFromAPI(entry) {
  return entry ? {
    buildId: getLastPartOfUrl(entry.self_link),
    buildLogUrl: entry.build_log_url,

    architecture: entry.arch_tag,

    status: BuildStatusMapping[entry.buildstate],
    statusMessage: entry.buildstate,

    dateCreated: entry.datecreated,
    dateStarted: entry.date_started,
    dateBuilt: entry.datebuilt,
    duration: entry.duration
  } : null;
}
