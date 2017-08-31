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
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  GREY: 'grey'
};

export const BuildStatusIcons = {
  TICK: 'tick',
  TICK_OUTLINED: 'outlined_tick',
  TICK_SOLID: 'solid_tick',
  ELLIPSES: 'ellipses',
  SPINNER: 'spinner',
  CROSS: 'cross'
};

export const UserFacingState = {
  // Used only when there is no build returned from LP.
  // When build is returned from LP (scheduled) it's 'Building soon' for BSI.
  'NEVER_BUILT': createState(
    'Never built',
    BuildStatusColours.GREY,
    false,
    8,
    'never_built'
  ),
  'BUILDING_SOON': createState(
    'Building soon',
    BuildStatusColours.GREY,
    BuildStatusIcons.ELLIPSES,
    7,
    'building_soon'
  ),
  'WONT_RELEASE': createState(
    'Built, won’t be released',
    BuildStatusColours.GREEN,
    BuildStatusIcons.TICK_OUTLINED,
    6,
    'wont_release'
  ),
  'RELEASED': createState(
    'Built and released',
    BuildStatusColours.GREEN,
    BuildStatusIcons.TICK_SOLID,
    5,
    'released'
  ),
  'RELEASE_FAILED': createState(
    'Built, failed to release',
    BuildStatusColours.RED,
    BuildStatusIcons.TICK,
    4,
    'release_failed'
  ),
  'RELEASING_SOON': createState(
    'Built, releasing soon',
    BuildStatusColours.GREY,
    BuildStatusIcons.TICK,
    3,
    'releasing_soon'
  ),
  'IN_PROGRESS': createState(
    'In progress',
    BuildStatusColours.BLUE,
    BuildStatusIcons.SPINNER,
    2,
    'in_progress'
  ),
  'FAILED_TO_BUILD': createState(
    'Failed to build',
    BuildStatusColours.RED,
    BuildStatusIcons.CROSS,
    1,
    'failed_to_build'
  )
};

/**
 * @param message {String} the message presented to the user when a snap is in this state.
 * @param colour {String} colour of indicator associated with message.
 * @param icon {String} icon type associated with message.
 * @param priority {Number} value to determine which message should be shown in
 * the case of multiple archs with differing states; lowest wins.
 * **/
function createState(statusMessage, colour, icon, priority, badge) {
  return {
    statusMessage,
    colour,
    icon,
    priority,
    badge
  };
}

// Based on BuildStatusConstants from LP API
// https://git.launchpad.net/launchpad/tree/lib/lp/buildmaster/enums.py#n22
//
const LaunchpadBuildStates = {
  'NEEDSBUILT': 'Needs building',
  'FULLYBUILT': 'Successfully built',
  'FAILEDTOBUILD': 'Failed to build',
  'MANUALDEPWAIT': 'Dependency wait',
  'CHROOTWAIT': 'Chroot problem',
  'SUPERSEDED': 'Build for superseded Source',
  'BUILDING': 'Currently building',
  'FAILEDTOUPLOAD': 'Failed to upload',
  'UPLOADING': 'Uploading build',
  'CANCELLING': 'Cancelling build',
  'CANCELLED': 'Cancelled build'
};

const LaunchpadStoreUploadStates = {
  'UNSCHEDULED': 'Unscheduled',
  'PENDING': 'Pending',
  'FAILEDTOUPLOAD': 'Failed to upload',
  'FAILEDTORELEASE': 'Failed to release to channels',
  'UPLOADED': 'Uploaded'
};

function mapBuildAndUploadStates(buildState, uploadState) {
  switch (buildState) {
    case LaunchpadBuildStates.NEEDSBUILT:
      return UserFacingState.BUILDING_SOON;
    case LaunchpadBuildStates.FULLYBUILT:
      return internalMapSnapBuildStoreUploadState(uploadState);
    case LaunchpadBuildStates.BUILDING:
      return UserFacingState.IN_PROGRESS;
    case LaunchpadBuildStates.UPLOADING:
      return UserFacingState.IN_PROGRESS;
    case LaunchpadBuildStates.FAILEDTOBUILD:
    case LaunchpadBuildStates.MANUALDEPWAIT:
    case LaunchpadBuildStates.CHROOTWAIT:
    case LaunchpadBuildStates.SUPERSEDED:
    case LaunchpadBuildStates.FAILEDTOUPLOAD:
    case LaunchpadBuildStates.CANCELLING:
    case LaunchpadBuildStates.CANCELLED:
      return UserFacingState.FAILED_TO_BUILD;
    default:
      throw new RangeError('Unrecognised buildState in mapBuildAndUploadStates');
  }
}

// Map SnapBuildStoreUploadStatus to UI state
// https://bazaar.launchpad.net/+branch/launchpad/view/head:/lib/lp/snappy/interfaces/snapbuild.py#L81
function internalMapSnapBuildStoreUploadState(uploadState) {
  switch (uploadState) {
    case LaunchpadStoreUploadStates.UNSCHEDULED:
      return UserFacingState.WONT_RELEASE;
    case LaunchpadStoreUploadStates.PENDING:
      return UserFacingState.RELEASING_SOON;
    case LaunchpadStoreUploadStates.FAILEDTOUPLOAD:
    case LaunchpadStoreUploadStates.FAILEDTORELEASE:
      return UserFacingState.RELEASE_FAILED;
    case LaunchpadStoreUploadStates.UPLOADED:
      return UserFacingState.RELEASED;
    default:
      throw new RangeError('Unrecognised publishState in internalMapSnapBuildStoreUploadState');
  }
}


function getLastPartOfUrl(url) {
  return url ? url.substr(url.lastIndexOf('/') + 1) : null;
}

export function snapBuildFromAPI(entry) {

  if (!entry) {
    return null;
  }

  const {
    colour,
    statusMessage,
    icon, // TODO we don't use this yet
    priority, // TODO we don't use this yet
    badge
  } = mapBuildAndUploadStates(entry.buildstate, entry.store_upload_status);

  return {
    buildId: getLastPartOfUrl(entry.self_link),
    buildLogUrl: entry.build_log_url,

    architecture: entry.arch_tag,

    statusMessage,
    colour,
    icon,
    priority,
    badge,

    isPublished: entry.store_upload_status === 'Uploaded',
    dateCreated: entry.datecreated,
    dateStarted: entry.date_started,
    dateBuilt: entry.datebuilt,
    duration: entry.duration,

    storeRevision: entry.store_upload_revision,
    storeUploadStatus: entry.store_upload_status,
    storeUploadErrorMessage: entry.store_upload_error_message
  };
}
