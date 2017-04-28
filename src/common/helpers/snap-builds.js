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

export const BuildStatusColours = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  GREY: 'grey'
};

// Based on BuildStatusConstants from LP API
// https://git.launchpad.net/launchpad/tree/lib/lp/buildmaster/enums.py#n22
//
// mapping between build status from LP and red, yellow, green, grey status colours
const BuildStatusMapping = {
  'Needs building': BuildStatusColours.YELLOW,
  'Successfully built': BuildStatusColours.GREEN,
  'Failed to build': BuildStatusColours.RED,
  'Dependency wait': BuildStatusColours.RED,
  'Chroot problem': BuildStatusColours.RED,
  'Build for superseded Source': BuildStatusColours.RED,
  'Currently building': BuildStatusColours.YELLOW,
  'Failed to upload': BuildStatusColours.RED,
  'Uploading build': BuildStatusColours.YELLOW,
  'Cancelling build': BuildStatusColours.RED,
  'Cancelled build': BuildStatusColours.RED
};

function getLastPartOfUrl(url) {
  return url ? url.substr(url.lastIndexOf('/') + 1) : null;
}

export function snapBuildFromAPI(entry) {
  return entry ? {
    buildId: getLastPartOfUrl(entry.self_link),
    buildLogUrl: entry.build_log_url,

    architecture: entry.arch_tag,

    colour: BuildStatusMapping[entry.buildstate],
    statusMessage: entry.buildstate,
    isPublished: entry.store_upload_status === 'Uploaded',
    dateCreated: entry.datecreated,
    dateStarted: entry.date_started,
    dateBuilt: entry.datebuilt,
    duration: entry.duration,

    storeRevision: entry.store_upload_revision
  } : null;
}
