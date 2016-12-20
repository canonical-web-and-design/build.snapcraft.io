/* Copyright 2011-2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 */

import expect from 'expect';

import { normalizeURI } from '../../../../../src/server/launchpad/uri';

describe('normalizeURI', () => {
  it('handles absolute URI', () => {
    const result = normalizeURI(
      'http://www.example.com/path',
      'http://www.example.com/path/devel/foo');
    expect(result).toEqual('http://www.example.com/path/devel/foo');
  });

  it('handles absolute URI without inserting service base', () => {
    const result = normalizeURI(
      'http://www.example.com/path', 'http://www.example.com/path/foo/bar');
    expect(result).toEqual('http://www.example.com/path/foo/bar');
  });

  it('prepends base URI and service base to relative URI', () => {
    const result = normalizeURI('http://www.example.com/path', '/foo/bar');
    expect(result).toEqual('http://www.example.com/path/devel/foo/bar');
  });

  it('prepends base URI to relative URI with service base', () => {
    const result = normalizeURI(
      'http://www.example.com/path', '/path/devel/foo/bar');
    expect(result).toEqual('http://www.example.com/path/devel/foo/bar');
  });

  it('prepends base URI and service base to /-less relative URI', () => {
    const result = normalizeURI('http://www.example.com/path', 'foo/bar');
    expect(result).toEqual('http://www.example.com/path/devel/foo/bar');
  });

  it('prepends base URI to /-less relative URI with service base', () => {
    const result = normalizeURI(
      'http://www.example.com/path', 'path/devel/foo/bar');
    expect(result).toEqual('http://www.example.com/path/devel/foo/bar');
  });
});
