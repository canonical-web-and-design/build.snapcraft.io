/* Copyright 2009-2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * URI handling for the Launchpad API.
 */

import url from 'url';

/**
 * Converts an absolute URI into a relative URI.
 * Prepends the root to a relative URI that lacks the root.
 * Does nothing to a relative URI that includes the root.
 */
export function normalizeURI(base_uri, uri) {
  const base_parsed = url.parse(base_uri);
  const service_base = base_parsed.pathname.replace(/\/+$/, '') + '/api/devel';
  const parsed = url.parse(uri);

  if (parsed.host !== null) {
    // e.g. 'http://www.example.com/api/devel/foo';
    // Don't try to insert the service base into what was an absolute URL.
    // So 'http://www.example.com/foo' remains unchanged.
  } else {
    if (!parsed.pathname.startsWith('/')) {
      // e.g. 'api/devel/foo' or 'foo'
      parsed.pathname = '/' + parsed.pathname;
    }
    if (!parsed.pathname.startsWith(service_base)) {
      // e.g. '/foo'
      parsed.pathname = service_base + parsed.pathname;
    }
  }

  parsed.protocol = base_parsed.protocol;
  parsed.host = base_parsed.host;

  return url.format(parsed);
}
