/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Helpers for recording build annotations.
 */

const BUILD_TRIGGERED_MANUALLY = 'triggered-manually';
const BUILD_TRIGGERED_BY_WEBHOOK = 'triggered-by-webhook';
const BUILD_TRIGGERED_BY_POLLER = 'triggered-by-poller';
const BUILD_TRIGGER_UNKNOWN = 'trigger-unknown';


function getLinkId(link) {
  return parseInt(link.split('/').pop(), 10);
}


function getSelfId(entry) {
  return getLinkId(entry.self_link);
}


export {
  BUILD_TRIGGERED_MANUALLY,
  BUILD_TRIGGERED_BY_WEBHOOK,
  BUILD_TRIGGERED_BY_POLLER,
  BUILD_TRIGGER_UNKNOWN,
  getLinkId,
  getSelfId
};
