/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Helpers for recording build annotations. 
 */

const BUILD_TRIGGERED_MANUALLY = 'triggered-manually';
const BUILD_TRIGGERED_BY_WEBHOOK = 'triggered-by-webhook';
const BUILD_TRIGGERED_BY_POLLER = 'triggered-by-poller';


function getBuildId(build) {
  return parseInt(build.self_link.split('/').pop(), 10);
}


export {
  BUILD_TRIGGERED_MANUALLY,
  BUILD_TRIGGERED_BY_WEBHOOK,
  BUILD_TRIGGERED_BY_POLLER,
  getBuildId
};
