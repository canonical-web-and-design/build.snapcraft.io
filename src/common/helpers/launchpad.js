// Constants for use when interacting with Launchpad.

// XXX cjwatson 2017-02-08: Hardcoded for now, but should eventually be
// configurable.
export const DISTRIBUTION = 'ubuntu';
export const DISTRO_SERIES = 'xenial';
export const ARCHITECTURES = [
  'amd64', 'arm64', 'armhf', 'i386', 'ppc64el', 's390x'
];
export const STORE_SERIES = '16';
export const STORE_CHANNELS = ['edge'];
